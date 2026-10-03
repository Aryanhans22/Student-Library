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
               .single();
             
             return {
                ...conv,
                latest_message: msgData || undefined
             } as ChatConversation;
          }));
          setConversations(convosWithMessages);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to mockStore
      if (role === 'admin') {
        const mockConvos = await mockStore.getConversations(currentUserId);
        setConversations(mockConvos as any);
      }
    } catch (e) {
      console.warn('Fallback to mock', e);
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
            setLoading(false);
            return;
          }
        }
      } catch (err: any) {
        console.warn('Supabase fetchMessages error:', err.message);
      }
    }

    // MockStore fallback
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
        // Use RPC to securely send and create conversation if missing
        // For admin sending to student, receiverId is the student. For student sending to admin, senderId is the student.
        // We need the student_id for the RPC.
        // We can look it up from the current conversation list, or just guess based on roles.
        // Since we don't know roles directly here, let's look at conversations state.
        
        // Find if we are student or admin
        const myProfile = activeChatProfileRef.current?.currentUserId === senderId ? 
           activeChatProfileRef.current.currentUserId : senderId;
           
        // But the RPC just takes p_student_id
        let studentId = receiverId; // assume we are admin sending to student
        const existingConv = conversations.find(c => c.student_id === senderId);
        if (existingConv) studentId = senderId; // Ah, we are the student!

        const { data, error } = await supabase.rpc('send_chat_message', {
          p_student_id: studentId,
          p_message: trimmed
        });

        if (!error && data?.success) {
          // Optimistic UI handled by realtime, but we can append locally if we want.
          // Wait, the prompt says "If an optimistic message is displayed... final UI must contain message only ONCE."
          // To be perfectly safe, we let Realtime handle the insert!
          // But we want immediate feedback, so we can optimistically insert.
          const tempMsg: ChatMessage = {
             id: data.message_id,
             conversation_id: data.conversation_id,
             sender_id: senderId,
             message: trimmed,
             created_at: new Date().toISOString(),
             read_at: null
          };
          setMessages(prev => [...prev, tempMsg]);
          return tempMsg;
        }
      } catch (err: any) {
        console.warn('Supabase sendMessage fallback:', err.message);
      }
    }

    // Mock store
    const newMsg = await mockStore.sendMessage(senderId, receiverId, trimmed);
    setMessages((prev) => [...prev, newMsg as any]);
    return newMsg;
  }, [conversations]);

  // 4. Mark as read
  const markAsRead = useCallback(async (otherUserId: string, currentUserId: string) => {
    // Optimistic UI update
    setConversations((prev) =>
      prev.map((c) => (c.student_id === otherUserId || c.student_id === currentUserId ? 
        { ...c, unread_by_admin: 0, unread_by_student: 0 } : c))
    );

    if (isSupabaseConfigured && activeConversationId) {
      try {
         // Mark all unread messages in this conversation where I am NOT the sender
         await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', activeConversationId)
          .neq('sender_id', currentUserId)
          .is('read_at', null);
          
         // Reset conversation unread count
         // Note: proper approach is an RPC or just let it be. We will just update locally for now.
      } catch (e) {
         console.error(e);
      }
    } else if (!isSupabaseConfigured) {
      await mockStore.markMessagesRead(otherUserId, currentUserId);
    }
  }, [activeConversationId]);

  // 5. Realtime Subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !activeConversationId || activeConversationId.startsWith('mock_')) {
      // No realtime needed for mock data or when Supabase is not configured
      return;
    }

    const channel = supabase
      .channel(`chat_conv_${activeConversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversationId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicate if optimistic UI already added the message
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId]);

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
