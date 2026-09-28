import React, { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BookOpen, LayoutDashboard, Users, Armchair, UserPlus, 
  Settings, LogOut, Menu, X, Bell, CreditCard, MessageSquare 
} from 'lucide-react';
import { NotificationDropdown } from '../ui/NotificationDropdown';

const navLinks = [
  { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Students', to: '/admin/students', icon: Users },
  { name: 'Seats', to: '/admin/seats', icon: Armchair },
  { name: 'Seat Allocation', to: '/admin/seat-allocation', icon: UserPlus },
  { name: 'Subscriptions', to: '/admin/subscriptions', icon: CreditCard },
  { name: 'Helpdesk & Chat', to: '/admin/messages', icon: MessageSquare },
  { name: 'Settings', to: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const { profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const link = navLinks.find(l => l.to === location.pathname);
    return link ? link.name : 'Admin Panel';
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:w-16 lg:w-64 overflow-y-auto group`}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-200 px-4">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900 md:hidden lg:block">LibraryMS</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
              title={item.name}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="md:hidden lg:block font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-gray-500" />
            <span className="md:hidden lg:block font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-0 overflow-hidden">
        {/* Top Navigation */}
        <header className="flex-shrink-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
              {getPageTitle()}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationDropdown align="right" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                {profile?.full_name?.charAt(0) || 'A'}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {profile?.full_name || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
