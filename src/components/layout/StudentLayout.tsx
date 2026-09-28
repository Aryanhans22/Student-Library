import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BookOpen, LogOut, Menu, X, User, MessageSquare 
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { NotificationDropdown } from '../ui/NotificationDropdown';

export default function StudentLayout() {
  const { profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/student/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand Logo & Desktop Nav Links */}
            <div className="flex items-center gap-8">
              <Link to="/student/dashboard" className="flex items-center gap-2.5">
                <BookOpen className="w-8 h-8 text-indigo-600" />
                <span className="text-xl font-bold text-gray-900">LibraryMS</span>
              </Link>

              <nav className="hidden sm:flex items-center gap-1.5">
                <Link
                  to="/student/dashboard"
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                    location.pathname === '/student/dashboard'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/student/chat"
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    location.pathname === '/student/chat'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Helpdesk & Chat</span>
                </Link>
              </nav>
            </div>

            {/* Right Side: Notification Bell (Always Visible) + Profile + Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notification Bell Dropdown - Always visible and functional on all screen sizes */}
              <NotificationDropdown align="right" />

              {/* Desktop Profile & Logout */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-5 w-px bg-gray-200 mx-1" />

                <Link
                  to="/student/profile"
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 text-sm font-semibold hover:bg-gray-100 px-2.5 py-1.5 rounded-xl transition"
                >
                  <Avatar
                    name={profile?.full_name || 'Student'}
                    src={profile?.profile_image_url || undefined}
                    size="sm"
                  />
                  <span className="max-w-[120px] truncate">{profile?.full_name || 'Profile'}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 sm:hidden"
                aria-label="Toggle navigation menu"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <Link
              to="/student/dashboard"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/student/chat"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              onClick={() => setMenuOpen(false)}
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              Helpdesk & Chat
            </Link>
            <Link
              to="/student/profile"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              onClick={() => setMenuOpen(false)}
            >
              <User className="w-4 h-4 text-gray-500" />
              My Profile
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
