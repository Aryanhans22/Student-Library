import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useStudents } from '../../hooks/useStudents';
import { useDemoBookings } from '../../hooks/useDemoBookings';
import { useChat } from '../../hooks/useChat';
import { 
  Users, 
  UserCheck, 
  Armchair, 
  UserPlus, 
  CheckCircle, 
  BarChart3, 
  Plus, 
  ArrowRight,
  Eye,
  Shield,
  Activity,
  Sparkles,
  Calendar,
  Clock,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Check,
  MessageSquare
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { SkeletonCard, Skeleton } from '../../components/ui/Skeleton';
import { StatsCard } from '../../components/ui/StatsCard';
import { formatDate, getInitials } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { stats, loading: statsLoading, error: statsError, fetchStats } = useDashboardStats();
  const { students, loading: studentsLoading, fetchStudents } = useStudents();
  const { bookings: demoBookings, updateStatus: updateDemoStatus } = useDemoBookings(true);
  const { conversations, fetchConversations } = useChat();

  const defaultAdminId = 'a0000000-0000-0000-0000-000000000001';
  const effectiveAdminId = profile?.id || defaultAdminId;

  useEffect(() => {
    fetchStats();
    fetchStudents({ page: 1, limit: 5 });
    fetchConversations(effectiveAdminId);
  }, [fetchStats, fetchStudents, fetchConversations, effectiveAdminId]);

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const occupancyRate = stats?.occupancy_rate ?? 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-900/60 shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300">
                Admin Command Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {today} &bull; Library real-time telemetry active
            </p>
          </div>

          {/* Quick Occupancy Pill */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Seat Occupancy</span>
              <span className="text-2xl font-mono font-black text-white">{occupancyRate}%</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Activity className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : statsError ? (
          <div className="col-span-full p-4 bg-red-50 text-red-600 rounded-lg">Error loading statistics</div>
        ) : (
          <>
            <StatsCard
              title="Total Students"
              value={stats?.total_students ?? 0}
              icon={<Users className="w-5 h-5" />}
              color="indigo"
            />
            <StatsCard
              title="Active Students"
              value={stats?.active_students ?? 0}
              icon={<UserCheck className="w-5 h-5" />}
              color="green"
            />
            <StatsCard
              title="Total Seats"
              value={stats?.total_seats ?? 0}
              icon={<Armchair className="w-5 h-5" />}
              color="blue"
            />
            <StatsCard
              title="Occupied Seats"
              value={stats?.occupied_seats ?? 0}
              icon={<UserPlus className="w-5 h-5" />}
              color="amber"
            />
            <StatsCard
              title="Available Seats"
              value={stats?.available_seats ?? 0}
              icon={<CheckCircle className="w-5 h-5" />}
              color="emerald"
            />
            <StatsCard
              title="Occupancy Rate"
              value={`${stats?.occupancy_rate ?? 0}%`}
              icon={<BarChart3 className="w-5 h-5" />}
              color="purple"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Students */}
        <Card className="lg:col-span-2 rounded-3xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recently Registered Students</h2>
              <p className="text-xs text-slate-500">Latest students in library registry</p>
            </div>
            <Link to="/admin/students" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center font-bold">
              View All Students <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {studentsLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : students.length === 0 ? (
              <EmptyState title="No students found" description="No students have been registered yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {students.slice(0, 5).map((student) => (
                  <div key={student.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Avatar name={student.full_name} fallback={getInitials(student.full_name)} />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{student.full_name}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          ID: <span className="text-indigo-600 font-semibold">{student.student_id}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[11px] text-slate-400">Registered</p>
                        <p className="text-xs text-slate-700 font-medium">{formatDate(student.created_at)}</p>
                      </div>
                      <Badge variant={student.status === 'active' ? 'success' : student.status === 'suspended' ? 'destructive' : 'secondary'}>
                        {student.status}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/students/${student.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
            <p className="text-xs text-slate-500">Fast workflows for desk managers</p>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Button
              className="w-full justify-start h-12 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-sm"
              onClick={() => navigate('/admin/students?add=true')}
            >
              <UserPlus className="w-4 h-4 mr-2" /> Add New Student
            </Button>
            <Button
              className="w-full justify-start h-12 text-sm font-medium border-slate-200 hover:bg-slate-50"
              variant="outline"
              onClick={() => navigate('/admin/seats')}
            >
              <Plus className="w-4 h-4 mr-2 text-indigo-600" /> Add & Manage Seats
            </Button>
            <Button
              className="w-full justify-start h-12 text-sm font-medium border-slate-200 hover:bg-slate-50"
              variant="outline"
              onClick={() => navigate('/admin/seat-allocation')}
            >
              <Armchair className="w-4 h-4 mr-2 text-emerald-600" /> Allocate Seat to Student
            </Button>
            <Button
              className="w-full justify-start h-12 text-sm font-medium border-slate-200 hover:bg-slate-50"
              variant="outline"
              onClick={() => navigate('/admin/students')}
            >
              <Users className="w-4 h-4 mr-2 text-purple-600" /> Browse Student Database
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Student Helpdesk & Messages Section */}
      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-2xl border border-indigo-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Student Helpdesk & Messages</h2>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">
                  {conversations.length} Students
                </span>
                {totalUnread > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {totalUnread} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Real-time student support inquiries & desk assistance</p>
            </div>
          </div>
          <Link
            to="/admin/messages"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Open Full Helpdesk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-50" />
              <p>No messages yet. Enrolled students can reach out via their Student Portal.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.slice(0, 5).map(({ student, lastMessage, unreadCount }) => (
                <div
                  key={student.id}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Avatar name={student.full_name} fallback={getInitials(student.full_name)} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{student.full_name}</p>
                        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {student.student_id || 'Student'}
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-md mt-0.5">
                        {lastMessage?.message || 'No messages exchanged yet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {lastMessage && (
                      <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                        {new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/messages?student=${student.id}`)}
                      className="text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" /> Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inbound Demo & Facility Inquiries Card */}
      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Inbound Demo & Facility Walkthrough Inquiries</h2>
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                  {demoBookings.length} Requests
                </span>
              </div>
              <p className="text-xs text-slate-500">Scheduled walkthroughs from coaching directors & study room owners</p>
            </div>
          </div>
          <Link
            to="/book-demo"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Preview Booking Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {demoBookings.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No demo bookings yet. Visitors can book via the "Book a Demo" option on the landing page.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {demoBookings.map((demo) => {
                const isPending = demo.status === 'pending';
                const isConfirmed = demo.status === 'confirmed';
                const isCompleted = demo.status === 'completed';

                return (
                  <div
                    key={demo.id}
                    className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          {demo.organization_name}
                        </span>
                        <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {demo.seat_capacity}
                        </span>
                        <Badge
                          variant={
                            isConfirmed
                              ? 'success'
                              : isPending
                              ? 'warning'
                              : isCompleted
                              ? 'primary'
                              : 'secondary'
                          }
                        >
                          {demo.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="font-medium text-slate-800">
                          {demo.full_name} ({demo.role})
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 font-mono">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {demo.phone}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Mail className="w-3 h-3 text-indigo-600" />
                          {demo.email}
                        </span>
                      </div>

                      {/* Scheduled slot & Interests */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-medium">
                          <Clock className="w-3 h-3" />
                          {demo.preferred_date} @ {demo.preferred_time}
                        </span>
                        {demo.features_of_interest.slice(0, 2).map((feat, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-md"
                          >
                            {feat}
                          </span>
                        ))}
                        {demo.features_of_interest.length > 2 && (
                          <span className="text-[10px] text-slate-400">
                            +{demo.features_of_interest.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* WhatsApp contact link */}
                      <a
                        href={`https://wa.me/${demo.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl border border-emerald-200 transition"
                        title="Chat on WhatsApp"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      {/* Email contact link */}
                      <a
                        href={`mailto:${demo.email}?subject=LibraryMS%20Live%20Demo%20Walkthrough`}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl border border-indigo-200 transition"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>

                      {/* Status Toggle Action */}
                      {isPending && (
                        <button
                          onClick={async () => {
                            await updateDemoStatus(demo.id, 'confirmed');
                            toast.success(`Demo confirmed for ${demo.full_name}`);
                          }}
                          className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </button>
                      )}

                      {isConfirmed && (
                        <button
                          onClick={async () => {
                            await updateDemoStatus(demo.id, 'completed');
                            toast.success(`Marked as completed for ${demo.full_name}`);
                          }}
                          className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </button>
                      )}

                      {isCompleted && (
                        <span className="text-[11px] font-semibold text-slate-400 px-2 py-1">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


