import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ShieldCheck, Printer, Armchair, Sparkles, QrCode } from 'lucide-react';
import type { Profile, Seat } from '../../types/database';
import { formatDate } from '../../lib/utils';

interface StudentIDCardProps {
  profile: Profile;
  seat?: Seat | null;
  className?: string;
}

export function StudentIDCard({ profile, seat, className = '' }: StudentIDCardProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* 3D-effect Holographic Card Container */}
      <motion.div
        whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-full max-w-md relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-2xl border border-indigo-500/30 backdrop-blur-md"
      >
        {/* Holographic Shimmer Overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/15 to-transparent pointer-events-none" />
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-indigo-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-inner">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-white via-indigo-200 to-indigo-100 bg-clip-text text-transparent">
                Central Study Centre
              </h3>
              <p className="text-[10px] text-indigo-300 tracking-widest font-mono uppercase">Official Digital Pass</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide">
            <ShieldCheck className="w-3 h-3" />
            <span>VERIFIED</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="relative z-10 mt-5 flex gap-4 items-start">
          {/* Avatar / Photo with Smart Frame */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-400/40 shadow-lg bg-indigo-900/60 flex items-center justify-center relative">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-indigo-200 uppercase">
                  {profile.full_name.charAt(0)}
                </span>
              )}
            </div>
            <span className="text-[9px] font-mono text-indigo-300/80 uppercase">ID BADGE</span>
          </div>

          {/* Student Info */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-indigo-300">Student Name</p>
              <h2 className="text-lg font-bold text-white truncate tracking-tight">
                {profile.full_name}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] uppercase font-semibold text-indigo-300">Reg. ID</p>
                <p className="text-xs font-mono font-bold text-indigo-100 bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-700/40 inline-block">
                  {profile.student_id || 'PENDING'}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-semibold text-indigo-300">Member Since</p>
                <p className="text-xs font-medium text-slate-200">
                  {formatDate(profile.created_at)}
                </p>
              </div>
            </div>

            {/* Allocated Seat Pill */}
            <div className="pt-1">
              <p className="text-[10px] uppercase font-semibold text-indigo-300 mb-1">Allocated Seat</p>
              {seat ? (
                <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-950/80 to-indigo-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                  <Armchair className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-sm text-emerald-200 font-mono">Seat {seat.seat_number}</span>
                  <span className="text-[10px] text-slate-300 font-medium">
                    ({seat.floor || 'Floor 1'}{seat.section ? `, Sec ${seat.section}` : ''})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-slate-800/70 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-400 text-xs">
                  <Armchair className="w-3.5 h-3.5 text-slate-500" />
                  <span>No seat currently assigned</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barcode Strip at Bottom */}
        <div className="relative z-10 mt-5 pt-3 border-t border-indigo-800/60 flex items-center justify-between">
          <div className="flex flex-col">
            {/* CSS-generated stylized barcode */}
            <div className="flex items-end gap-[2px] h-6 px-1 bg-white/10 rounded py-1">
              {[4, 8, 2, 6, 9, 3, 7, 5, 8, 2, 7, 4, 9, 3, 6, 8, 3, 5, 7, 2, 9, 4, 8].map((h, i) => (
                <div
                  key={i}
                  className="bg-indigo-200 w-[2px]"
                  style={{ height: `${(h / 10) * 100}%` }}
                />
              ))}
            </div>
            <span className="text-[8px] font-mono text-indigo-400 tracking-wider mt-0.5">
              {profile.student_id ? `*${profile.student_id}*` : '*STUDENT-PASS*'}
            </span>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1 text-[10px] text-indigo-300 font-mono">
              <QrCode className="w-3.5 h-3.5" />
              <span>DIGITAL SMART PASS</span>
            </div>
            <p className="text-[8px] text-indigo-400/80">Valid for Academic Year 2026</p>
          </div>
        </div>
      </motion.div>

      {/* Print / Save Card Button */}
      <button
        onClick={handlePrint}
        className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-1.5 rounded-lg transition active:scale-95 shadow-sm"
      >
        <Printer className="w-3.5 h-3.5" />
        <span>Print ID Card / Save PDF</span>
      </button>
    </div>
  );
}
