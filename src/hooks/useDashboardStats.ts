import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStore } from '../lib/mockStore';
import type { DashboardStats } from '../types/database';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const mockData = await mockStore.getDashboardStats();
        setStats(mockData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      // Try RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_stats');
      
      if (!rpcError && rpcData) {
        setStats(rpcData as DashboardStats);
        return;
      }

      // Fallback to manual counts
      const [
        { count: totalStudents },
        { count: activeStudents },
        { count: totalSeats },
        { count: availableSeats },
        { count: occupiedSeats },
        { count: maintenanceSeats }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'active'),
        supabase.from('seats').select('*', { count: 'exact', head: true }),
        supabase.from('seats').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('seats').select('*', { count: 'exact', head: true }).eq('status', 'occupied'),
        supabase.from('seats').select('*', { count: 'exact', head: true }).eq('status', 'maintenance')
      ]);

      const total = totalSeats || 0;
      const occupied = occupiedSeats || 0;
      const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

      setStats({
        total_students: totalStudents || 0,
        active_students: activeStudents || 0,
        total_seats: total,
        available_seats: availableSeats || 0,
        occupied_seats: occupied,
        maintenance_seats: maintenanceSeats || 0,
        occupancy_rate: occupancyRate
      });
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch') || !navigator.onLine) {
        console.warn('Network issue fetching stats, falling back to mock store');
        const mockData = await mockStore.getDashboardStats();
        setStats(mockData);
      } else {
        setError(err.message || 'Failed to fetch dashboard statistics');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
}
