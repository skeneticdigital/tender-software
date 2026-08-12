import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';
import { AppNotification } from '../types';
import { Badge } from '../components/ui/Badge';

export const NotificationsPage: React.FC = () => {
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
    fetchNotifs();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Alerts & Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">Automated reminders for tender submission deadlines, overdue EMD refunds, low material stock & unpaid bills</p>
        </div>
        <button
          onClick={handleMarkAll}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <CheckCheck className="w-4 h-4" /> Mark All as Read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading notifications...</div>
        ) : notifs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No active notifications</div>
        ) : (
          notifs.map((n) => (
            <div key={n.id} className={`p-4 flex items-start justify-between gap-4 text-xs ${!n.isRead ? 'bg-blue-50/40 font-semibold' : ''}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                  <Badge variant={n.priority === 'Critical' ? 'danger' : 'warning'}>{n.priority}</Badge>
                </div>
                <p className="text-slate-600">{n.message}</p>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">{new Date(n.createdAt).toLocaleTimeString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
