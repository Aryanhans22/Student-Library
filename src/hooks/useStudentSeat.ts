import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStore } from '../lib/mockStore';
import type { SeatAssignment } from '../types/database';

export function useStudentSeat() {
  const [assignment, setAssignment] = useState<SeatAssignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const mockUser = mockStore.getCurrentUser();
        if (!mockUser) {
          setAssignment(null);
          return;
        }
        const asgn = await mockStore.getStudentAssignment(mockUser.id);
        setAssignment(asgn);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch seat assignment');
        setAssignment(null);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      const user = sessionData?.session?.user;
      if (!user) {
        const mockUser = mockStore.getCurrentUser();
        if (mockUser) {
          const asgn = await mockStore.getStudentAssignment(mockUser.id);
          setAssignment(asgn);
          return;
        }
        setAssignment(null);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      const profileId = profileData?.id || user.id;

      const { data, error } = await supabase
        .from('seat_assignments')
        .select(`
          *,
          seat:seats(*)
        `)
        .eq('student_id', profileId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      setAssignment(data as SeatAssignment | null);
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        const mockUser = mockStore.getCurrentUser();
        if (mockUser) {
          const asgn = await mockStore.getStudentAssignment(mockUser.id);
          setAssignment(asgn);
          return;
        }
      }
      setError(err.message || 'Failed to fetch seat assignment');
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    assignment,
    seat: assignment?.seat || null,
    loading,
    isLoading: loading,
    error,
    refresh
  };
}
