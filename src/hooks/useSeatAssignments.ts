import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStore } from '../lib/mockStore';
import type { SeatAssignment, AssignmentStatus } from '../types/database';

export function useSeatAssignments() {
  const [assignments, setAssignments] = useState<SeatAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAdminId = async (providedId?: string) => {
    if (providedId) return providedId;
    if (!isSupabaseConfigured) {
      return mockStore.getCurrentUser()?.id || null;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();
      return profile?.id || session.user.id;
    } catch {
      return mockStore.getCurrentUser()?.id || null;
    }
  };

  const getAssignments = useCallback(async (params?: { status?: AssignmentStatus }) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const all = await mockStore.getAssignments();
        if (params?.status) {
          return all.filter(a => a.status === params.status);
        }
        return all;
      } finally {
        setLoading(false);
      }
    }

    try {
      let query = supabase
        .from('seat_assignments')
        .select(`
          *,
          student:profiles(*),
          seat:seats(*)
        `);
      
      if (params?.status) {
        query = query.eq('status', params.status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      return data as SeatAssignment[];
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        const all = await mockStore.getAssignments();
        if (params?.status) {
          return all.filter(a => a.status === params.status);
        }
        return all;
      }
      setError(err.message || 'Failed to get assignments');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssignments = useCallback(async (params?: { status?: AssignmentStatus }) => {
    const data = await getAssignments(params);
    setAssignments(data);
    return data;
  }, [getAssignments]);

  const assignSeat = useCallback(async (studentId: string, seatId: string, adminId?: string) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const finalAdminId = await getAdminId(adminId);
        const res = await mockStore.assignSeat(studentId, seatId, finalAdminId || undefined);
        await fetchAssignments();
        return res;
      } finally {
        setLoading(false);
      }
    }

    try {
      const finalAdminId = await getAdminId(adminId);
      const { data, error } = await supabase.rpc('assign_seat', {
        p_student_id: studentId,
        p_seat_id: seatId,
        p_admin_id: finalAdminId
      });
      if (error) throw error;
      
      const result = data as { success: boolean; message?: string; error?: string };
      if (result && result.success) {
        try {
          await mockStore.assignSeat(studentId, seatId, finalAdminId || undefined);
        } catch {}
        await fetchAssignments();
      }
      return result;
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        const finalAdminId = await getAdminId(adminId);
        const mockRes = await mockStore.assignSeat(studentId, seatId, finalAdminId || undefined);
        await fetchAssignments();
        return mockRes;
      }
      setError(err.message || 'Failed to assign seat');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments]);

  const changeSeat = useCallback(async (studentId: string, newSeatId: string, adminId?: string) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const finalAdminId = await getAdminId(adminId);
        const res = await mockStore.changeSeat(studentId, newSeatId, finalAdminId || undefined);
        await fetchAssignments();
        return res;
      } finally {
        setLoading(false);
      }
    }

    try {
      const finalAdminId = await getAdminId(adminId);
      const { data, error } = await supabase.rpc('change_seat', {
        p_student_id: studentId,
        p_new_seat_id: newSeatId,
        p_admin_id: finalAdminId
      });
      if (error) throw error;
      const result = data as { success: boolean; message?: string; error?: string };
      if (result && result.success) {
        try {
          await mockStore.changeSeat(studentId, newSeatId, finalAdminId || undefined);
        } catch {}
        await fetchAssignments();
      }
      return result;
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        const finalAdminId = await getAdminId(adminId);
        const mockRes = await mockStore.changeSeat(studentId, newSeatId, finalAdminId || undefined);
        await fetchAssignments();
        return mockRes;
      }
      setError(err.message || 'Failed to change seat');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments]);

  const releaseSeat = useCallback(async (assignmentId: string, adminId?: string) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const finalAdminId = await getAdminId(adminId);
        const res = await mockStore.releaseSeat(assignmentId, finalAdminId || undefined);
        await fetchAssignments();
        return res;
      } finally {
        setLoading(false);
      }
    }

    try {
      const finalAdminId = await getAdminId(adminId);
      const { data, error } = await supabase.rpc('release_seat', {
        p_assignment_id: assignmentId,
        p_admin_id: finalAdminId
      });
      if (error) throw error;
      const result = data as { success: boolean; message?: string; error?: string };
      if (result && result.success) {
        try {
          await mockStore.releaseSeat(assignmentId, finalAdminId || undefined);
        } catch {}
        await fetchAssignments();
      }
      return result;
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        const finalAdminId = await getAdminId(adminId);
        const mockRes = await mockStore.releaseSeat(assignmentId, finalAdminId || undefined);
        await fetchAssignments();
        return mockRes;
      }
      setError(err.message || 'Failed to release seat');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments]);

  const getStudentAssignment = useCallback(async (studentId: string) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        return await mockStore.getStudentAssignment(studentId);
      } finally {
        setLoading(false);
      }
    }

    try {
      const { data, error } = await supabase
        .from('seat_assignments')
        .select(`
          *,
          seat:seats(*)
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      return data as SeatAssignment | null;
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        return await mockStore.getStudentAssignment(studentId);
      }
      setError(err.message || 'Failed to get student assignment');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('realtime_seat_assignments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seat_assignments' },
        () => {
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAssignments]);

  return {
    assignments,
    loading,
    isLoading: loading,
    error,
    assignSeat,
    changeSeat,
    releaseSeat,
    getStudentAssignment,
    getAssignments,
    fetchAssignments
  };
}
