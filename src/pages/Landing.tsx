import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  Armchair,
  Shield,
  LayoutDashboard,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  QrCode,
  Lock,
  ChevronRight,
  Wifi,
  Sun,
  ShieldCheck,
  GraduationCap,
  Calendar,
  Building2
} from 'lucide-react';
import { SeatMapPreview } from '../components/ui/SeatMapPreview';
import { BookDemoModal } from '../components/ui/BookDemoModal';
import heroLibraryImg from '../assets/hero-library.jpg';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Secret keyboard shortcut: Ctrl+Shift+A or Alt+A to open Admin Portal discreetly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        navigate('/admin/login');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative">


      {/* Header / Nav - Student Focused, No Admin Clutter */}
      <header className="border-b border-slate-800/80 sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">
              Library<span className="text-indigo-400">MS</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#seat-map"
              className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 transition hidden md:inline-block"
            >
              Floor Map Radar
            </a>

            {/* Book a Demo Button */}
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm shadow-amber-500/10"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Book a Demo</span>
            </button>

            <Link
              to="/student/login"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition active:scale-95"
            >
              Student Login
            </Link>

            {/* Direct primary Register as Student CTA in Navbar */}
            <Link
              to="/student/register"
              className="group inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 h-9 sm:h-10 px-3 sm:px-4 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 border border-indigo-400/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <GraduationCap className="w-4 h-4 text-indigo-200 shrink-0" />
              <span>
                Register<span className="hidden sm:inline"> as Student</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-200/80 group-hover:translate-x-0.5 transition-transform hidden sm:inline-block" />
            </Link>
          </nav>
        </div>
      </header>


      {/* SECTION 1 — HERO SECTION: Full-Width Background Image with Balanced 45-55% Dark Overlay */}
      <section className="relative overflow-hidden min-h-[82vh] lg:min-h-[86vh] flex flex-col justify-center py-20 lg:py-28">
        {/* Full-width Background Image & Balanced 45-55% Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={heroLibraryImg}
            alt="Central Study Library Reading Hall"
            className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.05]"
          />

          {/* Dark semi-transparent overlay: ~45-55% opacity for balanced image visibility & text contrast */}
          <div className="absolute inset-0 bg-slate-950/50" />

          {/* Subtle gradient: slightly stronger behind text, lighter toward visible image area */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/45 to-slate-950/60" />

          {/* Subtle radial ambient highlight */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(2,6,23,0.35)_100%)]" />
        </div>

        {/* Hero Content: Vertically Centered with Generous Spacing */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-2">
          {/* Live Status Pill with Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/40 mb-6 shadow-xl"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-white font-medium">Silent Study Sanctuary Complex</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Live Seat Radar Active
            </span>
          </motion.div>

          {/* Main Title with Rich Text Drop Shadow */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
          >
            Find Your Ideal Study Seat,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
              In Real-Time.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base sm:text-xl text-slate-100 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] font-normal"
          >
            Live architectural floor radar, silent study cabins, natural daylight carrels, and verified
            digital holographic passes for all registered students.
          </motion.p>

          {/* Sleek, Perfectly Proportioned Hero CTA Buttons with Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto"
          >
            {/* Primary Action: Register as Student */}
            <Link
              to="/student/register"
              id="hero-register-btn"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-sm sm:text-base font-semibold h-12 px-6 sm:px-7 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-xl shadow-indigo-950/60 hover:shadow-indigo-500/40 border border-indigo-400/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              <GraduationCap className="h-5 w-5 text-indigo-200 shrink-0" />
              <span>Register as Student</span>
              <ArrowRight className="h-4 w-4 ml-0.5 text-indigo-200 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>

            {/* Book a Demo Button */}
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm sm:text-base font-semibold h-12 px-6 sm:px-7 bg-slate-900/90 hover:bg-slate-800/90 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 rounded-xl shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-4.5 h-4.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Book a Demo</span>
            </button>

            {/* Student Login */}
            <Link
              to="/student/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm sm:text-base font-semibold h-12 px-5 sm:px-6 bg-slate-950/85 hover:bg-slate-900/90 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-500 rounded-xl shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              <span>Student Login</span>
            </Link>
          </motion.div>

          {/* Glassmorphic Feature Highlights Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 inline-flex flex-wrap items-center justify-center gap-4 sm:gap-8 px-6 py-2.5 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800/90 shadow-2xl text-xs text-slate-300"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Instant Digital ID Pass</span>
            </div>
            <div className="hidden sm:block text-slate-700">•</div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero Double-Booking Conflict</span>
            </div>
            <div className="hidden sm:block text-slate-700">•</div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Multi-Floor Visual Radar</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2 — FLOOR MAP SECTION: Completely Separate with Clean Neutral/Light Background */}
      <section
        id="seat-map"
        className="relative py-20 lg:py-28 bg-slate-50 border-y border-slate-200/90 text-slate-900 scroll-mt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-4 shadow-2xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Architectural Facility Layout & Seating Radar</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
              Interactive Library Floor Map
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Explore dedicated silent cabins, open study areas, amenities, and real-time seat availability across Ground and Upper floors before you arrive.
            </p>
          </div>

          {/* Primary Visual Element: Centered Floor Map */}
          <div className="max-w-6xl mx-auto">
            <SeatMapPreview />
          </div>
        </div>
      </section>


      {/* Student Highlights Section (No Admin Clutter) */}
      <section className="py-20 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Engineered for Focused Student Productivity
            </h2>
            <p className="mt-3 text-slate-400 text-base">
              Everything students need for a frictionless study environment and seamless entry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/40 transition-all shadow-xl">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl w-fit mb-6">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Digital Student Pass</h3>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Receive your official library pass with holographic verification, barcodes, and designated seat numbers ready to show or print.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> One-click printable PDF format
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Validated student credentials
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 hover:border-emerald-500/40 transition-all shadow-xl">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl w-fit mb-6">
                <Armchair className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Dedicated Study Stations</h3>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Guaranteed allocated seats across quiet academic pods, collaborative tech islands, and natural sunlight window rows.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 65W USB-C fast charging stations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> High-back ergonomic mesh seating
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 hover:border-purple-500/40 transition-all shadow-xl">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl w-fit mb-6">
                <Wifi className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Gigabit Campus Wi-Fi 6</h3>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Seamless low-latency connectivity throughout every floor, study carrel, and group discussion pod.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Ultra-fast research speeds
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Zero dead-zone mesh coverage
                </li>
              </ul>
            </div>
          </div>

          {/* SECTION: Flexible Study Shift Pricing */}
          <div className="mt-20 scroll-mt-20" id="pricing">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Transparent & Student-Friendly Pricing</span>
              </div>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">Flexible Study Shifts & Plans</h3>
              <p className="text-slate-400 text-sm mt-2">
                Choose the timing that matches your study routine with all premium amenities included.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Plan 1: Full Day 12 Hours */}
              <div className="relative rounded-3xl bg-slate-900/90 border-2 border-indigo-500/60 p-8 shadow-2xl flex flex-col justify-between hover:border-indigo-400 transition-all group">
                <div className="absolute -top-3.5 right-6 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-[11px] font-bold text-white uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white">Full Day Pass</h4>
                      <p className="text-xs text-indigo-300 font-medium mt-0.5">12 Hours Dedicated Daily Access</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-white">₹1,200</span>
                      <span className="text-xs text-slate-400"> / month</span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-800 my-5" />

                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>12 Hours Access</strong> (7:00 AM – 7:00 PM or 8:00 AM – 8:00 PM)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Dedicated reserved personal study desk</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>High-speed unlimited 5G optical Wi-Fi</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Personal 3-pin power socket & reading light</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Fully air-conditioned silent sanctuary hall</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Chilled RO drinking water & clean washrooms</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    to="/student/register"
                    className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 transition group-hover:scale-[1.01]"
                  >
                    <span>Reserve 12-Hour Desk</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Plan 2: Half Day 6 Hours */}
              <div className="relative rounded-3xl bg-slate-900/60 border border-slate-800 p-8 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
                <div className="absolute -top-3.5 right-6 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Flexible Shift
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white">Half Day Pass</h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">6 Hours Daily (Morning / Evening)</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-white">₹600</span>
                      <span className="text-xs text-slate-400"> / month</span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-800 my-5" />

                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>6 Hours Shift</strong> (Morning: 7 AM – 1 PM or Evening: 1 PM – 7 PM)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Comfortable ergonomic desk seating</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>High-speed unlimited 5G optical Wi-Fi</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Active charging switchboard at every desk</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Fully air-conditioned quiet reading environment</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>RO water and hygienic sanitized facilities</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    to="/student/register"
                    className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition hover:border-slate-600"
                  >
                    <span>Reserve 6-Hour Desk</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Student Action Callout */}
          <div className="mt-16 bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-950 rounded-3xl p-8 sm:p-10 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-6 shadow-2xl">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Ready to study in peace?</h3>
              <p className="text-sm text-indigo-200 max-w-xl">
                Create your student account in seconds. Get instant access to the seat radar and your digital entry pass.
              </p>
            </div>
            <Link
              to="/student/register"
              className="group inline-flex items-center gap-2.5 text-sm sm:text-base font-semibold bg-white hover:bg-slate-100 text-indigo-950 h-12 px-6 sm:px-7 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer font-sans whitespace-nowrap"
            >
              <GraduationCap className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
              <span>Register as Student</span>
              <ArrowRight className="w-4 h-4 text-indigo-600 ml-0.5 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          </div>

          {/* Institutional / Study Center Owner Callout */}
          <div className="mt-8 bg-slate-900/90 rounded-3xl p-8 sm:p-10 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30 mb-3">
                <Building2 className="w-3.5 h-3.5" />
                <span>For Reading Rooms, Study Centers & Coaching Academies</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Want LibraryMS for Your Facility?</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Get a customized 30-minute walkthrough showing how our software handles multiple floors, RFID barcode passes, fees tracking, and instant WhatsApp reminders.
              </p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm sm:text-base font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 h-12 px-6 sm:px-7 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-98 cursor-pointer whitespace-nowrap"
              >
                <Calendar className="w-4.5 h-4.5 text-slate-950" />
                <span>Schedule Free Demo</span>
              </button>
              <Link
                to="/book-demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white px-4 py-2 rounded-xl transition"
              >
                <span>Full Page View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Discreet Staff Access Only */}
      <footer className="border-t border-slate-800/80 py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <span className="text-slate-400 font-medium text-xs">
              © 2026 LibraryMS. Central Study Centre & Student Management System.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book a Demo</span>
            </button>
            <Link to="/student/login" className="hover:text-white transition">Student Portal</Link>
            <Link to="/student/register" className="hover:text-white transition">Student Registration</Link>
            <a href="#seat-map" className="hover:text-white transition">Live Floor Map</a>

            {/* Discreet Admin / Staff Link */}
            <div className="border-l border-slate-800 pl-6 flex items-center">
              <Link
                to="/admin/login"
                title="Librarian & Staff Administration Portal (or press Ctrl+Shift+A)"
                className="text-slate-500 hover:text-slate-300 text-[11px] transition-colors flex items-center gap-1 group"
              >
                <Lock className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                <span>Staff Access</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Book a Demo Interactive Modal */}
      <BookDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onExploreInteractiveDemo={() => navigate('/student/login')}
      />
    </div>
  );
};

export default Landing;

