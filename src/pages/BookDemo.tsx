import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Building2,
  User,
  Mail,
  Phone,
  Armchair,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Check,
  BookOpen,
  QrCode,
  Bell,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDemoBookings } from '../hooks/useDemoBookings';
import type { DemoBookingFormData, DemoBooking } from '../types/database';

const FEATURE_OPTIONS = [
  '🗺️ Visual Multi-Floor Seat Map',
  '🪪 Smart Digital Pass & Barcode',
  '💳 Subscription & Fees Tracking',
  '🔔 Automated Expiry In-App Alerts',
  '💬 Student-Admin Live Helpdesk',
  '🏢 Multi-Branch / Reading Halls',
];

const TIME_SLOTS = [
  '10:00 AM',
  '11:30 AM',
  '02:00 PM',
  '03:30 PM',
  '05:00 PM',
  '06:30 PM',
  '08:00 PM',
];

const ROLE_OPTIONS = [
  'Student',
  'Library Owner',
  'Librarian / Staff',
  'Other',
];

const CAPACITY_OPTIONS_INSTITUTE = [
  'Under 50 Seats',
  '50 - 150 Seats',
  '150 - 300 Seats',
  '300+ Seats',
];

const CAPACITY_OPTIONS_STUDENT = [
  'Single Study Seat (Self)',
  'Group Study (2 - 5 Seats)',
  'Exam Preparation (Monthly Pass)',
];

const BookDemo: React.FC = () => {
  const navigate = useNavigate();
  const { bookDemo, loading } = useDemoBookings();
  const [confirmedBooking, setConfirmedBooking] = useState<DemoBooking | null>(null);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [formData, setFormData] = useState<DemoBookingFormData>({
    full_name: '',
    email: '',
    phone: '',
    organization_name: '',
    role: 'Student',
    seat_capacity: 'Single Study Seat (Self)',
    preferred_date: tomorrow,
    preferred_time: '11:30 AM',
    features_of_interest: [
      '🗺️ Visual Multi-Floor Seat Map',
      '💳 Subscription & Fees Tracking',
    ],
    notes: '',
  });


  const toggleFeature = (feature: string) => {
    setFormData((prev) => {
      const exists = prev.features_of_interest.includes(feature);
      return {
        ...prev,
        features_of_interest: exists
          ? prev.features_of_interest.filter((f) => f !== feature)
          : [...prev.features_of_interest, feature],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter your mobile or WhatsApp number');
      return;
    }
    if (!formData.organization_name.trim()) {
      toast.error('Please enter your library or institute name');
      return;
    }

    try {
      const booking = await bookDemo(formData);
      setConfirmedBooking(booking);
      toast.success('🎉 Demo walkthrough scheduled successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Could not schedule demo. Please try again.');
    }
  };

  const createGoogleCalendarUrl = (booking: DemoBooking) => {
    const title = encodeURIComponent(`LibraryMS Live Walkthrough: ${booking.organization_name}`);
    const details = encodeURIComponent(
      `Personalized live 1-on-1 demo for ${booking.organization_name} (${booking.seat_capacity}).\nContact: ${booking.full_name} (${booking.phone}, ${booking.email})\nInterests: ${booking.features_of_interest.join(', ')}`
    );
    const dateStr = booking.preferred_date.replace(/-/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dateStr}T060000Z/${dateStr}T064500Z`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">
              Library<span className="text-indigo-400">MS</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <Link
              to="/student/login"
              className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white px-3.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 transition hidden sm:inline-block"
            >
              Student Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Why Book a Demo & What to Expect */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Personalized 1-on-1 Walkthrough</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              See How LibraryMS Transforms Your Study Center
            </h1>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Schedule a 30-minute tailored video session with our library product specialists. We'll show you how to eliminate manual registers, prevent seat conflicts, and automate renewals.
            </p>

            {/* What you'll experience list */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-xl mt-0.5 shrink-0">
                  <Armchair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Visual Floor & Desk Radar</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    See interactive color-coded floor maps for multiple sections, quiet pods, and daylight rows.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl mt-0.5 shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Smart Digital Passes & Barcodes</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Issue instantaneous holographic student cards with printable PDF and scanner capabilities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl mt-0.5 shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Automated Expiry & Fee Alerts</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Prevent revenue leakage with 5-day warning notifications sent automatically to students.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-purple-500/15 text-purple-400 rounded-xl mt-0.5 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Two-Way Helpdesk Communication</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live chat between students and staff for desk swaps, locker requests, and inquiries.
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Quote Box */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 text-xs text-slate-300">
              <p className="italic">
                "Switching from physical paper registers to LibraryMS saved our center over 15 hours each week in desk allocation and fee collection."
              </p>
              <p className="font-semibold text-white mt-2">— StudyZone Reading Library, Delhi</p>
            </div>
          </div>

          {/* Right Column: Interactive Form or Confirmation */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 absolute top-0 left-0 right-0" />

              {!confirmedBooking ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">Reserve Your Walkthrough</h2>
                      <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                        Fill in your details below to schedule your live 30-minute demonstration.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-1 rounded-lg shrink-0">
                      Free &bull; 30 Min
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Row 1: Name & Role */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          Your Role *
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            setFormData({
                              ...formData,
                              role: newRole,
                              seat_capacity:
                                newRole === 'Student'
                                  ? CAPACITY_OPTIONS_STUDENT[0]
                                  : CAPACITY_OPTIONS_INSTITUTE[1],
                            });
                          }}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition cursor-pointer"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role} className="bg-slate-900 text-white">
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Organization / College & Requirement / Capacity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                          {formData.role === 'Student' ? 'Your College / Library Name *' : 'Library / Institute Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={formData.role === 'Student' ? 'e.g. Delhi University / Self-Study' : 'e.g. Apex Reading Sanctuary'}
                          value={formData.organization_name}
                          onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <Armchair className="w-3.5 h-3.5 text-purple-400" />
                          {formData.role === 'Student' ? 'Seating Requirement' : 'Total Seating Capacity'}
                        </label>
                        <select
                          value={formData.seat_capacity}
                          onChange={(e) => setFormData({ ...formData, seat_capacity: e.target.value })}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition cursor-pointer"
                        >
                          {(formData.role === 'Student'
                            ? CAPACITY_OPTIONS_STUDENT
                            : CAPACITY_OPTIONS_INSTITUTE
                          ).map((cap) => (
                            <option key={cap} value={cap} className="bg-slate-900 text-white">
                              {cap}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>


                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-indigo-400" />
                          Work / Contact Email *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="pooja@citylibrary.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          Mobile / WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 99887 76655"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                        />
                      </div>
                    </div>

                    {/* Preferred Date & Time Selection */}
                    <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
                      <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Schedule Date & Time Slot</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Preferred Date</label>
                          <input
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            value={formData.preferred_date}
                            onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Time Slot</label>
                          <select
                            value={formData.preferred_time}
                            onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {TIME_SLOTS.map((slot) => (
                              <option key={slot} value={slot} className="bg-slate-900 text-white">
                                {slot}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Features checklist */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Features You Would Like Demonstrated:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {FEATURE_OPTIONS.map((feature) => {
                          const isSelected = formData.features_of_interest.includes(feature);
                          return (
                            <button
                              key={feature}
                              type="button"
                              onClick={() => toggleFeature(feature)}
                              className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 font-medium'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3 text-indigo-400" /> : null}
                              <span>{feature}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer text-sm sm:text-base"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Confirm & Schedule Walkthrough</span>
                            <ArrowRight className="w-4 h-4 ml-0.5" />
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-center text-slate-500">
                      🔒 No credit card required. Confirmation sent instantly via email & WhatsApp.
                    </p>
                  </form>
                </div>
              ) : (
                /* Confirmed Success State */
                <div className="p-4 sm:p-6 text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-3xl mx-auto flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 inline-block mb-2">
                      Demo Confirmed
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                      Your Walkthrough is Booked! 🎉
                    </h3>
                    <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
                      We've reserved your personalized session for{' '}
                      <strong className="text-white">{confirmedBooking.organization_name}</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-xs text-slate-400">Date & Time</span>
                      <span className="text-sm font-semibold text-indigo-300 font-mono">
                        {confirmedBooking.preferred_date} @ {confirmedBooking.preferred_time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-xs text-slate-400">Organization & Scale</span>
                      <span className="text-sm font-medium text-white">
                        {confirmedBooking.organization_name} ({confirmedBooking.seat_capacity})
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Meeting Platform</span>
                      <span className="text-sm font-medium text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Google Meet / Video Conference
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <a
                      href={createGoogleCalendarUrl(confirmedBooking)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700/90 h-11 px-5 rounded-xl border border-slate-700 transition"
                    >
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span>Add to Google Calendar</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>

                    <Link
                      to="/student/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 h-11 px-5 rounded-xl shadow-md transition"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Explore Interactive Demo Now</span>
                    </Link>

                    <button
                      onClick={() => navigate('/')}
                      className="w-full sm:w-auto px-5 h-11 text-xs sm:text-sm text-slate-400 hover:text-white border border-slate-800 rounded-xl transition"
                    >
                      Back to Home
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookDemo;
