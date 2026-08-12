import React, { useState, useEffect } from 'react';
import { Bell, Search, UserCheck, LogOut, ChevronDown, Check, ShieldAlert, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, AppNotification } from '../../types';
import { api } from '../../lib/api';

interface HeaderProps {
  onSearchChange?: (q: string) => void;
  onNavigateModule?: (module: string, id?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchChange, onNavigateModule }) => {
  const { user, logout, switchRoleDemo } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const rolesList: UserRole[] = [
    'Super Admin',
    'Admin',
    'Tender Manager',
    'Project Manager',
    'Site Supervisor',
    'Accounts Manager',
    'Management / Viewer'
  ];

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    }
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (onSearchChange) onSearchChange(val);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 lg:px-6 shadow-sm">
      {/* Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Global Search (Tenders, Projects, Bills, Materials...)"
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-950/80 border border-blue-800/80 rounded-lg text-xs font-semibold text-blue-200 hover:bg-blue-900 transition-colors"
            title="Switch User Role for Testing"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Role:</span>
            <span className="text-white">{user?.role}</span>
            <ChevronDown className="w-3 h-3 text-blue-400" />
          </button>

          {showRoleSelector && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-slate-200 animate-fadeIn">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Switch Role Persona
              </div>
              <div className="py-1">
                {rolesList.map((r) => (
                  <button
                    key={r}
                    onClick={async () => {
                      setShowRoleSelector(false);
                      await switchRoleDemo(r);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                      user?.role === r ? 'bg-blue-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{r}</span>
                    {user?.role === r && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 text-slate-200 overflow-hidden animate-fadeIn">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Notifications & Alerts</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No active notifications</div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      onClick={async () => {
                        await api.markNotificationRead(n.id);
                        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
                        if (onNavigateModule && n.relatedModule) {
                          onNavigateModule(n.relatedModule, n.relatedId);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3.5 text-xs cursor-pointer hover:bg-slate-800/60 transition-colors ${
                        !n.isRead ? 'bg-slate-800/30 font-medium' : 'opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-semibold ${
                          n.priority === 'Critical' ? 'text-rose-400' :
                          n.priority === 'High' ? 'text-amber-400' : 'text-blue-400'
                        }`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="pl-2 border-l border-slate-800 flex items-center gap-2">
          <div className="hidden md:block text-right">
            <div className="text-xs font-semibold text-slate-100">{user?.name}</div>
            <div className="text-[10px] text-slate-400">{user?.department}</div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
