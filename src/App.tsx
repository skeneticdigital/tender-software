import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Pages
import { Dashboard } from './pages/Dashboard';
import { TenderList } from './pages/TenderList';
import { EmdDashboard } from './pages/EmdDashboard';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetails } from './pages/ProjectDetails';
import { MaterialMaster } from './pages/MaterialMaster';
import { InventoryDashboard } from './pages/InventoryDashboard';
import { BillingDashboard } from './pages/BillingDashboard';
import { PaymentTracking } from './pages/PaymentTracking';
import { RetentionDashboard } from './pages/RetentionDashboard';
import { ReportsHub } from './pages/ReportsHub';
import { NotificationsPage } from './pages/NotificationsPage';
import { UserManagement } from './pages/UserManagement';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { DatabaseConsole } from './pages/DatabaseConsole';
import { LoginPage } from './pages/LoginPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTenderId, setSelectedTenderId] = useState<string | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  const handleNavigateTab = (tab: string, id?: string) => {
    setActiveTab(tab);
    if (tab === 'tenders' && id) {
      setSelectedTenderId(id);
    }
    if (tab === 'projects' && id) {
      setSelectedProjectId(id);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col justify-center items-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading TenderFlow ERP...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard onNavigateTab={handleNavigateTab} />
            )}

            {activeTab === 'tenders' && (
              <TenderList
                onNavigateTab={handleNavigateTab}
                selectedTenderId={selectedTenderId}
              />
            )}

            {activeTab === 'emd' && (
              <EmdDashboard />
            )}

            {activeTab === 'projects' && (
              selectedProjectId ? (
                <ProjectDetails
                  projectId={selectedProjectId}
                  onBack={() => setSelectedProjectId(undefined)}
                  onNavigateTab={handleNavigateTab}
                />
              ) : (
                <ProjectList onSelectProject={handleSelectProject} />
              )
            )}

            {activeTab === 'materials' && (
              <MaterialMaster />
            )}

            {activeTab === 'inventory' && (
              <InventoryDashboard />
            )}

            {activeTab === 'billing' && (
              <BillingDashboard />
            )}

            {activeTab === 'payments' && (
              <PaymentTracking />
            )}

            {activeTab === 'retention' && (
              <RetentionDashboard />
            )}

            {activeTab === 'reports' && (
              <ReportsHub />
            )}

            {activeTab === 'notifications' && (
              <NotificationsPage />
            )}

            {activeTab === 'users' && (
              <UserManagement />
            )}

            {activeTab === 'settings' && (
              <SettingsPage />
            )}

            {activeTab === 'audit' && (
              <AuditLogsPage />
            )}

            {activeTab === 'database' && (
              <DatabaseConsole />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
