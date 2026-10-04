import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { 
  MessageSquare, Send, Search, Check, CheckCheck, User, 
  ExternalLink, Sparkles, RefreshCw 
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const QUICK_RESPONSES = [
  'Hello! How can I assist you with your library access today?',
  'Your desk allocation is confirmed. You may take your seat.',
  'Your membership plan has been successfully updated.',
  'Please visit the library reception desk for physical ID verification.',
  'Quiet hours are strictly observed from 10:00 AM to 6:00 PM.',
];

const DEFAULT_ADMIN_ID = 'a0000000-0000-0000-0000-000000000001';

export default function AdminMessages() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUrlStudent = searchParams.get('student');

  const { conversations, messages, loading, fetchConversations, fetchMessages, sendMessage, markAsRead } = useChat();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialUrlStudent);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  const effectiveAdminId = profile?.id || DEFAULT_ADMIN_ID;

  // Load conversations
  useEffect(() => {
    fetchConversations(effectiveAdminId, 'admin');
  }, [effectiveAdminId, fetchConversations]);

  // Initial student selection - run when conversations load
  useEffect(() => {
    if (conversations.length === 0) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      const urlId = searchParams.get('student');
      const foundInConvos = conversations.find((c) => c.student?.id === urlId);
      if (foundInConvos && foundInConvos.student) {
        setSelectedStudentId(foundInConvos.student.id);
      } else {
        const firstId = conversations[0]?.student?.id;
        if (firstId) {
          setSelectedStudentId(firstId);
          setSearchParams({ student: firstId }, { replace: true });
        }
      }
    } else {
      // If currently selected student was removed or doesn't exist, fallback safely
      if (selectedStudentId && !conversations.some((c) => c.student?.id === selectedStudentId)) {
        const fallbackId = conversations[0]?.student?.id;
        if (fallbackId) {
          setSelectedStudentId(fallbackId);
          setSearchParams({ student: fallbackId }, { replace: true });
        }
      }
    }
  }, [conversations, searchParams, setSearchParams, selectedStudentId]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchMessages(selectedStudentId, effectiveAdminId);
      markAsRead(selectedStudentId, effectiveAdminId);
    }
  }, [selectedStudentId, effectiveAdminId, fetchMessages, markAsRead]);

  // When messages arrive or update, mark unread messages from student as read
  useEffect(() => {
    if (selectedStudentId && effectiveAdminId && messages.length > 0) {
      const hasUnread = messages.some((m) => m.sender_id === selectedStudentId && (!m.read_at || !m.is_read));
      if (hasUnread) {
        markAsRead(selectedStudentId, effectiveAdminId);
      }
    }
  }, [messages, selectedStudentId, effectiveAdminId, markAsRead]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectStudent = (studentId: string) => {
    if (studentId === selectedStudentId) return;
    setSelectedStudentId(studentId);
    setSearchParams({ student: studentId }, { replace: true });
  };

  const selectedConversation = conversations.find((c) => c.student?.id === selectedStudentId);
  const selectedStudent = selectedConversation?.student;

  const filteredConversations = conversations.filter((c) => {
    if (!c.student) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.student.full_name.toLowerCase().includes(q) ||
      c.student.email.toLowerCase().includes(q) ||
      (c.student.student_id && c.student.student_id.toLowerCase().includes(q)) ||
      (c.student.phone && c.student.phone.includes(q))
    );
  });

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedStudentId || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await sendMessage(effectiveAdminId, selectedStudentId, textToSend);
      fetchConversations(effectiveAdminId, 'admin');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) {
      toast.error('Please enter a message to broadcast');
      return;
    }
    
    setBroadcasting(true);
    let successCount = 0;
    
    try {
      // Create an array of student IDs
      const studentIds = conversations.map(c => c.student?.id).filter(Boolean) as string[];
      
      if (studentIds.length === 0) {
        toast.error('No students found to message');
        setBroadcasting(false);
        return;
      }
      
      // Send messages concurrently or sequentially
      // We will do it sequentially to avoid overwhelming the mock store / backend
      for (const id of studentIds) {
        try {
          await sendMessage(effectiveAdminId, id, broadcastText.trim());
          successCount++;
        } catch (e) {
          console.error(`Failed to send to ${id}`, e);
        }
      }
      
      toast.success(`Broadcast sent to ${successCount} students`);
      setShowBroadcastModal(false);
      setBroadcastText('');
      fetchConversations(effectiveAdminId, 'admin');
      if (selectedStudentId) fetchMessages(selectedStudentId, effectiveAdminId);
      
    } catch (err: any) {
      toast.error(err.message || 'Failed to send broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleQuickResponse = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-indigo-600" />
            Student Helpdesk & Messages
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Direct real-time communication between library administration and enrolled students.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<MessageSquare className="h-4 w-4" />}
            onClick={() => setShowBroadcastModal(true)}
          >
            Broadcast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => {
              fetchConversations(effectiveAdminId, 'admin');
              if (selectedStudentId) fetchMessages(selectedStudentId, effectiveAdminId);
              toast.success('Messages refreshed');
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Split-Pane Container */}
      <div className="flex-1 min-h-0 mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex overflow-hidden">
        {/* Left Pane: Conversations List */}
        <div className="w-80 sm:w-96 border-r border-gray-200 flex flex-col bg-gray-50/50">
          {/* Search Header */}
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Students ({filteredConversations.length})
              </span>
              {loading && <span className="text-xs text-indigo-600 font-medium animate-pulse">Syncing...</span>}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const { student, latest_message, unread_by_admin } = conv;
                if (!student) return null;
                const isSelected = student.id === selectedStudentId;
                const isFromMe = latest_message?.sender_id === effectiveAdminId || latest_message?.sender_id === DEFAULT_ADMIN_ID;

                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => handleSelectStudent(student.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors focus:outline-none focus:ring-0 select-none cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 border-l-4 border-indigo-600 shadow-2xs'
                        : 'hover:bg-gray-100/80 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar name={student.full_name} src={student.profile_image_url || undefined} size="md" />
                      {unread_by_admin > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white">
                          {unread_by_admin}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                          {student.full_name}
                        </span>
                        {latest_message && (
                          <span className="text-[11px] text-gray-400 ml-1 flex-shrink-0">
                            {new Date(latest_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px] font-medium text-gray-500 bg-gray-200/60 px-1.5 py-0.5 rounded">
                          {student.student_id || 'Student'}
                        </span>
                      </div>

                      <p className={`text-xs truncate ${unread_by_admin > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                        {latest_message ? (
                          <>
                            {isFromMe ? <span className="text-gray-400 font-medium">You: </span> : null}
                            {latest_message.message}
                          </>
                        ) : (
                          <span className="italic text-gray-400">No messages yet</span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedStudent ? (
            <>
              {/* Thread Header */}
              <div className="px-6 py-3.5 border-b border-gray-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedStudent.full_name} src={selectedStudent.profile_image_url || undefined} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900">{selectedStudent.full_name}</h2>
                      <Badge variant="active" size="sm">
                        {selectedStudent.student_id || 'Active Student'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {selectedStudent.email} • {selectedStudent.phone || 'No phone'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/students/${selectedStudent.id}`}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Messages Bubble Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/40">
                {loading && messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-gray-400 text-sm">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">Start a conversation</h3>
                    <p className="text-sm text-gray-500 max-w-sm mt-1">
                      Send a welcome message or answer inquiries from {selectedStudent.full_name}.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id !== selectedStudent.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <Avatar
                            name={selectedStudent.full_name}
                            src={selectedStudent.profile_image_url || undefined}
                            size="sm"
                          />
                        )}
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-2xs ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-xs'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isMe ? 'text-indigo-200' : 'text-gray-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && (
                              (msg.read_at || msg.is_read) ? (
                                <span title="Read by student" className="inline-flex items-center">
                                  <CheckCheck className="h-3.5 w-3.5 text-sky-300" />
                                </span>
                              ) : (
                                <span title="Sent" className="inline-flex items-center">
                                  <Check className="h-3.5 w-3.5 text-indigo-200/80" />
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none">
                <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 flex-shrink-0">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Quick:
                </span>
                {QUICK_RESPONSES.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickResponse(chip)}
                    className="flex-shrink-0 text-xs bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-gray-600 px-3 py-1 rounded-full border border-gray-200 transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-0"
                  >
                    {chip.length > 35 ? `${chip.slice(0, 35)}...` : chip}
                  </button>
                ))}
              </div>

              {/* Send Input Bar */}
              <form onSubmit={handleSend} className="p-3.5 border-t border-gray-200 bg-white flex items-center gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Write a message to ${selectedStudent.full_name}...`}
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!inputText.trim() || sending}
                  loading={sending}
                  icon={<Send className="h-4 w-4" />}
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <MessageSquare className="h-12 w-12 mb-3 opacity-30 text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-700">No Student Selected</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                Choose a student from the left conversation list to read history and send messages.
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showBroadcastModal}
        onClose={() => !broadcasting && setShowBroadcastModal(false)}
        title="Broadcast Message"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Send a direct message to <strong>all {conversations.length} enrolled students</strong>. This is useful for library-wide announcements, holiday notices, or urgent alerts.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="Type your announcement here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none"
              disabled={broadcasting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowBroadcastModal(false)}
              disabled={broadcasting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleBroadcast}
              disabled={!broadcastText.trim() || broadcasting}
              loading={broadcasting}
              icon={<Send className="h-4 w-4" />}
            >
              Send to {conversations.length} Students
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
