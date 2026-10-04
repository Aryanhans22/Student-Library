import { supabase, isSupabaseConfigured } from './supabase';
import { mockStore } from './mockStore';
import type { RegisterFormData, Profile } from '../types/database';

export async function signIn(emailOrId: string, password: string) {
  const term = emailOrId.trim();

  // 1. If Supabase is configured, use Supabase Auth exclusively
  if (isSupabaseConfigured) {
    let emailToTry = term;
    if (!term.includes('@')) {
      // Look up student by student_id in Supabase profiles
      const { data: foundProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('student_id', term)
        .maybeSingle();
      
      if (foundProfile?.email) {
        emailToTry = foundProfile.email;
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToTry,
      password,
    });

    if (error) {
      throw new Error(error.message || 'Invalid email or password.');
    }

    if (data?.user) {
      return data;
    }
    throw new Error('Login failed. Please check your credentials.');
  }

  // 2. Fallback: Only when Supabase is NOT configured (offline / demo mode)
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
    const studentId = formData.student_id?.trim() || `STU${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Create auth user with metadata for database trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
          phone: formData.phone || formData.mobile_number || '',
          student_id: studentId,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address || null,
          emergency_contact: formData.emergency_contact || null,
          role: 'student',
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registration failed');
    
    // 2. Ensure profile exists and has all form fields
    try {
      await supabase.from('profiles').upsert({
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
      }, { onConflict: 'email' });
    } catch (profileErr) {
      console.warn('Profile sync handled by trigger or notice:', profileErr);
    }
    
    return authData;
  } catch (err: any) {
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
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (!data) {
      // Self-healing attempt: call sync_my_profile RPC to link existing profile by auth email
      try {
        const syncRes = await supabase.rpc('sync_my_profile');
        if (syncRes.data?.success) {
          const refetch = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', authUserId)
            .single();
          if (refetch.data) {
            data = refetch.data;
            error = null;
          }
        }
      } catch (syncErr) {
        // RPC might not exist yet if migration hasn't been run
      }
    }

    if (error && !data) {
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
