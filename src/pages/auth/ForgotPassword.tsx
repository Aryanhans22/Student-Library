import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Mail, Lock, ArrowLeft, ArrowRight, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { mockStore } from '../../lib/mockStore';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Profile } from '../../types/database';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState<'identify' | 'reset' | 'success'>('identify');
  const [identifier, setIdentifier] = useState('');
  const [foundProfile, setFoundProfile] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const term = identifier.trim();
    if (!term) {
      setErrorMsg('Please enter your email address or student ID');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Check local mockStore
      let profile = await mockStore.findAccountByIdentifier(term);

      // 2. If not found and Supabase configured, check Supabase
      if (!profile && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`email.ilike.%${term}%,student_id.ilike.%${term}%`)
            .maybeSingle();

          if (!error && data) {
            profile = data as Profile;
            mockStore.syncProfiles([profile]);
          }
        } catch (sbErr) {
          console.warn('Supabase profile search error:', sbErr);
        }
      }

      if (!profile) {
        setErrorMsg('No account found with this Email or Student ID. Please verify your details.');
        return;
      }

      setFoundProfile(profile);
      setStep('reset');
      toast.success(`Account found for ${profile.full_name}!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error searching for account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundProfile) return;

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await mockStore.resetPassword(foundProfile.email, newPassword);

      if (isSupabaseConfigured) {
        try {
          await supabase.auth.updateUser({ password: newPassword });
        } catch {
          // If user isn't logged in with session, mockStore handles it
        }
      }

      setStep('success');
      toast.success('Password updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantLogin = async () => {
    if (!foundProfile || !newPassword) return;
    setLoggingIn(true);
    try {
      await login(foundProfile.email, newPassword);
      toast.success(`Welcome back, ${foundProfile.full_name}!`);
      navigate(foundProfile.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch {
      navigate(`/student/login?email=${encodeURIComponent(foundProfile.email)}`);
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background glowing spheres */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-200/50 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-md w-full space-y-6 bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-xl border border-indigo-100/80 relative z-10"
      >
        <div className="text-center">
          <div className="inline-flex p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-md shadow-indigo-500/20 text-white mb-3">
            <KeyRound className="h-8 w-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {step === 'identify' && 'Forgot Password?'}
            {step === 'reset' && 'Create New Password'}
            {step === 'success' && 'Password Reset!'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {step === 'identify' && 'Enter your registered Email or Student ID to recover access'}
            {step === 'reset' && `Setting a new password for ${foundProfile?.full_name}`}
            {step === 'success' && 'Your account password has been safely updated'}
          </p>
        </div>

        {/* Step 1: Identify Account */}
        {step === 'identify' && (
          <form onSubmit={handleIdentify} className="space-y-4">
            <Input
              id="identifier"
              type="text"
              label="Email Address or Student ID"
              placeholder="e.g. STU977606 or student@example.com"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setErrorMsg('');
              }}
              icon={<Mail className="h-5 w-5 text-gray-400" />}
              error={errorMsg}
              disabled={isLoading}
              required
            />

            {/* Helpful system default note */}
            <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100/80 text-xs text-indigo-900 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Quick Tip:</span> Default password for accounts added by administrator is{' '}
                <code className="bg-indigo-200/60 font-mono px-1.5 py-0.5 rounded text-indigo-950 font-bold">student123</code>.
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/20 active:scale-[0.99] transition-all"
              isLoading={isLoading}
              disabled={isLoading}
            >
              <span>Find Account</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/student/login"
                className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Set New Password */}
        {step === 'reset' && foundProfile && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Account Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <Avatar name={foundProfile.full_name} src={foundProfile.profile_image_url || undefined} size="md" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-slate-900 truncate">{foundProfile.full_name}</div>
                <div className="text-xs text-slate-500 truncate">{foundProfile.email}</div>
                <div className="text-[11px] font-semibold text-indigo-600">{foundProfile.student_id || 'Student'}</div>
              </div>
            </div>

            <Input
              id="new-password"
              type="password"
              label="New Password"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={<Lock className="h-5 w-5 text-gray-400" />}
              disabled={isLoading}
              required
            />

            <Input
              id="confirm-password"
              type="password"
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<ShieldCheck className="h-5 w-5 text-gray-400" />}
              disabled={isLoading}
              required
            />

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20 active:scale-[0.99] transition-all"
              isLoading={isLoading}
              disabled={isLoading}
            >
              <span>Save Password & Continue</span>
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep('identify')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Change account
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="space-y-5 text-center py-2">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-lg">Password Changed!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Your new password for <span className="font-semibold text-slate-700">{foundProfile?.full_name}</span> has been saved.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                type="button"
                onClick={handleInstantLogin}
                isLoading={loggingIn}
                disabled={loggingIn}
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20 active:scale-[0.99] transition-all"
              >
                <span>Instant Login to Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/student/login?email=${encodeURIComponent(foundProfile?.email || '')}`)}
                className="w-full h-11 text-sm font-semibold"
              >
                Go to Sign In Screen
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
