import { useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStore } from '../lib/mockStore';
import type { ChatMessage, Profile } from '../types/database';

export interface ChatConversation {
  student: Profile;
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeChatRef = useRef<{ otherUserId: string; currentUserId: string } | null>(null);

  const fetchMessages = useCallback(async (otherUserId: string, currentUserId: string) => {
    activeChatRef.current = { otherUserId, currentUserId };
    setMessages([]);
    setLoading(true);
    setError(null);

    let fetched: ChatMessage[] = [];
    if (isSupabaseConfigured) {
      try {
        const { data, error: sbError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:sender_id(id, full_name, email, role, profile_image_url),
            receiver:receiver_id(id, full_name, email, role, profile_image_url)
          `)
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true });

        if (!sbError && data && data.length > 0) {
          fetched = data;
        }
      } catch (err: any) {
        console.warn('Supabase fetchMessages fallback to mockStore:', err.message);
      }
    }

    if (fetched.length === 0) {
      try {
        const fallbackData = await mockStore.getMessages(otherUserId, currentUserId);
        fetched = fallbackData;
      } catch (e) {
        console.error('mockStore getMessages error:', e);
      }
    }

    if (activeChatRef.current?.otherUserId === otherUserId) {
      setMessages(fetched);
      setLoading(false);
    }
  }, []);

  const fetchConversations = useCallback(async (adminId?: string) => {
    setLoading(true);
    setError(null);
    const defaultAdminId = 'a0000000-0000-0000-0000-000000000001';
    const effectiveAdminId = adminId || defaultAdminId;

    // Helper for non-hanging Supabase checks (1200ms max timeout)
    const fastPromise = async <T>(promise: PromiseLike<T>, timeoutMs = 1200): Promise<T | null> => {
      try {
        const timeout = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), timeoutMs)
        );
        return await Promise.race([Promise.resolve(promise), timeout]);
      } catch {
        return null;
      }
    };

    // 1. Gather students from Supabase (if configured, with fast timeout)
    let supabaseStudents: Profile[] = [];
    if (isSupabaseConfigured) {
      try {
        const res: any = await fastPromise(
          supabase.from('profiles').select('*').eq('role', 'student')
        );
        if (res && !res.error && Array.isArray(res.data) && res.data.length > 0) {
          supabaseStudents = res.data;
          mockStore.syncProfiles(res.data);
        }
      } catch (err: any) {
        console.warn('Could not fetch profiles from Supabase, using mock store:', err?.message);
      }
    }

    // 2. Gather students from local mockStore
    const mockStudents = mockStore.getAllStudents();

    // 3. Merge both lists, deduplicating by email or id
    const studentMap = new Map<string, Profile>();
    mockStudents.forEach((s) => {
      const key = (s.email || s.id).toLowerCase();
      studentMap.set(key, s);
    });
    supabaseStudents.forEach((s) => {
      const key = (s.email || s.id).toLowerCase();
      studentMap.set(key, s);
    });

    const allStudents = Array.from(studentMap.values());

    // 4. Try to fetch messages from Supabase (fast timeout)
    let supabaseMessages: ChatMessage[] = [];
    if (isSupabaseConfigured) {
      try {
        const res: any = await fastPromise(
          supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${effectiveAdminId},receiver_id.eq.${effectiveAdminId}`)
            .order('created_at', { ascending: false })
        );
        if (res && !res.error && Array.isArray(res.data)) {
          supabaseMessages = res.data;
        }
      } catch {
        // Table doesn't exist yet or timeout, non-fatal
      }
    }

    // 5. Build conversation item for EVERY enrolled student
    const convos: ChatConversation[] = await Promise.all(
      allStudents.map(async (student) => {
        // Check if there are Supabase messages
        const sbMsgs = supabaseMessages.filter(
          (m: ChatMessage) =>
            (m.sender_id === student.id && m.receiver_id === effectiveAdminId) ||
            (m.sender_id === effectiveAdminId && m.receiver_id === student.id)
        );

        if (sbMsgs.length > 0) {
          const lastMessage = sbMsgs[0] || null;
          const unreadCount = sbMsgs.filter(
            (m: ChatMessage) => m.sender_id === student.id && !m.is_read
          ).length;
          return { student, lastMessage, unreadCount };
        }

        // Check mockStore messages (also matches default admin ID)
        const mockMsgs = await mockStore.getMessages(student.id, effectiveAdminId);
        const lastMessage = mockMsgs.length > 0 ? mockMsgs[mockMsgs.length - 1] : null;
        const unreadCount = mockMsgs.filter(
          (m) => m.sender_id === student.id && !m.is_read
        ).length;

        return {
          student,
          lastMessage,
          unreadCount,
        };
      })
    );

    // 6. Sort conversations: most recent message first, then alphabetical by name
    convos.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return a.student.full_name.localeCompare(b.student.full_name);
    });

    setConversations(convos);
    setLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (senderId: string, receiverId: string, messageText: string): Promise<ChatMessage> => {
      const trimmed = messageText.trim();
      if (!trimmed) throw new Error('Message cannot be empty');

      if (isSupabaseConfigured) {
        try {
          const { data, error: sbError } = await supabase
            .from('messages')
            .insert({
              sender_id: senderId,
              receiver_id: receiverId,
              message: trimmed,
              is_read: false,
            })
            .select(`
              *,
              sender:sender_id(id, full_name, email, role, profile_image_url),
              receiver:receiver_id(id, full_name, email, role, profile_image_url)
            `)
            .single();

          if (!sbError && data) {
            setMessages((prev) => [...prev, data]);
            return data;
          }
        } catch (err: any) {
          console.warn('Supabase sendMessage fallback to mockStore:', err.message);
        }
      }

      const newMsg = await mockStore.sendMessage(senderId, receiverId, trimmed);
      setMessages((prev) => [...prev, newMsg]);
      return newMsg;
    },
    []
  );

  const markAsRead = useCallback(async (senderId: string, receiverId: string) => {
    // Immediately clear unreadCount for this sender in local conversations state
    setConversations((prev) =>
      prev.map((c) => (c.student.id === senderId ? { ...c, unreadCount: 0 } : c))
    );

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .match({ sender_id: senderId, receiver_id: receiverId, is_read: false });
      } catch {
        // Table doesn't exist yet, fallback below
      }
    }

    await mockStore.markMessagesRead(senderId, receiverId);
    setMessages((prev) =>
      prev.map((m) => (m.sender_id === senderId && m.receiver_id === receiverId ? { ...m, is_read: true } : m))
    );
  }, []);

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
