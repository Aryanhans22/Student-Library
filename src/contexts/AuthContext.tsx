import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStore } from '../lib/mockStore';
import { signIn as authSignIn, signUp as authSignUp, signOut as authSignOut, getProfile, updatePassword as authUpdatePassword } from '../lib/auth';
import type { Profile, UserRole, RegisterFormData } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<UserRole | null>;
  logout: () => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        if (!isSupabaseConfigured) {
          const mockUser = mockStore.getCurrentUser();
          if (mounted) {
            if (mockUser) {
              setUser({ id: mockUser.auth_user_id, email: mockUser.email } as any);
              setProfile(mockUser);
            } else {
              setUser(null);
              setProfile(null);
            }
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            const userProfile = await getProfile(session.user.id);
            setProfile(userProfile);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Error fetching initial session:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    getInitialSession();

    // Listen for auth state changes if Supabase is configured
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            if (!profile || profile.auth_user_id !== session.user.id) {
              const userProfile = await getProfile(session.user.id);
              setProfile(userProfile);
            }
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      return () => {
        mounted = false;
      };
    }
  }, []);

  const login = async (email: string, password: string): Promise<UserRole | null> => {
    const res = await authSignIn(email, password);
    const authUser = res.user;
    if (!authUser) return null;
    
    const userProfile = (res as any).mockProfile || await getProfile(authUser.id);
    setUser(authUser);
    setProfile(userProfile);
    
    return userProfile?.role || null;
  };

  const logout = async () => {
    await authSignOut();
    setUser(null);
    setProfile(null);
  };

  const register = async (data: RegisterFormData) => {
    const res = await authSignUp(data);
    const authUser = res.user;
    if (authUser) {
      const userProfile = (res as any).mockProfile || await getProfile(authUser.id);
      setUser(authUser);
      setProfile(userProfile);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) throw new Error('Not authenticated');

    const safeUpdates = { ...updates };
    if (profile.role === 'student') {
      delete safeUpdates.role;
      delete safeUpdates.id;
      delete safeUpdates.auth_user_id;
      delete safeUpdates.status;
    }
    
    safeUpdates.updated_at = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const updated = await mockStore.updateProfile(profile.id, safeUpdates);
      setProfile(updated);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', profile.id);

      if (error) throw error;
      setProfile({ ...profile, ...safeUpdates } as Profile);
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        const updated = await mockStore.updateProfile(profile.id, safeUpdates);
        setProfile(updated);
        return;
      }
      throw err;
    }
  };

  const role = profile?.role || null;
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';
  const isDemoMode = !isSupabaseConfigured;

  const value: AuthContextType = {
    user,
    profile,
    role,
    loading,
    isAdmin,
    isStudent,
    isDemoMode,
    login,
    logout,
    register,
    updateProfile,
    updatePassword: authUpdatePassword,
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
