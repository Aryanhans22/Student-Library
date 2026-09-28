import { useState, useCallback, useEffect } from 'react';
import { mockStore } from '../lib/mockStore';
import type { DemoBooking, DemoBookingFormData, DemoBookingStatus } from '../types/database';

export function useDemoBookings(autoFetch = false) {
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockStore.getDemoBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch demo bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  const bookDemo = useCallback(async (formData: DemoBookingFormData) => {
    setLoading(true);
    setError(null);
    try {
      const newBooking = await mockStore.bookDemo(formData);
      setBookings((prev) => [newBooking, ...prev]);
      return newBooking;
    } catch (err: any) {
      setError(err?.message || 'Failed to book demo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: DemoBookingStatus) => {
    try {
      await mockStore.updateDemoBookingStatus(id, status);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to update booking status');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchBookings();
    }
  }, [autoFetch, fetchBookings]);

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    bookDemo,
    updateStatus,
  };
}
