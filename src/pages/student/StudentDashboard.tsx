import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentSeat } from '../../hooks/useStudentSeat';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Armchair, 
  User, 
  CheckCircle2, 
  Calendar,
  AlertCircle,
  AlertTriangle,
  CreditCard,
  Clock,
  MessageSquare,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Zap,
  Wifi,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { StudentIDCard } from '../../components/ui/StudentIDCard';
import { formatDate, cn } from '../../lib/utils';

export function StudentDashboard() {
  const { profile } = useAuth();
  const { assignment, seat, isLoading, refresh } = useStudentSeat();
  const { subscription, fetchStudentSubscription, loading: subLoading } = useSubscriptions();

  useEffect(() => {
    refresh();
    if (profile?.id) {
      fetchStudentSubscription(profile.id);
    }
  }, [refresh, profile?.id, fetchStudentSubscription]);

  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return { text: 'Good morning', icon: Sun, color: 'text-amber-500' };
    if (currentHour < 17) return { text: 'Good afternoon', icon: Sunset, color: 'text-orange-500' };
    return { text: 'Good evening', icon: Moon, color: 'text-indigo-400' };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <GreetingIcon className={`w-5 h-5 ${greeting.color}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                {greeting.text}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {profile?.full_name || 'Welcome Student'}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1">
              Library Operations Active • {currentDate}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/profile"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-semibold border border-white/20 transition active:scale-95 text-white"
            >
              <span>Manage Profile</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Automated Expiration & Validity Notification Banner */}
      {subscription && (
        <>
          {(subscription.days_remaining ?? 0) <= 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border-2 border-red-300 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-3 bg-red-100 text-red-700 rounded-2xl shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-red-950 text-base">
                      Library Membership Expired
                    </h3>
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-red-200 text-red-800 rounded-full">
                      ACTION REQUIRED
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-red-800 mt-0.5">
                    Your {subscription.plan_name} expired on {formatDate(subscription.end_date)}. Please renew with administration to maintain your library access.
                  </p>
                </div>
              </div>
              <Link
                to="/student/chat"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition active:scale-95 whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat to Renew</span>
              </Link>
            </motion.div>
          ) : (subscription.days_remaining ?? 0) <= 5 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-amber-950 text-base">
                      Subscription Expiring Soon ({subscription.days_remaining} {subscription.days_remaining === 1 ? 'Day' : 'Days'} Remaining)
                    </h3>
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-200 text-amber-800 rounded-full animate-pulse">
                      RENEWAL DUE
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                    Your {subscription.plan_name} ends on {formatDate(subscription.end_date)}. Renew before expiry to retain your assigned seat ({seat?.seat_number || 'Desk'}).
                  </p>
                </div>
              </div>
              <Link
                to="/student/chat"
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition active:scale-95 whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contact Admin to Renew</span>
              </Link>
            </motion.div>
          ) : null}
        </>
      )}

      {/* Main Content Grid: Allotted Seat + Digital ID Pass */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Allotted Seat Section (7 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-7 space-y-6"
        >
          {isLoading ? (
            <Card className="min-h-[340px] rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="p-8 h-full flex flex-col justify-center space-y-4">
                <Skeleton className="h-16 w-32 mx-auto rounded-2xl" />
                <Skeleton className="h-6 w-48 mx-auto rounded-lg" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </CardContent>
            </Card>
          ) : seat ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-indigo-100 shadow-xl shadow-indigo-500/5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-md text-white">
                    <Armchair className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">Your Allotted Study Station</h3>
                    <p className="text-xs text-slate-500">Reserved exclusively for your account</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ACTIVE SEAT</span>
                </span>
              </div>

              {/* Huge Seat Badge */}
              <div className="my-8 text-center bg-gradient-to-b from-indigo-50/70 to-slate-50 p-6 rounded-2xl border border-indigo-100/80">
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-1">
                  Seat Designation
                </p>
                <div className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tight font-mono">
                  {seat.seat_number}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-600">
                  <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                    Floor: <strong className="text-slate-900">{seat.floor || 'Ground Floor'}</strong>
                  </span>
                  <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                    Section: <strong className="text-slate-900">{seat.section || 'A'}</strong>
                  </span>
                  {seat.row_number && (
                    <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                      Row: <strong className="text-slate-900">{seat.row_number}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Station Amenities */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-6">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-700">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Power Outlet</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-700">
                  <Wifi className="w-4 h-4 text-indigo-500" />
                  <span>High-Speed Wi-Fi</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-700 col-span-2 sm:col-span-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Silent Study Zone</span>
                </div>
              </div>

              {/* Assignment Timestamp */}
              {assignment?.assigned_at && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Assigned on {formatDate(assignment.assigned_at)}</span>
                  <span className="text-indigo-600 font-medium">To change seat, contact admin</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
              <EmptyState
                icon={Armchair}
                title="No Seat Allotted Yet"
                description="Your account is active, but you do not have an allotted seat right now. Please ask the library desk to assign you an available seat number."
                className="py-10"
              />
            </div>
          )}

          {/* Quick Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-xs font-semibold text-slate-500 uppercase">Registration ID</p>
              <h4 className="text-base font-bold text-slate-900 font-mono mt-1">
                {profile?.student_id || 'STU-PENDING'}
              </h4>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-xs font-semibold text-slate-500 uppercase">Account Status</p>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="capitalize">{profile?.status || 'Active'}</span>
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-xs font-semibold text-slate-500 uppercase">Member Since</p>
              <h4 className="text-sm font-semibold text-slate-800 mt-1">
                {profile?.created_at ? formatDate(profile.created_at) : 'Active Member'}
              </h4>
            </div>
          </div>

          {/* Student Membership & Study Pass Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Current Library Membership</h3>
                  <p className="text-xs text-slate-500">Official desk seat pass & validity</p>
                </div>
              </div>
              <Link
                to="/student/chat"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Helpdesk</span>
              </Link>
            </div>

            {subLoading ? (
              <div className="space-y-2 py-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : subscription ? (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{subscription.plan_name}</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      ₹{subscription.amount_paid} Paid
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Valid: {formatDate(subscription.start_date)} → {formatDate(subscription.end_date)}</span>
                  </div>
                </div>

                <div>
                  {(subscription.days_remaining ?? 0) <= 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Expired
                    </span>
                  ) : (subscription.days_remaining ?? 0) <= 5 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      {subscription.days_remaining} {subscription.days_remaining === 1 ? 'day' : 'days'} left
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {subscription.days_remaining} days left
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-5 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Active Pass</p>
                <p className="text-xs text-slate-500 mt-0.5">Contact the administration desk to activate a study pass.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Digital Holographic Student ID Pass (5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-5 flex flex-col items-center"
        >
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Smart Digital Pass</span>
            </h3>
            <span className="text-[11px] font-mono text-indigo-600 font-semibold">NFC & QR READY</span>
          </div>

          {profile && (
            <StudentIDCard
              profile={profile}
              seat={seat}
              className="w-full"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default StudentDashboard;

