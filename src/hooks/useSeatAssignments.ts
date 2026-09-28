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

  const assignSeat = useCallback(async (studentId: string, seatId: string, adminId?: string) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const finalAdminId = await getAdminId(adminId);
        return await mockStore.assignSeat(studentId, seatId, finalAdminId || undefined);
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
      return data as { success: boolean; message?: string; error?: string };
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        const finalAdminId = await getAdminId(adminId);
        return await mockStore.assignSeat(studentId, seatId, finalAdminId || undefined);
      }
      setError(err.message || 'Failed to assign seat');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const changeSeat = useCallback(async (studentId: string, newSeatId: string, adminId?: string) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const finalAdminId = await getAdminId(adminId);
        return await mockStore.changeSeat(studentId, newSeatId, finalAdminId || undefined);
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
      return data as { success: boolean; message?: string; error?: string };
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        const finalAdminId = await getAdminId(adminId);
        return await mockStore.changeSeat(studentId, newSeatId, finalAdminId || undefined);
      }
      setError(err.message || 'Failed to change seat');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const releaseSeat = useCallback(async (assignmentId: string, adminId?: string) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const finalAdminId = await getAdminId(adminId);
        return await mockStore.releaseSeat(assignmentId, finalAdminId || undefined);
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
      return data as { success: boolean; message?: string; error?: string };
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        const finalAdminId = await getAdminId(adminId);
        return await mockStore.releaseSeat(assignmentId, finalAdminId || undefined);
      }
      setError(err.message || 'Failed to release seat');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    fetchAssignments();
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
