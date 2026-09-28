import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail } from '../../lib/utils';
import toast from 'react-hot-toast';

const StudentLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const prefill = searchParams.get('email') || searchParams.get('student');
    if (prefill) {
      setEmail(prefill);
    }
  }, [searchParams]);

  const handleFillDemo = () => {
    setEmail('aarav.sharma@example.com');
    setPassword('student123');
    setEmailError('');
    toast.success('Filled with demo student credentials! Click Sign In.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const trimmedInput = email.trim();
    if (!trimmedInput) {
      setEmailError('Please enter your email or Student ID');
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const role = await login(trimmedInput, password);
      if (role === 'admin') {
        toast.success('Welcome Admin! Redirecting to admin dashboard.');
        navigate('/admin/dashboard');
      } else {
        toast.success('Successfully logged in');
        navigate('/student/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
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
            <BookOpen className="h-8 w-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Student Login</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to access your allotted seat & library pass</p>

          {/* 1-Click Demo Fill */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>⚡ 1-Click Demo Student (Aarav)</span>
            </button>
          </div>
        </div>
        
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              id="email"
              type="text"
              label="Email Address or Student ID"
              placeholder="you@example.com or STU..."
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              icon={<Mail className="h-5 w-5 text-gray-400" />}
              error={emailError}
              disabled={isLoading}
              required
            />
            
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-5 w-5 text-gray-400" />}
              disabled={isLoading}
              required
            />

            <div className="flex justify-end -mt-2">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/20 active:scale-[0.99] transition-all"
              isLoading={isLoading}
              disabled={isLoading}
            >
              <span>Sign In to Student Portal</span>
            </Button>
          </div>
          
          <div className="flex flex-col space-y-3 text-center mt-6 pt-2">
            <Link
              to="/student/register"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center justify-center gap-1"
            >
              <span>Don't have an account? Register here</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
              <Link to="/admin/login" className="font-medium text-slate-400 hover:text-slate-700 transition-colors">
                Staff & Librarian Access
              </Link>
              <Link to="/book-demo" className="font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                Book a Demo &rarr;
              </Link>
            </div>

          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default StudentLogin;

