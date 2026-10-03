import React, { useState, useEffect } from 'react';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { useStudents } from '../../hooks/useStudents';
import { 
  CreditCard, Search, Plus, Calendar, AlertTriangle, 
  CheckCircle2, Clock, IndianRupee, RefreshCw, MessageSquare,
  ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatsCard } from '../../components/ui/StatsCard';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import type { StudentSubscription } from '../../types/database';
import toast from 'react-hot-toast';

const PRESET_PLANS: { name: string; durationDays: number; price: number; badge?: string }[] = [
  { name: 'Full Day (12 Hours) - Monthly', durationDays: 30, price: 1200, badge: 'Popular' },
  { name: 'Half Day (6 Hours) - Monthly', durationDays: 30, price: 600, badge: 'Flexible' },
  { name: 'Full Day (12 Hours) - Quarterly', durationDays: 90, price: 3400 },
  { name: 'Half Day (6 Hours) - Quarterly', durationDays: 90, price: 1700 },
  { name: 'Full Day (12 Hours) - Annual', durationDays: 365, price: 12999, badge: 'Best Value' },
];

export default function Subscriptions() {
  const navigate = useNavigate();
  const { subscriptions, loading, fetchSubscriptions, renewSubscription, createSubscription } = useSubscriptions();
  const { students, fetchStudents } = useStudents();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');

  // Renew Modal state
  const [selectedSubForRenew, setSelectedSubForRenew] = useState<StudentSubscription | null>(null);
  const [renewPlanDays, setRenewPlanDays] = useState<number>(30);
  const [renewPlanPrice, setRenewPlanPrice] = useState<number>(1200);
  const [isRenewing, setIsRenewing] = useState(false);

  // New Subscription Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newSubStudentId, setNewSubStudentId] = useState('');
  const [newSubPlan, setNewSubPlan] = useState<string>('Full Day (12 Hours) - Monthly');
  const [newSubDays, setNewSubDays] = useState<number>(30);
  const [newSubPrice, setNewSubPrice] = useState<number>(1200);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
    fetchStudents({ pageSize: 100 });
  }, [fetchSubscriptions, fetchStudents]);

  // Derived KPI metrics
  const activeCount = subscriptions.filter((s) => s.status === 'active' || (s.days_remaining ?? 0) > 5).length;
  const expiringCount = subscriptions.filter(
    (s) => s.status === 'expiring_soon' || ((s.days_remaining ?? 0) <= 5 && (s.days_remaining ?? 0) > 0)
  ).length;
  const expiredCount = subscriptions.filter((s) => s.status === 'expired' || (s.days_remaining ?? 0) <= 0).length;
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.amount_paid || 0), 0);

  // Filtered subscriptions list
  const filtered = subscriptions.filter((s) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'expiring_soon') {
        const isExpiring = s.status === 'expiring_soon' || ((s.days_remaining ?? 0) <= 5 && (s.days_remaining ?? 0) > 0);
        if (!isExpiring) return false;
      } else if (statusFilter === 'expired') {
        const isExpired = s.status === 'expired' || (s.days_remaining ?? 0) <= 0;
        if (!isExpired) return false;
      } else if (statusFilter === 'active') {
        const isActive = s.status === 'active' && (s.days_remaining ?? 0) > 5;
        if (!isActive) return false;
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.student?.full_name?.toLowerCase().includes(q);
      const matchId = s.student?.student_id?.toLowerCase().includes(q);
      const matchPlan = s.plan_name?.toLowerCase().includes(q);
      return matchName || matchId || matchPlan;
    }

    return true;
  });

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForRenew) return;

    try {
      setIsRenewing(true);
      await renewSubscription(selectedSubForRenew.id, renewPlanDays, renewPlanPrice);
      toast.success(`Successfully renewed membership for ${selectedSubForRenew.student?.full_name || 'student'}`);
      setSelectedSubForRenew(null);
      fetchSubscriptions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to renew subscription');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubStudentId) {
      toast.error('Please select a student');
      return;
    }

    try {
      setIsCreating(true);
      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(Date.now() + newSubDays * 86400000).toISOString().slice(0, 10);

      await createSubscription({
        student_id: newSubStudentId,
        plan_name: newSubPlan,
        amount_paid: newSubPrice,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        auto_renew: true,
      });

      toast.success('Subscription plan activated successfully!');
      setIsNewModalOpen(false);
      setNewSubStudentId('');
      fetchSubscriptions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate plan');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <CreditCard className="h-7 w-7 text-indigo-600" />
            Student Membership & Subscriptions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor library seat memberships, track validity dates, and issue renewals with automated notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => {
              fetchSubscriptions();
              toast.success('Subscriptions updated');
            }}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsNewModalOpen(true)}
          >
            Assign Membership
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Memberships"
          value={activeCount}
          icon={CheckCircle2}
          color="bg-green-50 text-green-600"
        />
        <StatsCard
          title="Expiring Within 5 Days"
          value={expiringCount}
          icon={AlertTriangle}
          color="bg-amber-50 text-amber-600"
        />
        <StatsCard
          title="Expired / Due Renewal"
          value={expiredCount}
          icon={ShieldAlert}
          color="bg-red-50 text-red-600"
        />
        <StatsCard
          title="Total Fees Collected"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          color="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, ID, or plan..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({subscriptions.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('expiring_soon')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'expiring_soon'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Expiring Soon ({expiringCount})
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'expired'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Expired ({expiredCount})
            </button>
          </div>
        </div>
      </Card>

      {/* Subscriptions Data Table */}
      <Card className="overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Plan & Amount</th>
                <th className="py-3.5 px-4">Validity Period</th>
                <th className="py-3.5 px-4">Remaining Days</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading && subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading subscriptions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30 text-indigo-500" />
                    <p className="font-semibold text-gray-600">No matching subscriptions</p>
                    <p className="text-xs mt-1">Try resetting the status filter or search query</p>
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const days = sub.days_remaining ?? 0;
                  const isExpired = days <= 0;
                  const isExpiring = days > 0 && days <= 5;

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={sub.student?.full_name || 'Student'}
                            src={sub.student?.profile_image_url || undefined}
                            size="md"
                          />
                          <div>
                            <Link
                              to={`/admin/students/${sub.student_id}`}
                              className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                            >
                              {sub.student?.full_name || 'Enrolled Student'}
                            </Link>
                            <p className="text-xs text-gray-400">{sub.student?.student_id || sub.student?.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-900">{sub.plan_name}</div>
                        <div className="text-xs font-semibold text-emerald-600">
                          ₹{sub.amount_paid.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-gray-600 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span>{formatDate(sub.start_date)} → {formatDate(sub.end_date)}</span>
                        </div>
                      </td>

                      {/* Remaining Days Pill */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            Expired ({Math.abs(days)}d ago)
                          </span>
                        ) : isExpiring ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                            <Clock className="h-3 w-3" />
                            {days} {days === 1 ? 'day' : 'days'} left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            {days} days remaining
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <Badge variant="inactive">Expired</Badge>
                        ) : isExpiring ? (
                          <Badge variant="suspended">Expiring Soon</Badge>
                        ) : (
                          <Badge variant="active">Active</Badge>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<MessageSquare className="h-3.5 w-3.5 text-indigo-600" />}
                            onClick={() => navigate(`/admin/messages?student=${sub.student_id}`)}
                          >
                            Chat
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Sparkles className="h-3.5 w-3.5" />}
                            onClick={() => {
                              setSelectedSubForRenew(sub);
                              setRenewPlanDays(30);
                              setRenewPlanPrice(1200);
                            }}
                          >
                            Renew Plan
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RENEW SUBSCRIPTION MODAL */}
      {selectedSubForRenew && (
        <Modal
          isOpen={!!selectedSubForRenew}
          onClose={() => setSelectedSubForRenew(null)}
          title="Extend & Renew Membership"
        >
          <form onSubmit={handleRenewSubmit} className="space-y-4 pt-2">
            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex items-center gap-3">
              <Avatar
                name={selectedSubForRenew.student?.full_name || 'Student'}
                src={selectedSubForRenew.student?.profile_image_url || undefined}
                size="md"
              />
              <div>
                <h4 className="font-bold text-gray-900">{selectedSubForRenew.student?.full_name}</h4>
                <p className="text-xs text-gray-500">
                  {selectedSubForRenew.student?.student_id} • Current Validity End: {formatDate(selectedSubForRenew.end_date)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Select Renewal Package
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PRESET_PLANS.map((p) => {
                  const isSelected = renewPlanDays === p.durationDays;
                  return (
                    <button
                      type="button"
                      key={p.durationDays}
                      onClick={() => {
                        setRenewPlanDays(p.durationDays);
                        setRenewPlanPrice(p.price);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-gray-900">{p.name}</div>
                      <div className="text-sm font-extrabold text-indigo-600 mt-0.5">₹{p.price}</div>
                      <div className="text-[11px] text-gray-500">+{p.durationDays} Days validity</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Current End Date:</span>
                <span className="font-semibold">{formatDate(selectedSubForRenew.end_date)}</span>
              </div>
              <div className="flex justify-between text-indigo-700 font-semibold">
                <span>New Extended Date:</span>
                <span>
                  {formatDate(
                    new Date(
                      Math.max(Date.now(), new Date(selectedSubForRenew.end_date).getTime()) +
                        renewPlanDays * 86400000
                    ).toISOString().slice(0, 10)
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={() => setSelectedSubForRenew(null)}
                disabled={isRenewing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isRenewing}
                icon={<Sparkles className="h-4 w-4" />}
              >
                Confirm Renewal (₹{renewPlanPrice})
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* CREATE NEW SUBSCRIPTION MODAL */}
      {isNewModalOpen && (
        <Modal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          title="Issue Student Membership Pass"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Select Student
              </label>
              <select
                value={newSubStudentId}
                onChange={(e) => setNewSubStudentId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose enrolled student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.student_id || s.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Choose Plan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_PLANS.map((p) => {
                  const isSelected = newSubPlan === p.name;
                  return (
                    <button
                      type="button"
                      key={p.name}
                      onClick={() => {
                        setNewSubPlan(p.name);
                        setNewSubDays(p.durationDays);
                        setNewSubPrice(p.price);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-gray-900">{p.name}</div>
                      <div className="text-sm font-extrabold text-indigo-600 mt-0.5">₹{p.price}</div>
                      <div className="text-[11px] text-gray-500">{p.durationDays} Days duration</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={() => setIsNewModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isCreating}
                icon={<CheckCircle2 className="h-4 w-4" />}
              >
                Activate Pass (₹{newSubPrice})
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
