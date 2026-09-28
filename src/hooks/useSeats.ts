import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStore } from '../lib/mockStore';
import type { Seat, SeatStatus, SeatFormData } from '../types/database';

export function useSeats() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeats = useCallback(async (params?: { status?: SeatStatus | 'all'; search?: string; section?: string }) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const data = await mockStore.getSeats(params);
        setSeats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch seats');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      let query = supabase.from('seats').select('*');

      if (params?.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }
      
      if (params?.section) {
        query = query.eq('section', params.section);
      }

      if (params?.search) {
        query = query.or(`seat_number.ilike.%${params.search}%,section.ilike.%${params.search}%,floor.ilike.%${params.search}%`);
      }

      const { data, error } = await query.order('seat_number', { ascending: true });
      if (error) throw error;

      setSeats(data as Seat[]);
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch') || !navigator.onLine) {
        console.warn('Network issue fetching seats, falling back to mock store');
        const data = await mockStore.getSeats(params);
        setSeats(data);
      } else {
        setError(err.message || 'Failed to fetch seats');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Automatically fetch seats on mount
  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  const createSeat = useCallback(async (data: SeatFormData) => {
    setLoading(true);
    setError(null);

    const cleanData = {
      seat_number: data.seat_number?.trim(),
      floor: data.floor?.trim() || null,
      section: data.section?.trim() || null,
      row_number: typeof data.row_number === 'number' && !isNaN(data.row_number) ? data.row_number : null,
      column_number: typeof data.column_number === 'number' && !isNaN(data.column_number) ? data.column_number : null,
      status: data.status || 'available',
    };

    if (!isSupabaseConfigured) {
      try {
        const result = await mockStore.createSeat(cleanData as any);
        setSeats(prev => [...prev, result]);
        return result;
      } finally {
        setLoading(false);
      }
    }

    try {
      const { data: result, error } = await supabase
        .from('seats')
        .insert([cleanData])
        .select()
        .single();
      
      if (error) throw error;
      setSeats(prev => [...prev, result as Seat]);
      return result as Seat;
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        const result = await mockStore.createSeat(cleanData as any);
        setSeats(prev => [...prev, result]);
        return result;
      }
      setError(err.message || 'Failed to create seat');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSeat = useCallback(async (id: string, data: Partial<SeatFormData>) => {
    setLoading(true);
    setError(null);

    const cleanData: any = {};
    if (data.seat_number !== undefined) cleanData.seat_number = data.seat_number.trim();
    if (data.floor !== undefined) cleanData.floor = data.floor?.trim() || null;
    if (data.section !== undefined) cleanData.section = data.section?.trim() || null;
    if (data.row_number !== undefined) {
      cleanData.row_number = typeof data.row_number === 'number' && !isNaN(data.row_number) ? data.row_number : null;
    }
    if (data.column_number !== undefined) {
      cleanData.column_number = typeof data.column_number === 'number' && !isNaN(data.column_number) ? data.column_number : null;
    }
    if (data.status !== undefined) cleanData.status = data.status;

    if (!isSupabaseConfigured) {
      try {
        await mockStore.updateSeat(id, cleanData);
        setSeats(prev => prev.map(s => s.id === id ? { ...s, ...cleanData } as Seat : s));
        return;
      } finally {
        setLoading(false);
      }
    }

    try {
      const { error } = await supabase
        .from('seats')
        .update(cleanData)
        .eq('id', id);
      
      if (error) throw error;
      setSeats(prev => prev.map(s => s.id === id ? { ...s, ...cleanData } as Seat : s));
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        await mockStore.updateSeat(id, cleanData);
        setSeats(prev => prev.map(s => s.id === id ? { ...s, ...cleanData } as Seat : s));
        return;
      }
      setError(err.message || 'Failed to update seat');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSeat = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        await mockStore.deleteSeat(id);
        setSeats(prev => prev.filter(s => s.id !== id));
        return;
      } finally {
        setLoading(false);
      }
    }

    try {
      const { error } = await supabase
        .from('seats')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setSeats(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        await mockStore.deleteSeat(id);
        setSeats(prev => prev.filter(s => s.id !== id));
        return;
      }
      setError(err.message || 'Failed to delete seat');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    seats,
    loading,
    isLoading: loading,
    error,
    fetchSeats,
    createSeat,
    updateSeat,
    deleteSeat
  };
}
