import { supabase, isSupabaseConfigured } from './supabase';
import { mockStore } from './mockStore';
import type { RegisterFormData, Profile } from '../types/database';

export async function signIn(emailOrId: string, password: string) {
  const term = emailOrId.trim();

  // 1. If Supabase is configured, try Supabase Auth first
  if (isSupabaseConfigured) {
    try {
      let emailToTry = term;
      if (!term.includes('@')) {
        const found = await mockStore.findAccountByIdentifier(term);
        if (found?.email) {
          emailToTry = found.email;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToTry,
        password,
      });

      if (!error && data?.user) {
        return data;
      }
    } catch (err: any) {
      console.warn('Supabase auth attempt:', err?.message);
    }
  }

  // 2. Fallback: Always check mockStore (for accounts created by admin, reset passwords, or local users)
  try {
    const mockProfile = await mockStore.signIn(term, password);
    return {
      user: { id: mockProfile.auth_user_id, email: mockProfile.email } as any,
      session: { user: { id: mockProfile.auth_user_id, email: mockProfile.email } } as any,
      mockProfile,
    };
  } catch (mockErr: any) {
    throw new Error(mockErr.message || 'Invalid email or password.');
  }
}

export async function signUp(formData: RegisterFormData) {
  if (!isSupabaseConfigured) {
    const mockProfile = await mockStore.signUp(formData);
    return {
      user: { id: mockProfile.auth_user_id, email: mockProfile.email } as any,
      session: { user: { id: mockProfile.auth_user_id, email: mockProfile.email } } as any,
      mockProfile,
    };
  }

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error('Registration failed');
    
    // 2. Create profile
    const studentId = formData.student_id?.trim() || `STU${Math.floor(100000 + Math.random() * 900000)}`;
    const { error: profileError } = await supabase.from('profiles').insert({
      auth_user_id: authData.user.id,
      role: 'student',
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone || formData.mobile_number || null,
      student_id: studentId,
      date_of_birth: formData.date_of_birth || null,
      address: formData.address || null,
      emergency_contact: formData.emergency_contact || null,
      status: 'active',
    });
    if (profileError) throw profileError;
    
    return authData;
  } catch (err: any) {
    if (err?.message?.includes('Failed to fetch') || !navigator.onLine) {
      console.warn('Network error reaching Supabase, registering in local demo store.');
      const mockProfile = await mockStore.signUp(formData);
      return {
        user: { id: mockProfile.auth_user_id, email: mockProfile.email } as any,
        session: { user: { id: mockProfile.auth_user_id, email: mockProfile.email } } as any,
        mockProfile,
      };
    }
    throw err;
  }
}

export async function signOut() {
  await mockStore.signOut();
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut error ignored:', e);
    }
  }
}

export async function getProfile(authUserId: string): Promise<Profile | null> {
  const currentMock = mockStore.getCurrentUser();
  if (currentMock && currentMock.auth_user_id === authUserId) {
    return currentMock;
  }

  if (!isSupabaseConfigured) {
    return currentMock;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (err: any) {
    if (err?.message?.includes('Failed to fetch')) {
      return currentMock;
    }
    throw err;
  }
}

export async function updatePassword(newPassword: string) {
  if (!isSupabaseConfigured) {
    return mockStore.updatePassword(newPassword);
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  } catch (err: any) {
    if (err?.message?.includes('Failed to fetch')) {
      return mockStore.updatePassword(newPassword);
    }
    throw err;
  }
}
