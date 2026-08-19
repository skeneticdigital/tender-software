import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Pages
import { Dashboard } from './pages/Dashboard';
import { TenderList } from './pages/TenderList';
import { EstimateModule } from './pages/EstimateModule';
import { RateAnalysisModule } from './pages/RateAnalysisModule';
import { WorkOrderModule } from './pages/WorkOrderModule';
import { EmdDashboard } from './pages/EmdDashboard';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetails } from './pages/ProjectDetails';
import { MaterialMaster } from './pages/MaterialMaster';
import { InventoryDashboard } from './pages/InventoryDashboard';
import { MachineryModule } from './pages/MachineryModule';
import { LabourModule } from './pages/LabourModule';
import { BillingDashboard } from './pages/BillingDashboard';
import { PaymentTracking } from './pages/PaymentTracking';
import { RetentionDashboard } from './pages/RetentionDashboard';
import { CompanyFilingModule } from './pages/CompanyFilingModule';
import { CertificateModule } from './pages/CertificateModule';
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

            {activeTab === 'estimates' && (
              <EstimateModule />
            )}

            {activeTab === 'rate-analysis' && (
              <RateAnalysisModule />
            )}

            {activeTab === 'work-orders' && (
              <WorkOrderModule />
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

            {activeTab === 'machinery' && (
              <MachineryModule />
            )}

            {activeTab === 'labour' && (
              <LabourModule />
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

            {activeTab === 'company-filings' && (
              <CompanyFilingModule />
            )}

            {activeTab === 'certificates' && (
              <CertificateModule />
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

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-slate-950 flex flex-col justify-center items-center text-white space-y-4 p-6 text-center">
          <h2 className="text-xl font-bold text-rose-400">Something went wrong rendering this page.</h2>
          <p className="text-xs text-slate-400">Please refresh the page to reload TenderFlow ERP.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
