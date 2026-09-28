import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { 
  MessageSquare, Send, ShieldCheck, Check, CheckCheck, 
  Sparkles, RefreshCw, AlertCircle, ArrowLeft, Clock 
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ADMIN_ID = 'a0000000-0000-0000-0000-000000000001';

const STUDENT_FAQS = [
  'How do I renew my study pass?',
  'Can I request to change my desk?',
  'What are the library opening and closing hours?',
  'Is high-speed Wi-Fi available at all desks?',
  'What should I do if my desk light or socket is faulty?',
];

export default function StudentChat() {
  const { profile } = useAuth();
  const { messages, loading, fetchMessages, sendMessage, markAsRead } = useChat();

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchMessages(ADMIN_ID, profile.id);
      markAsRead(ADMIN_ID, profile.id);
    }
  }, [profile?.id, fetchMessages, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !profile?.id || sending) return;

    try {
      setSending(true);
      const textToSend = inputText;
      setInputText('');
      await sendMessage(profile.id, ADMIN_ID, textToSend);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSelectFaq = (question: string) => {
    setInputText(question);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/student/dashboard"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-indigo-600" />
              Helpdesk & Admin Support
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Need assistance with your seat, subscription, or library rules? Chat directly with the librarian.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          onClick={() => {
            if (profile?.id) {
              fetchMessages(ADMIN_ID, profile.id);
              toast.success('Chat refreshed');
            }
          }}
        >
          Refresh
        </Button>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
        {/* Support Representative Card */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar name="Library Admin" size="md" />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">Library Desk Helpdesk</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" /> Official Support
                </span>
              </div>
              <p className="text-xs text-gray-500">Typical response time: Within 10 minutes</p>
            </div>
          </div>
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/40">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Connecting to support...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-gray-800 text-base">How can we help you today?</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Ask about desk reservations, locker access, membership renewal, or quiet study zones.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === profile?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <Avatar
                      name="Library Admin"
                      size="sm"
                    />
                  )}
                  <div
                    className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-xs'
                    }`}
                  >
                    {!isMe && (
                      <p className="text-[11px] font-bold text-indigo-600 mb-0.5">Library Admin</p>
                    )}
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
                        msg.is_read ? (
                          <span title="Read by Admin">
                            <CheckCheck className="h-3 w-3 text-indigo-200" />
                          </span>
                        ) : (
                          <span title="Delivered">
                            <Check className="h-3 w-3 text-indigo-300" />
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

        {/* Suggested Quick Questions */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 flex-shrink-0">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Suggested:
          </span>
          {STUDENT_FAQS.map((faq, i) => (
            <button
              key={i}
              onClick={() => handleSelectFaq(faq)}
              className="flex-shrink-0 text-xs bg-white hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 px-3 py-1 rounded-full border border-gray-200 transition-colors shadow-2xs cursor-pointer"
            >
              {faq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question or request..."
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
      </div>
    </div>
  );
}
