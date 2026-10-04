import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStore } from '../lib/mockStore';
import type { ChatMessage, ChatConversation, Profile } from '../types/database';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track active conversation for realtime
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const activeChatProfileRef = useRef<{ currentUserId: string, otherUserId: string } | null>(null);

  // 1. Fetch conversations for the current user
  const fetchConversations = useCallback(async (currentUserId: string, role: 'admin' | 'student') => {
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured) {
        // Build the query
        let query = supabase.from('conversations').select(`
          *,
          student:student_id(id, full_name, email, role, profile_image_url, student_id)
        `).order('last_message_at', { ascending: false });

        if (role === 'student') {
          query = query.eq('student_id', currentUserId);
        }

        const { data, error: fetchErr } = await query;
        
        if (!fetchErr && data) {
          // Fetch the latest message for each conversation
          const convosWithMessages = await Promise.all(data.map(async (conv) => {
             const { data: msgData } = await supabase
               .from('messages')
               .select('*')
               .eq('conversation_id', conv.id)
               .order('created_at', { ascending: false })
               .limit(1)
               .maybeSingle();
             
             return {
                ...conv,
                latest_message: msgData || undefined
             } as ChatConversation;
          }));

          // For admin: also include any registered students from Supabase who don't have a conversation yet
          if (role === 'admin') {
            const { data: allStudents } = await supabase
              .from('profiles')
              .select('id, full_name, email, role, profile_image_url, student_id')
              .eq('role', 'student');

            if (allStudents && allStudents.length > 0) {
              const existingStudentIds = new Set(convosWithMessages.map(c => c.student_id));
              const missingStudents = allStudents.filter(s => !existingStudentIds.has(s.id));
              
              const placeholderConvos = missingStudents.map(s => ({
                id: `new_${s.id}`,
                student_id: s.id,
                admin_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_message_at: new Date(0).toISOString(),
                status: 'active',
                unread_by_student: 0,
                unread_by_admin: 0,
                student: s,
                latest_message: undefined
              } as unknown as ChatConversation));

              setConversations([...convosWithMessages, ...placeholderConvos]);
              setLoading(false);
              return;
            }
          }

          setConversations(convosWithMessages);
          setLoading(false);
          return;
        } else if (fetchErr) {
          console.error('[HELPDESK] fetchConversations error:', fetchErr);
          setError(fetchErr.message);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to mockStore ONLY when Supabase is completely NOT configured
      if (!isSupabaseConfigured && role === 'admin') {
        const mockConvos = await mockStore.getConversations(currentUserId);
        setConversations(mockConvos as any);
      }
    } catch (e: any) {
      console.warn('[HELPDESK] Fetch conversations error:', e);
    }
    setLoading(false);
  }, []);

  // 2. Fetch messages for a specific chat
  const fetchMessages = useCallback(async (otherUserId: string, currentUserId: string) => {
    activeChatProfileRef.current = { otherUserId, currentUserId };
    setMessages([]);
    setLoading(true);

    if (isSupabaseConfigured) {
      try {
        // Find conversation ID first
        let convId: string | null = null;
        
        // As admin we look for student_id = otherUserId. As student we look for student_id = currentUserId.
        // Easiest is to just check both
        const { data: convs } = await supabase
          .from('conversations')
          .select('id')
          .or(`student_id.eq.${currentUserId},student_id.eq.${otherUserId}`)
          .limit(1);

        if (convs && convs.length > 0) {
          convId = convs[0].id;
          setActiveConversationId(convId);
          
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:sender_id(id, full_name, email, role, profile_image_url)
            `)
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });

          if (!error && data) {
            setMessages(data);

            // If there are unread messages from the other user, mark them as read immediately
            const hasUnread = data.some((m: any) => m.sender_id !== currentUserId && (!m.read_at || !m.is_read));
            if (hasUnread) {
              try {
                await supabase.rpc('mark_messages_read', { p_conversation_id: convId });
              } catch (_) {
                await supabase
                  .from('messages')
                  .update({ read_at: new Date().toISOString(), is_read: true })
                  .eq('conversation_id', convId)
                  .neq('sender_id', currentUserId);
              }
            }
          }
        } else {
          // No conversation yet, just set empty messages
          setActiveConversationId(`new_${otherUserId}`);
          setMessages([]);
        }
        setLoading(false);
        return; // Return here so we don't hit mock store fallback
      } catch (err: any) {
        console.warn('Supabase fetchMessages error:', err.message);
      }
    }

    // MockStore fallback (only if Supabase is not configured or failed unexpectedly)
    setActiveConversationId(`mock_${otherUserId}`);
    const fallbackData = await mockStore.getMessages(otherUserId, currentUserId);
    setMessages(fallbackData as any);
    setLoading(false);
  }, []);

  // 3. Send message
  const sendMessage = useCallback(async (senderId: string, receiverId: string, messageText: string): Promise<any> => {
    const trimmed = messageText.trim();
    if (!trimmed) throw new Error('Message cannot be empty');

    if (isSupabaseConfigured) {
      try {
        // Find if sender is student or admin
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', senderId).maybeSingle();
        const studentId = profile?.role === 'student' ? senderId : receiverId;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!isUuid.test(studentId)) {
          throw new Error('This student profile was from a previous demo session and does not exist in the live database. Please select a registered student from the list.');
        }

        const { data, error } = await supabase.rpc('send_chat_message', {
          p_student_id: studentId,
          p_message: trimmed
        });

        if (error) {
          console.error('[HELPDESK] send_chat_message RPC error:', error);
          throw new Error(error.message || 'Failed to send message');
        }

        if (data && !data.success) {
          console.error('[HELPDESK] send_chat_message business error:', data.error);
          throw new Error(data.error || 'Failed to send message');
        }

        if (data?.success) {
          const tempMsg: ChatMessage = {
             id: data.message_id,
             conversation_id: data.conversation_id,
             sender_id: senderId,
             message: trimmed,
             created_at: new Date().toISOString(),
             read_at: null
          };
          
          setMessages(prev => {
             if (prev.some(m => m.id === tempMsg.id)) return prev;
             return [...prev, tempMsg];
          });
          
          if (activeConversationId !== data.conversation_id) {
             setActiveConversationId(data.conversation_id);
          }
          
          return tempMsg;
        }
      } catch (err: any) {
        console.error('[HELPDESK] Supabase sendMessage error:', err);
        throw err;
      }
    }

    // Mock store
    const newMsg = await mockStore.sendMessage(senderId, receiverId, trimmed);
    return newMsg;
  }, [activeConversationId]);

  // 4. Mark as read
  const markAsRead = useCallback(async (otherUserId: string, currentUserId: string) => {
    // Optimistic UI update
    setConversations((prev) =>
      prev.map((c) => (c.student_id === otherUserId || c.student_id === currentUserId ? 
        { ...c, unread_by_admin: 0, unread_by_student: 0 } : c))
    );

    if (isSupabaseConfigured) {
      try {
        let convIdToUse = activeConversationId;
        if (!convIdToUse || convIdToUse.startsWith('mock_') || convIdToUse.startsWith('new_')) {
          const { data: convs } = await supabase
            .from('conversations')
            .select('id')
            .or(`student_id.eq.${currentUserId},student_id.eq.${otherUserId}`)
            .limit(1);
          if (convs && convs.length > 0) {
            convIdToUse = convs[0].id;
          }
        }

        if (convIdToUse && !convIdToUse.startsWith('mock_') && !convIdToUse.startsWith('new_')) {
          const { error: rpcErr } = await supabase.rpc('mark_messages_read', {
            p_conversation_id: convIdToUse
          });

          if (rpcErr) {
            await supabase
              .from('messages')
              .update({ read_at: new Date().toISOString(), is_read: true })
              .eq('conversation_id', convIdToUse)
              .neq('sender_id', currentUserId);
          }

          // Optimistically mark messages as read locally
          setMessages((prev) =>
            prev.map((m) =>
              m.sender_id !== currentUserId ? { ...m, is_read: true, read_at: m.read_at || new Date().toISOString() } : m
            )
          );
        }
      } catch (e) {
        console.error('[HELPDESK] markAsRead error:', e);
      }
    } else {
      await mockStore.markMessagesRead(otherUserId, currentUserId);
    }
  }, [activeConversationId]);

  // 5. Realtime Subscription for Active Conversation Messages
  useEffect(() => {
    if (!isSupabaseConfigured || !activeConversationId || activeConversationId.startsWith('mock_') || activeConversationId.startsWith('new_')) {
      return;
    }

    console.log(`[HELPDESK REALTIME] Subscribing to messages for conversation: ${activeConversationId}`);
    const channel = supabase
      .channel(`chat_conv_${activeConversationId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${activeConversationId}` 
        },
        (payload) => {
          console.log('[HELPDESK REALTIME] New message INSERT received:', payload.new);
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark incoming message as read since user is actively viewing this conversation
          (async () => {
            try {
              await supabase.rpc('mark_messages_read', { p_conversation_id: activeConversationId });
            } catch (_) {}
          })();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${activeConversationId}` 
        },
        (payload) => {
          console.log('[HELPDESK REALTIME] Message UPDATE received:', payload.new);
          const updatedMsg = payload.new as ChatMessage;
          setMessages((prev) => 
            prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
          );
        }
      )
      .subscribe((status, err) => {
        console.log(`[HELPDESK REALTIME] Channel status: ${status}`);
        if (status === 'CHANNEL_ERROR') {
          console.error('[HELPDESK REALTIME] Channel error details:', err);
        }
      });

    return () => {
      console.log(`[HELPDESK REALTIME] Removing channel for conversation: ${activeConversationId}`);
      supabase.removeChannel(channel);
    };
  }, [activeConversationId]);
  // Mock realtime listener for when Supabase is not configured
  useEffect(() => {
    if (isSupabaseConfigured || !activeConversationId || !activeConversationId.startsWith('mock_')) {
      return;
    }
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      const newMsg = custom.detail as any;
      if (!newMsg?.conversation_id) return;
      // Ensure the message belongs to the current mock conversation
      const otherId = activeConversationId.replace('mock_', '');
      if (!newMsg.conversation_id.includes(otherId)) return;
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    };
    window.addEventListener('mockChatInsert', handler);
    return () => {
      window.removeEventListener('mockChatInsert', handler);
    };
  }, [activeConversationId, isSupabaseConfigured]);

  return {
    messages,
    conversations,
    loading,
    error,
    fetchMessages,
    fetchConversations,
    sendMessage,
    markAsRead,
  };
}
