import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail } from '../../lib/utils';
import toast from 'react-hot-toast';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = () => {
    setEmail('admin@library.com');
    setPassword('admin123');
    setEmailError('');
    toast.success('Filled with demo administrator credentials! Click Sign In.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const role = await login(email, password);
      
      if (role && role !== 'admin') {
        toast.error('Access denied. This portal is for administrators only.');
        return;
      }

      toast.success('Welcome to the Admin Portal');
      navigate('/admin/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-md w-full space-y-6 bg-slate-900/90 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-indigo-500/30 relative z-10 text-white"
      >
        <div className="text-center">
          <div className="inline-flex p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 text-white mb-3">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Administrator Portal
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to manage library seats, student records & allocations
          </p>

          {/* 1-Click Demo Admin Button */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-900/60 hover:bg-indigo-800/80 text-amber-300 border border-indigo-700/50 shadow-sm transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ 1-Click Demo Admin</span>
            </button>
          </div>
        </div>
        
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4 text-slate-900">
            <Input
              id="email"
              type="email"
              label="Admin Email"
              placeholder="admin@library.com"
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
              label="Admin Password"
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
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all text-white"
              isLoading={isLoading}
              disabled={isLoading}
            >
              <span>Sign In to Admin Panel</span>
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-6 pt-3 border-t border-slate-800 text-xs">
            <Link
              to="/student/login"
              className="text-slate-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
            >
              <span>Student login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/book-demo"
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              Book a Demo &rarr;
            </Link>
          </div>

        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

