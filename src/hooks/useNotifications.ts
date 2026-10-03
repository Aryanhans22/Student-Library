import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStore } from '../lib/mockStore';
import type { AppNotification } from '../types/database';

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async (uid?: string) => {
    const targetId = uid || userId;
    if (!targetId) return;

    setLoading(true);
    if (!isSupabaseConfigured) {
      try {
        const notifs = await mockStore.getNotifications(targetId);
        setNotifications(notifs);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      console.warn('Supabase fetchNotifications failed, falling back to mockStore:', err.message);
      const fallback = await mockStore.getNotifications(targetId);
      setNotifications(fallback);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );

    if (!isSupabaseConfigured) {
      await mockStore.markNotificationRead(notificationId);
      return;
    }

    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    } catch (err) {
      await mockStore.markNotificationRead(notificationId);
    }
  }, []);

  const clearAll = useCallback(async (uid?: string) => {
    const targetId = uid || userId;
    if (!targetId) return;

    setNotifications([]);

    if (!isSupabaseConfigured) {
      await mockStore.clearAllNotifications(targetId);
      return;
    }

    try {
      await supabase.from('notifications').delete().eq('user_id', targetId);
    } catch (err) {
      await mockStore.clearAllNotifications(targetId);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
      
      if (isSupabaseConfigured) {
        const channel = supabase
          .channel(`notifs_${userId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
            (payload) => {
              const newNotif = payload.new as AppNotification;
              setNotifications((prev) => {
                if (prev.some((n) => n.id === newNotif.id)) return prev;
                return [newNotif, ...prev];
              });
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } else {
        // MockStore realtime: listen to cross-tab localStorage changes
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === 'library_notifications') {
            mockStore.getNotifications(userId).then(notifs => setNotifications(notifs));
          }
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => {
          window.removeEventListener('storage', handleStorageChange);
        };
      }
    }
  }, [userId, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    clearAll,
  };
}
