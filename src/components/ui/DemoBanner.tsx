import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, KeyRound, Check, Copy, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function DemoBanner() {
  const { isDemoMode } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isDemoMode || dismissed) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 text-white text-xs sm:text-sm px-4 py-2 shadow-md relative z-50 border-b border-indigo-700/40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold tracking-wide text-indigo-200 uppercase text-[11px] bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-500/30">
            Interactive Demo Mode
          </span>
          <span className="text-indigo-200 hidden sm:inline text-xs">
            Using interactive local storage with pre-seeded data. All features work immediately!
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/book-demo"
            className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold px-2.5 py-1 rounded-md border border-amber-500/40 text-xs transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book a Demo</span>
          </Link>

          <button
            onClick={() => setShowCredentials(!showCredentials)}
            className="flex items-center gap-1.5 bg-indigo-800/80 hover:bg-indigo-700 active:scale-95 transition-all text-white font-medium px-2.5 py-1 rounded-md border border-indigo-600/50 text-xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-300" />
            <span>{showCredentials ? 'Hide Accounts' : '⚡ 1-Click Demo Accounts'}</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="text-indigo-300 hover:text-white transition-colors p-1"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>


      {showCredentials && (
        <div className="mt-2.5 pt-2.5 border-t border-indigo-800/60 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="bg-indigo-900/60 rounded-lg p-2.5 border border-indigo-700/50 flex items-center justify-between">
            <div>
              <span className="text-amber-300 font-bold uppercase text-[10px] block">Admin Account</span>
              <span className="text-white font-mono">admin@library.com</span>
              <span className="text-indigo-300 ml-2 font-mono">/ admin123</span>
            </div>
            <button
              onClick={() => copyToClipboard('admin@library.com', 'admin')}
              className="text-indigo-200 hover:text-white bg-indigo-800/80 px-2 py-1 rounded flex items-center gap-1 transition text-[11px]"
            >
              {copiedText === 'admin' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedText === 'admin' ? 'Copied' : 'Copy Email'}</span>
            </button>
          </div>

          <div className="bg-indigo-900/60 rounded-lg p-2.5 border border-indigo-700/50 flex items-center justify-between">
            <div>
              <span className="text-emerald-300 font-bold uppercase text-[10px] block">Student Account</span>
              <span className="text-white font-mono">aarav.sharma@example.com</span>
              <span className="text-indigo-300 ml-2 font-mono">/ student123</span>
            </div>
            <button
              onClick={() => copyToClipboard('aarav.sharma@example.com', 'student')}
              className="text-indigo-200 hover:text-white bg-indigo-800/80 px-2 py-1 rounded flex items-center gap-1 transition text-[11px]"
            >
              {copiedText === 'student' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedText === 'student' ? 'Copied' : 'Copy Email'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
