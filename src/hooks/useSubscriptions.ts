import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStore } from '../lib/mockStore';
import type { StudentSubscription } from '../types/database';

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<StudentSubscription[]>([]);
  const [subscription, setSubscription] = useState<StudentSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async (filters?: { status?: string; search?: string }) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const data = await mockStore.getSubscriptions(filters);
        setSubscriptions(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch subscriptions');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      let query = supabase
        .from('subscriptions')
        .select(`
          *,
          student:student_id(id, full_name, email, student_id, phone, status)
        `)
        .order('end_date', { ascending: true });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error: sbError } = await query;
      if (sbError) throw sbError;

      const processed = (data || []).map((sub: any) => {
        const diffDays = Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return {
          ...sub,
          days_remaining: diffDays,
        };
      });

      let filtered = processed;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = processed.filter(
          (s: any) =>
            s.student?.full_name?.toLowerCase().includes(q) ||
            s.student?.student_id?.toLowerCase().includes(q) ||
            s.plan_name?.toLowerCase().includes(q)
        );
      }

      setSubscriptions(filtered);
    } catch (err: any) {
      console.warn('Supabase fetchSubscriptions failed, falling back to mockStore:', err.message);
      const fallbackData = await mockStore.getSubscriptions(filters);
      setSubscriptions(fallbackData);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentSubscription = useCallback(async (studentId: string): Promise<StudentSubscription | null> => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const sub = await mockStore.getStudentSubscription(studentId);
        setSubscription(sub);
        return sub;
      } catch (err: any) {
        setError(err.message || 'Failed to fetch student subscription');
        return null;
      } finally {
        setLoading(false);
      }
    }

    try {
      const { data, error: sbError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          student:student_id(id, full_name, email, student_id, phone, status)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sbError) throw sbError;

      if (!data) {
        setSubscription(null);
        return null;
      }

      const diffDays = Math.ceil((new Date(data.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const subWithDays = {
        ...data,
        days_remaining: diffDays,
      };

      setSubscription(subWithDays);
      return subWithDays;
    } catch (err: any) {
      console.warn('Supabase fetchStudentSubscription failed, falling back to mockStore:', err.message);
      const sub = await mockStore.getStudentSubscription(studentId);
      setSubscription(sub);
      return sub;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubscription = useCallback(async (data: Partial<StudentSubscription>): Promise<StudentSubscription> => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const newSub = await mockStore.createSubscription(data);
        setSubscription(newSub);
        return newSub;
      } finally {
        setLoading(false);
      }
    }

    try {
      const { data: newSub, error: sbError } = await supabase
        .from('subscriptions')
        .insert({
          student_id: data.student_id,
          plan_name: data.plan_name || 'Monthly Study Pass',
          amount_paid: Number(data.amount_paid) || 999,
          start_date: data.start_date || new Date().toISOString().slice(0, 10),
          end_date: data.end_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          status: 'active',
          auto_renew: data.auto_renew ?? true,
        })
        .select()
        .single();

      if (sbError) throw sbError;
      setSubscription(newSub);
      return newSub;
    } catch (err: any) {
      console.warn('Supabase createSubscription failed, falling back to mockStore:', err.message);
      const newSub = await mockStore.createSubscription(data);
      setSubscription(newSub);
      return newSub;
    } finally {
      setLoading(false);
    }
  }, []);

  const renewSubscription = useCallback(
    async (subscriptionId: string, durationDays: number = 30, amountPaid: number = 999): Promise<StudentSubscription> => {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured) {
        try {
          const renewed = await mockStore.renewSubscription(subscriptionId, durationDays, amountPaid);
          setSubscription(renewed);
          return renewed;
        } finally {
          setLoading(false);
        }
      }

      try {
        // Fetch current subscription
        const { data: current, error: getErr } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('id', subscriptionId)
          .single();

        if (getErr) throw getErr;

        const currentEnd = new Date(current.end_date).getTime();
        const baseTime = currentEnd > Date.now() ? currentEnd : Date.now();
        const newEnd = new Date(baseTime + durationDays * 86400000);

        const { data: updated, error: updateErr } = await supabase
          .from('subscriptions')
          .update({
            end_date: newEnd.toISOString().slice(0, 10),
            amount_paid: (Number(current.amount_paid) || 0) + amountPaid,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscriptionId)
          .select()
          .single();

        if (updateErr) throw updateErr;

        setSubscription(updated);
        return updated;
      } catch (err: any) {
        console.warn('Supabase renewSubscription failed, falling back to mockStore:', err.message);
        const renewed = await mockStore.renewSubscription(subscriptionId, durationDays, amountPaid);
        setSubscription(renewed);
        return renewed;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    subscriptions,
    subscription,
    loading,
    error,
    fetchSubscriptions,
    fetchStudentSubscription,
    createSubscription,
    renewSubscription,
  };
}
