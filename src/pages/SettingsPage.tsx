import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    api.getSettings().then(res => setSettings(res)).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      setSavedMessage('Settings successfully saved!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    }
  };

  if (loading || !settings) return <div className="p-8 text-center text-slate-400">Loading system settings...</div>;

  return (
    <div className="space-y-6 animate-fadeIn pb-8 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings & Deduction Config</h1>
          <p className="text-xs text-slate-500 mt-1">Configure company profile, financial rules & statutory deduction rates for client RA bills</p>
        </div>
      </div>

      {savedMessage && <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold">{savedMessage}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900 mb-3 border-b pb-2">Contracting Company Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company Registered Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={settings.gstNumber}
                onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">PAN Number</label>
              <input
                type="text"
                value={settings.panNumber}
                onChange={(e) => setSettings({ ...settings, panNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={settings.logoUrl || ''}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Currency Code</label>
              <input
                type="text"
                value={settings.currencyCode}
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-sm text-slate-900 mb-3 border-b pb-2">WhatsApp Notifications & Alerts</h3>
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <p className="font-bold text-slate-800">Enable Low Stock WhatsApp Alerts</p>
              <p className="text-slate-500 mt-1">Send WhatsApp notifications to Supervisors & Super Admins when materials fall below reorder levels.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.whatsappAlerts} 
                onChange={(e) => setSettings({ ...settings, whatsappAlerts: e.target.checked })} 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
};
