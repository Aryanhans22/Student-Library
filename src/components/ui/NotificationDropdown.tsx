import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { 
  Bell, AlertTriangle, MessageSquare, CheckCheck, Trash2, 
  Armchair, RefreshCw, Clock 
} from 'lucide-react';

interface NotificationDropdownProps {
  align?: 'left' | 'right';
  className?: string;
}

export function NotificationDropdown({ align = 'right', className = '' }: NotificationDropdownProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { 
    notifications, 
    unreadCount, 
    loading,
    markRead, 
    markAllAsRead, 
    clearAll, 
    fetchNotifications 
  } = useNotifications(profile?.id);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notifId: string, link?: string) => {
    await markRead(notifId);
    setIsOpen(false);
    if (link) {
      navigate(link);
    }
  };

  const handleToggle = () => {
    if (!isOpen && profile?.id) {
      fetchNotifications(profile.id);
    }
    setIsOpen((prev) => !prev);
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'subscription_expiry':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'chat_message':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'seat_allocated':
      case 'seat_released':
        return <Armchair className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNotifBg = (type: string) => {
    switch (type) {
      case 'subscription_expiry':
        return 'bg-amber-100';
      case 'chat_message':
        return 'bg-indigo-100';
      case 'seat_allocated':
      case 'seat_released':
        return 'bg-emerald-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="View notifications"
        aria-expanded={isOpen}
        className="relative p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150`}
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => profile?.id && markAllAsRead(profile.id)}
                  title="Mark all as read"
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => profile?.id && clearAll(profile.id)}
                  title="Clear all notifications"
                  className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => profile?.id && fetchNotifications(profile.id)}
                title="Refresh notifications"
                className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-gray-700">All caught up!</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] mx-auto">
                  No new notifications right now. System alerts and messages will appear here.
                </p>
                <button
                  type="button"
                  onClick={() => profile?.id && fetchNotifications(profile.id)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Check for updates</span>
                </button>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.id, notif.link)}
                  className={`p-3.5 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3 text-left ${
                    !notif.is_read ? 'bg-indigo-50/40' : 'bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${getNotifBg(notif.type)}`}>
                    {getNotifIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs font-bold truncate ${
                          !notif.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1">
                      <Clock className="w-3 h-3 text-gray-300" />
                      <span>{formatTimeAgo(notif.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer link to relevant action */}
          {profile?.role === 'admin' ? (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/70 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin/messages');
                }}
                className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Go to Messages →
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin/subscriptions');
                }}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Subscriptions
              </button>
            </div>
          ) : (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/70 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/student/chat');
                }}
                className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Open Helpdesk Chat →
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/student/dashboard');
                }}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                My Desk
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
