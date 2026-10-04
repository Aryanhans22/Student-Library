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
      // 1. Try to sync contextual notifications (welcome, expiry, unread chats)
      try {
        await supabase.rpc('check_and_sync_notifications');
      } catch (_) {
        // Function may not exist yet, continue safely
      }

      // 2. Fetch live notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setNotifications(data);
      } else {
        // If DB has none yet, check mockStore fallback or seed initial
        const fallback = await mockStore.getNotifications(targetId);
        setNotifications(fallback || []);
      }
    } catch (err: any) {
      console.warn('Supabase fetchNotifications error, using mockStore fallback:', err.message);
      const fallback = await mockStore.getNotifications(targetId);
      setNotifications(fallback || []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markRead = useCallback(async (notificationId: string) => {
    // Optimistic UI update
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
      console.warn('markRead error, falling back:', err);
      await mockStore.markNotificationRead(notificationId);
    }
  }, []);

  const markAllAsRead = useCallback(async (uid?: string) => {
    const targetId = uid || userId;
    if (!targetId) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    if (!isSupabaseConfigured) {
      notifications.forEach((n) => mockStore.markNotificationRead(n.id));
      return;
    }

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', targetId)
        .eq('is_read', false);
    } catch (err) {
      console.warn('markAllAsRead error:', err);
      notifications.forEach((n) => mockStore.markNotificationRead(n.id));
    }
  }, [userId, notifications]);

  const clearAll = useCallback(async (uid?: string) => {
    const targetId = uid || userId;
    if (!targetId) return;

    // Optimistic clear
    setNotifications([]);

    if (!isSupabaseConfigured) {
      await mockStore.clearAllNotifications(targetId);
      return;
    }

    try {
      const { error } = await supabase.from('notifications').delete().eq('user_id', targetId);
      if (error) throw error;
    } catch (err) {
      console.warn('clearAll error:', err);
      await mockStore.clearAllNotifications(targetId);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
      
      if (isSupabaseConfigured) {
        // Listen to all real-time changes on public.notifications for this user
        const channel = supabase
          .channel(`notifs_realtime_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                const newNotif = payload.new as AppNotification;
                setNotifications((prev) => {
                  if (prev.some((n) => n.id === newNotif.id)) return prev;
                  return [newNotif, ...prev];
                });
              } else if (payload.eventType === 'UPDATE') {
                const updated = payload.new as AppNotification;
                setNotifications((prev) =>
                  prev.map((n) => (n.id === updated.id ? updated : n))
                );
              } else if (payload.eventType === 'DELETE') {
                const deletedId = (payload.old as any)?.id;
                if (deletedId) {
                  setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
                } else {
                  setNotifications([]);
                }
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } else {
        // MockStore cross-tab storage sync
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === 'library_notifications') {
            mockStore.getNotifications(userId).then((notifs) => setNotifications(notifs));
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
    markAllAsRead,
    clearAll,
  };
}
