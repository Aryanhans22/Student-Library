import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BookOpen, User, Mail, Phone, Lock, Calendar, MapPin, ChevronDown, ChevronUp, Sparkles, Armchair, GraduationCap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, validatePhone, validatePassword } from '../../lib/utils';
import toast from 'react-hot-toast';
import type { RegisterFormData } from '../../types/database';

const StudentRegister: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedSeat = searchParams.get('seat');

  const [formData, setFormData] = useState<RegisterFormData>({
    full_name: '',
    email: '',
    mobile_number: '',
    password: '',
    confirm_password: '',
    date_of_birth: '',
    address: '',
    emergency_contact: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passwordScore = calculatePasswordStrength(formData.password);

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600' };
    if (score <= 3) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-600' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const handleFillDemo = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      full_name: 'Kavya Verma',
      email: `kavya.verma${randomSuffix}@example.com`,
      mobile_number: '+91 9876543299',
      password: 'Student123!',
      confirm_password: 'Student123!',
      date_of_birth: '2004-06-15',
      address: '24 Green Park, Block C, New Delhi',
      emergency_contact: '+91 9876543200',
    });
    setErrors({});
    toast.success('Filled with demo student details! Ready to register.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};
    let isValid = true;

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
      isValid = false;
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Valid email is required';
      isValid = false;
    }

    if (!validatePhone(formData.mobile_number || '')) {
      newErrors.mobile_number = 'Valid phone number is required';
      isValid = false;
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 chars, contain uppercase, lowercase & number';
      isValid = false;
    }

    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
      isValid = false;
    }
    
    if (formData.emergency_contact && !validatePhone(formData.emergency_contact)) {
      newErrors.emergency_contact = 'Valid phone number is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#7c3aed', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    try {
      await register(formData);
      fireConfetti();
      toast.success(
        preselectedSeat
          ? `Account created! Desk ${preselectedSeat} request recorded.`
          : 'Registration successful! Welcome to the Library.'
      );
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 600);
    } catch (error: any) {
      toast.error(error.message || 'Failed to register. Email might already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  const strength = getStrengthLabel(passwordScore);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-200/50 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-lg w-full space-y-6 bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-xl border border-indigo-100/80 relative z-10"
      >
        <div className="text-center">
          <Link to="/" className="inline-flex p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-md shadow-indigo-500/20 text-white mb-3 hover:scale-105 transition">
            <BookOpen className="h-8 w-8" />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Student Account
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Join the Central Study Centre & get your smart digital seat pass
          </p>

          {/* Pre-selected Seat Badge from Floor Map */}
          {preselectedSeat && (
            <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
              <Armchair className="w-3.5 h-3.5 text-emerald-600" />
              <span>Selected Desk: {preselectedSeat} (Hold Active)</span>
            </div>
          )}

          {/* Quick Demo Fill Button */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>⚡ Quick Demo Fill (1-Click)</span>
            </button>
          </div>
        </div>
        
        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <Input
              id="full_name"
              name="full_name"
              label="Full Name *"
              placeholder="e.g. Rahul Sharma"
              value={formData.full_name}
              onChange={handleChange}
              icon={<User className="h-5 w-5 text-gray-400" />}
              error={errors.full_name}
              disabled={isLoading}
              required
            />
            
            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address *"
              placeholder="student@example.com"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail className="h-5 w-5 text-gray-400" />}
              error={errors.email}
              disabled={isLoading}
              required
            />

            <Input
              id="mobile_number"
              name="mobile_number"
              label="Mobile Number *"
              placeholder="+91 9876543210"
              value={formData.mobile_number}
              onChange={handleChange}
              icon={<Phone className="h-5 w-5 text-gray-400" />}
              error={errors.mobile_number}
              disabled={isLoading}
              required
            />

            <div>
              <Input
                id="password"
                name="password"
                type="password"
                label="Password *"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                icon={<Lock className="h-5 w-5 text-gray-400" />}
                error={errors.password}
                disabled={isLoading}
                required
              />
              {/* Dynamic Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Security strength:</span>
                    <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-full transition-all duration-300 ${
                          level <= passwordScore ? strength.color : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              label="Confirm Password *"
              placeholder="••••••••"
              value={formData.confirm_password}
              onChange={handleChange}
              icon={<Lock className="h-5 w-5 text-gray-400" />}
              error={errors.confirm_password}
              disabled={isLoading}
              required
            />

            {/* Collapsible Additional Information Section */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden mt-4">
              <button
                type="button"
                className="w-full px-4 py-3 bg-slate-50/80 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100/80 transition-colors focus:outline-none"
                onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
              >
                <span>Additional Information (Optional)</span>
                {showAdditionalInfo ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </button>
              
              <AnimatePresence>
                {showAdditionalInfo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 space-y-4 bg-white border-t border-slate-100"
                  >
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      label="Date of Birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      icon={<Calendar className="h-5 w-5 text-gray-400" />}
                      disabled={isLoading}
                    />
                    
                    <Input
                      id="emergency_contact"
                      name="emergency_contact"
                      label="Emergency Contact"
                      placeholder="+91 9876543211"
                      value={formData.emergency_contact || ''}
                      onChange={handleChange}
                      icon={<Phone className="h-5 w-5 text-gray-400" />}
                      error={errors.emergency_contact}
                      disabled={isLoading}
                    />
                    
                    <Input
                      id="address"
                      name="address"
                      label="Address"
                      placeholder="e.g. 12 Park Avenue, City"
                      value={formData.address || ''}
                      onChange={handleChange}
                      icon={<MapPin className="h-5 w-5 text-gray-400" />}
                      disabled={isLoading}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all cursor-pointer border border-indigo-400/30 flex items-center justify-center gap-2"
              isLoading={isLoading}
              disabled={isLoading}
            >
              <GraduationCap className="w-5 h-5 text-indigo-200 shrink-0" />
              <span>Register & Get Digital ID Pass</span>
            </Button>
          </div>
          
          <div className="flex flex-col space-y-2 text-center mt-4">
            <Link to="/student/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              Already have an account? Sign in here
            </Link>
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
              ← Return to Home
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default StudentRegister;


