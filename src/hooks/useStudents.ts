import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStore } from '../lib/mockStore';
import type { Profile, AccountStatus } from '../types/database';

export function useStudents() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchStudents = useCallback(async ({
    page = 1,
    pageSize = 10,
    limit,
    search,
    status = 'all',
    seatFilter = 'all',
    seatAssigned,
    sortBy = 'created_at',
    sortOrder = 'desc'
  }: {
    page?: number;
    pageSize?: number;
    limit?: number;
    search?: string;
    status?: AccountStatus | 'all' | string;
    seatFilter?: 'all' | 'assigned' | 'unassigned';
    seatAssigned?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | string;
  } = {}) => {
    setLoading(true);
    setError(null);
    const effectivePageSize = limit || pageSize;

    if (!isSupabaseConfigured) {
      try {
        const result = await mockStore.getStudents({
          page,
          pageSize: effectivePageSize,
          search,
          status,
          seatFilter: (seatAssigned === 'yes' ? 'assigned' : seatAssigned === 'no' ? 'unassigned' : seatFilter),
          sortBy,
          sortOrder,
        });
        setStudents(result.students);
        setTotalCount(result.total);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch students');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'student');

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      if (status && status !== 'all' && status !== '') {
        query = query.eq('status', status);
      }
      
      const from = (page - 1) * effectivePageSize;
      const to = from + effectivePageSize - 1;
      
      const { data, error, count } = await query
        .order(sortBy || 'created_at', { ascending: (sortOrder || 'desc') === 'asc' })
        .range(from, to);

      if (error) throw error;
      if (data) {
        mockStore.syncProfiles(data as Profile[]);
      }

      let enrichedStudents = (data as (Profile & { active_seat_number?: string | null })[]) || [];
      try {
        const { data: assignmentsData } = await supabase
          .from('seat_assignments')
          .select('student_id, seat:seats(seat_number)')
          .eq('status', 'active');

        if (assignmentsData) {
          const assignmentMap = new Map<string, string>();
          assignmentsData.forEach((a: any) => {
            if (a.student_id && a.seat?.seat_number) {
              assignmentMap.set(a.student_id, a.seat.seat_number);
            }
          });

          enrichedStudents = enrichedStudents.map(s => ({
            ...s,
            active_seat_number: assignmentMap.get(s.id) || null,
          }));

          const effectiveSeatFilter = seatAssigned === 'yes' ? 'assigned' : seatAssigned === 'no' ? 'unassigned' : seatFilter;
          if (effectiveSeatFilter === 'assigned') {
            enrichedStudents = enrichedStudents.filter(s => assignmentMap.has(s.id));
          } else if (effectiveSeatFilter === 'unassigned') {
            enrichedStudents = enrichedStudents.filter(s => !assignmentMap.has(s.id));
          }
        }
      } catch (assignErr) {
        console.warn('Failed to load assignments for student table:', assignErr);
      }

      setStudents(enrichedStudents as Profile[]);
      setTotalCount(count || enrichedStudents.length);
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch') || !navigator.onLine) {
        console.warn('Network issue fetching students, falling back to mock store');
        const result = await mockStore.getStudents({
          page,
          pageSize: effectivePageSize,
          search,
          status,
          seatFilter: (seatAssigned === 'yes' ? 'assigned' : seatAssigned === 'no' ? 'unassigned' : seatFilter),
          sortBy,
          sortOrder,
        });
        setStudents(result.students);
        setTotalCount(result.total);
      } else {
        setError(err.message || 'Failed to fetch students');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Automatically fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const getStudent = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured) {
      try {
        return await mockStore.getStudentById(id);
      } finally {
        setLoading(false);
      }
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Profile;
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        return await mockStore.getStudentById(id);
      }
      setError(err.message || 'Failed to get student');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createStudent = useCallback(async (data: Partial<Profile>) => {
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured) {
      try {
        return await mockStore.createStudent(data);
      } finally {
        setLoading(false);
      }
    }
    try {
      const studentId = data.student_id?.trim() || `STU${Math.floor(100000 + Math.random() * 900000)}`;
      const { data: result, error } = await supabase
        .from('profiles')
        .insert([{ ...data, student_id: studentId, role: 'student' }])
        .select()
        .single();
      if (error) throw error;
      if (result) {
        mockStore.syncProfiles([result as Profile]);
      }
      return result as Profile;
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        return await mockStore.createStudent(data);
      }
      setError(err.message || 'Failed to create student');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStudent = useCallback(async (id: string, data: Partial<Profile>) => {
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured) {
      try {
        await mockStore.updateProfile(id, data);
        return;
      } finally {
        setLoading(false);
      }
    }
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        await mockStore.updateProfile(id, data);
        return;
      }
      setError(err.message || 'Failed to update student');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleStudentStatus = useCallback(async (id: string, newStatus: AccountStatus) => {
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured) {
      try {
        await mockStore.updateProfile(id, { status: newStatus });
        return;
      } finally {
        setLoading(false);
      }
    }
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        await mockStore.updateProfile(id, { status: newStatus });
        return;
      }
      setError(err.message || 'Failed to toggle student status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    students,
    loading,
    isLoading: loading,
    error,
    totalCount,
    total: totalCount,
    fetchStudents,
    getStudent,
    createStudent,
    updateStudent,
    toggleStudentStatus
  };
}
