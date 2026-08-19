import React from 'react';
import {
  LayoutDashboard, FileText, Landmark, HardHat, Package, Warehouse,
  IndianRupee, CreditCard, ShieldAlert, BarChart3, FolderKanban,
  Bell, Users, Settings, History, Building2, ChevronRight, Database,
  Calculator, TrendingUp, FileSpreadsheet, Truck, Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, roles: ['*'] },
    // 11 Core ERP Modules
    { id: 'tenders', label: '1. Tender Module', icon: FileText, roles: ['*'] },
    { id: 'estimates', label: '2. Estimate Module', icon: Calculator, roles: ['*'] },
    { id: 'rate-analysis', label: '3. Rate Calculations', icon: TrendingUp, roles: ['*'] },
    { id: 'work-orders', label: '4. Work Order Module', icon: FileSpreadsheet, roles: ['*'] },
    { id: 'projects', label: '5. Project Management', icon: HardHat, roles: ['*'] },
    { id: 'materials', label: '6. Material Management', icon: Package, roles: ['*'] },
    { id: 'inventory', label: 'Inventory & Dispatch', icon: Warehouse, roles: ['*'] },
    { id: 'machinery', label: '7. Machinery Management', icon: Truck, roles: ['*'] },
    { id: 'labour', label: '8. Labour Management', icon: Users, roles: ['*'] },
    { id: 'billing', label: '9. Billing Management', icon: IndianRupee, roles: ['*'] },
    { id: 'emd', label: 'EMDs & Deposits', icon: Landmark, roles: ['*'] },
    { id: 'payments', label: 'Payment Tracking', icon: CreditCard, roles: ['*'] },
    { id: 'retention', label: 'Retention Money', icon: ShieldAlert, roles: ['*'] },
    { id: 'company-filings', label: '10. Company Filings', icon: Building2, roles: ['*'] },
    { id: 'certificates', label: '11. Experience Certs', icon: Award, roles: ['*'] },
    // System Utilities
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['*'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['*'] },
    { id: 'users', label: 'Users & Roles', icon: Users, roles: ['Super Admin', 'Admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Super Admin', 'Admin'] },
    { id: 'database', label: 'Database Console', icon: Database, roles: ['Super Admin', 'Admin'] }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 text-slate-300 min-h-screen select-none">
      <div className="p-4 border-b border-slate-800 flex items-center justify-center bg-slate-900">
        <img src="/logo.png?v=6" alt="Elvina Infra" className="h-32 w-full object-contain drop-shadow-xl" style={{ filter: 'brightness(1.2) contrast(1.1)' }} />
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';
          const isAllowed = isAdmin || 
                            (user?.accessibleModules ? user.accessibleModules.includes(item.id) : (item.roles[0] === '*' || item.roles.includes(user?.role || '')));

          if (!isAllowed) {
            return null;
          }

          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
