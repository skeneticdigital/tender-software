import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { AppNotification } from '../types';
import { Badge } from '../components/ui/Badge';

interface NotificationsPageProps {
  onNavigateTab?: (tab: string, id?: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigateTab }) => {
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifs(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAll = async () => {
    await api.markAllNotificationsRead();
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotifClick = async (n: AppNotification) => {
    if (!n.isRead) {
      await api.markNotificationRead(n.id);
      setNotifs(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
    }
    if (n.relatedModule && onNavigateTab) {
      onNavigateTab(n.relatedModule, n.relatedId);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Alerts & Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">Automated reminders for tender submission deadlines, overdue EMD refunds, low material stock & unpaid bills</p>
        </div>
        <button
          onClick={handleMarkAll}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
        >
          <CheckCheck className="w-4 h-4 text-emerald-600" /> Mark All as Read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading notifications...</div>
        ) : notifs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No active notifications</div>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotifClick(n)}
              className={`p-4.5 flex items-start justify-between gap-4 text-xs transition-all cursor-pointer ${
                !n.isRead
                  ? 'bg-blue-50/70 border-l-4 border-l-blue-600 font-semibold shadow-xs hover:bg-blue-100/60'
                  : 'bg-white hover:bg-slate-50 border-l-4 border-l-slate-200 text-slate-600'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  {!n.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" title="Unread Notification" />
                  )}
                  <span className={`text-sm ${!n.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                    {n.title}
                  </span>
                  <Badge variant={n.priority === 'Critical' ? 'danger' : n.priority === 'High' ? 'warning' : 'info'}>
                    {n.priority}
                  </Badge>
                  {!n.isRead && (
                    <Badge variant="purple" size="sm">New</Badge>
                  )}
                </div>
                <p className={`${!n.isRead ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{n.message}</p>
                {n.relatedModule && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 mt-1 hover:underline">
                    Click to view in {n.relatedModule.toUpperCase()} Module <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
