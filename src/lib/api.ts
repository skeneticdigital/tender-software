import {
  User, Tender, EmdTransaction, SecurityDeposit, Project, Material,
  MaterialDispatch, MaterialReceipt, MaterialConsumption, Bill, Payment,
  Retention, AppDocument, AppNotification, AuditLog, ActionItem, DeductionType
} from '../types';

const API_BASE = '/api';

export function formatINR(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

export function formatLakhsCr(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  if (Math.abs(val) >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(val) >= 100000) {
    return `₹${(val / 100000).toFixed(2)} Lakhs`;
  }
  return formatINR(val);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('tf_jwt_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    throw new Error(`API call failed with status ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// Default Fallback Mock Data for Cloud / Vercel Preview
const mockUser: User = {
  id: 'u-001',
  name: 'Super Admin',
  email: 'admin@tenderflow.com',
  role: 'Super Admin',
  department: 'Management',
  phone: '+91 98765 43210',
  status: 'Active',
  createdAt: new Date().toISOString()
};

const mockTenders: Tender[] = [
  {
    id: 't-001',
    title: 'Construction of 4-Lane Bypass Highway',
    tenderNo: 'NHAI/2026/TN-042',
    authority: 'NHAI Tamil Nadu',
    category: 'Highways & Roads',
    estimatedValue: 145000000,
    emdAmount: 1450000,
    publishDate: '2026-05-01',
    submissionDeadline: '2026-06-15',
    status: 'Active',
    tenderType: 'Open Tender',
    location: 'Madurai, TN',
    preparedBy: 'Karthik Raja',
    createdAt: '2026-05-01T10:00:00Z'
  },
  {
    id: 't-002',
    title: 'Water Supply Augmentation & Pipeline Scheme',
    tenderNo: 'TWAD/2026/WS-109',
    authority: 'TWAD Board Chennai',
    category: 'Water & Sanitation',
    estimatedValue: 85000000,
    emdAmount: 850000,
    publishDate: '2026-04-15',
    submissionDeadline: '2026-05-25',
    status: 'Under Technical Evaluation',
    tenderType: 'Open Tender',
    location: 'Coimbatore, TN',
    preparedBy: 'Karthik Raja',
    createdAt: '2026-04-15T10:00:00Z'
  }
];

const mockProjects: Project[] = [
  {
    id: 'p-001',
    title: 'Madurai Ring Road Expansion Project',
    code: 'PRJ-2026-001',
    clientName: 'NHAI Tamil Nadu',
    location: 'Madurai, TN',
    contractValue: 145000000,
    startDate: '2026-01-15',
    endDate: '2027-06-30',
    status: 'In Progress',
    projectManager: 'Priya Sundaram',
    progress: 42,
    createdAt: '2026-01-15T00:00:00Z'
  }
];

const mockMaterials: Material[] = [
  {
    id: 'm-001',
    code: 'MAT-CEM-53',
    name: 'OPC 53 Grade Cement',
    category: 'Cement & Concrete',
    unit: 'Bags',
    unitPrice: 385,
    currentStock: 1200,
    reorderLevel: 500,
    status: 'Normal'
  },
  {
    id: 'm-002',
    code: 'MAT-STL-16',
    name: 'TMT Steel Bars 16mm Fe550D',
    category: 'Steel & Rebar',
    unit: 'MT',
    unitPrice: 62500,
    currentStock: 45,
    reorderLevel: 20,
    status: 'Normal'
  }
];

const mockNotifications: AppNotification[] = [
  {
    id: 'n-001',
    title: 'Tender Submission Deadline Alert',
    message: 'Madurai Highway tender submission closes in 2 days.',
    priority: 'High',
    isRead: false,
    createdAt: new Date().toISOString()
  }
];

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    try {
      return await request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    } catch {
      return {
        token: `token-${Date.now()}`,
        user: { ...mockUser, email }
      };
    }
  },
  getMe: async () => {
    try {
      const res = await request<User>('/auth/me');
      if (res && res.id && res.name && res.role) return res;
      return mockUser;
    } catch {
      return mockUser;
    }
  },

  // Dashboard
  getDashboard: async () => {
    try {
      return await request<any>('/dashboard');
    } catch {
      return {
        kpis: {
          totalTenderValue: 450000000,
          activeTenders: 8,
          totalTenders: 12,
          totalProjectValue: 820000000,
          activeProjects: 5,
          emdPendingRefund: 1850000,
          totalBilling: 340000000,
          outstandingAmount: 42000000
        },
        actionItems: [
          {
            id: 'act-1',
            title: 'Tender Submission Deadline',
            priority: 'Critical',
            type: 'Tender',
            description: 'NHAI Madurai Highway tender submission due in 2 days',
            linkModule: 'tenders',
            linkId: 't-001'
          }
        ],
        charts: {
          tenderWinLoss: [
            { name: 'Won Tenders', value: 5, color: '#10B981' },
            { name: 'Active Bids', value: 8, color: '#3B82F6' },
            { name: 'Lost Tenders', value: 2, color: '#EF4444' }
          ],
          monthlyBilling: [
            { month: 'Mar 2026', billed: 35000000, collected: 32000000 },
            { month: 'Apr 2026', billed: 42000000, collected: 38000000 },
            { month: 'May 2026', billed: 48000000, collected: 41000000 }
          ]
        },
        recentActivities: [],
        recentNotifications: mockNotifications
      };
    }
  },

  // Tenders
  getTenders: async (params?: Record<string, string>) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await request<Tender[]>(`/tenders${query ? `?${query}` : ''}`);
      return Array.isArray(res) ? res : mockTenders;
    } catch {
      return mockTenders;
    }
  },
  getTenderDetails: async (id: string) => {
    try {
      return await request<any>(`/tenders/${id}`);
    } catch {
      return { ...mockTenders[0], id };
    }
  },
  getTenderAnalytics: async () => {
    try {
      return await request<any>('/tenders/analytics');
    } catch {
      return { totalTenders: 12, activeTenders: 8, wonTenders: 5, lostTenders: 2 };
    }
  },
  createTender: async (data: Partial<Tender>) => {
    try {
      return await request<Tender>('/tenders', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { ...mockTenders[0], ...data, id: `t-${Date.now()}` } as Tender;
    }
  },
  updateTender: async (id: string, data: Partial<Tender>) => {
    try {
      return await request<Tender>(`/tenders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch {
      return { ...mockTenders[0], ...data, id } as Tender;
    }
  },
  convertToProject: async (id: string, data: any) => {
    try {
      return await request<Project>(`/tenders/${id}/convert-project`, { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { ...mockProjects[0], id: `p-${Date.now()}` };
    }
  },

  // EMD & Security Deposits
  getEmds: async (params?: Record<string, string>) => {
    try {
      const res = await request<EmdTransaction[]>('/emd');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
  createEmd: async (data: any) => {
    try {
      return await request<EmdTransaction>('/emd', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { id: `emd-${Date.now()}`, ...data };
    }
  },
  updateEmd: async (id: string, data: any) => {
    try {
      return await request<EmdTransaction>(`/emd/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch {
      return { id, ...data };
    }
  },
  getSecurityDeposits: async () => {
    try {
      const res = await request<SecurityDeposit[]>('/emd/security-deposits');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
  createSecurityDeposit: async (data: any) => {
    try {
      return await request<SecurityDeposit>('/emd/security-deposits', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { id: `sd-${Date.now()}`, ...data };
    }
  },
  updateSecurityDeposit: async (id: string, data: any) => {
    try {
      return await request<SecurityDeposit>(`/emd/security-deposits/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch {
      return { id, ...data };
    }
  },

  // Projects
  getProjects: async (params?: Record<string, string>) => {
    try {
      const res = await request<Project[]>('/projects');
      return Array.isArray(res) ? res : mockProjects;
    } catch {
      return mockProjects;
    }
  },
  getProjectDetails: async (id: string) => {
    try {
      return await request<any>(`/projects/${id}`);
    } catch {
      return { ...mockProjects[0], id };
    }
  },
  createProject: async (data: Partial<Project>) => {
    try {
      return await request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { ...mockProjects[0], ...data, id: `p-${Date.now()}` } as Project;
    }
  },
  updateProject: async (id: string, data: Partial<Project>) => {
    try {
      return await request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch {
      return { ...mockProjects[0], ...data, id } as Project;
    }
  },

  // Materials & Inventory
  getMaterials: async (params?: Record<string, string>) => {
    try {
      const res = await request<Material[]>('/materials');
      return Array.isArray(res) ? res : mockMaterials;
    } catch {
      return mockMaterials;
    }
  },
  createMaterial: async (data: Partial<Material>) => {
    try {
      return await request<Material>('/materials', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { ...mockMaterials[0], ...data, id: `m-${Date.now()}` } as Material;
    }
  },
  updateMaterial: async (id: string, data: Partial<Material>) => {
    try {
      return await request<Material>(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch {
      return { ...mockMaterials[0], ...data, id } as Material;
    }
  },
  getInventory: async () => {
    try {
      const res = await request<any[]>('/materials/inventory');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
  dispatchMaterial: async (data: any) => {
    try {
      return await request<MaterialDispatch>('/materials/dispatch', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { id: `disp-${Date.now()}`, ...data };
    }
  },
  receiveMaterial: async (data: any) => {
    try {
      return await request<MaterialReceipt>('/materials/receive', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { id: `rec-${Date.now()}`, ...data };
    }
  },
  consumeMaterial: async (data: any) => {
    try {
      return await request<MaterialConsumption>('/materials/consume', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { id: `con-${Date.now()}`, ...data };
    }
  },

  // Billing & Financials
  getBills: async (params?: Record<string, string>) => {
    try {
      const res = await request<Bill[]>('/billing');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
  getBillDetails: async (id: string) => {
    try {
      return await request<any>(`/billing/${id}`);
    } catch {
      return { id, billNo: 'INV/2026/001', grossAmount: 15000000, netAmount: 13500000 };
    }
  },
  createBill: async (data: any) => {
    try {
      return await request<Bill>('/billing', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { id: `b-${Date.now()}`, billNo: `INV/2026/${Date.now()}`, ...data };
    }
  },
  recordPayment: async (data: any) => {
    try {
      return await request<Payment>('/billing/payment', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { id: `pay-${Date.now()}`, ...data };
    }
  },
  getPayments: async () => {
    try {
      const res = await request<Payment[]>('/billing/payments/list');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
  getRetentions: async () => {
    try {
      const res = await request<Retention[]>('/billing/retentions/list');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
  updateRetention: async (id: string, data: any) => {
    try {
      return await request<Retention>(`/billing/retentions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch {
      return { id, ...data };
    }
  },

  // Reports
  getReport: async (reportType: string, params?: Record<string, string>) => {
    try {
      return await request<any>(`/reports/${reportType}`);
    } catch {
      return { data: [] };
    }
  },

  // Notifications
  getNotifications: async () => {
    try {
      const res = await request<AppNotification[]>('/notifications');
      return Array.isArray(res) ? res : mockNotifications;
    } catch {
      return mockNotifications;
    }
  },
  markNotificationRead: async (id: string) => {
    try {
      return await request<any>(`/notifications/${id}/read`, { method: 'PUT' });
    } catch {
      return { success: true };
    }
  },
  markAllNotificationsRead: async () => {
    try {
      return await request<any>('/notifications/read-all', { method: 'PUT' });
    } catch {
      return { success: true };
    }
  },

  // Users & Settings
  getUsers: async () => {
    try {
      const res = await request<User[]>('/users');
      return Array.isArray(res) ? res : [mockUser];
    } catch (e) {
      return [
        mockUser,
        { id: 'u-002', name: 'Karthik Raja', email: 'tender@tenderflow.com', role: 'Tender Manager', department: 'Tendering & Bidding', phone: '+91 98765 43211', status: 'Active', createdAt: new Date().toISOString() },
        { id: 'u-003', name: 'Priya Sundaram', email: 'pm@tenderflow.com', role: 'Project Manager', department: 'Operations & Execution', phone: '+91 98765 43212', status: 'Active', createdAt: new Date().toISOString() }
      ];
    }
  },
  createUser: async (data: any) => {
    try {
      return await request<User>('/users', { method: 'POST', body: JSON.stringify(data) });
    } catch (e) {
      return {
        id: `u-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department || 'Management',
        phone: data.phone || '',
        status: 'Active',
        accessibleModules: data.accessibleModules || [],
        createdAt: new Date().toISOString()
      };
    }
  },
  updateUser: async (id: string, data: any) => {
    try {
      return await request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch (e) {
      return {
        id,
        name: data.name || 'User',
        email: data.email || 'user@tenderflow.com',
        role: data.role || 'Super Admin',
        department: data.department || 'Management',
        phone: data.phone || '',
        status: data.status || 'Active',
        accessibleModules: data.accessibleModules || [],
        createdAt: new Date().toISOString()
      };
    }
  },
  getSettings: async () => {
    try {
      return await request<{ settings: any[]; deductionTypes: DeductionType[] }>('/settings');
    } catch (e) {
      return {
        settings: [
          { key: 'companyName', value: 'Elvina Infra Pvt Ltd' },
          { key: 'companyGstin', value: '33AAAAA0000A1Z5' },
          { key: 'whatsappAlertEnabled', value: 'true' },
          { key: 'whatsappSupervisorPhone', value: '+919876543210' }
        ],
        deductionTypes: [
          { id: 'dt-1', name: 'TDS (Income Tax)', percentage: 2.0, isMandatory: true, description: 'Statutory Section 194C TDS' },
          { id: 'dt-2', name: 'GST TDS', percentage: 2.0, isMandatory: true, description: 'Statutory GST TDS for Govt Works' },
          { id: 'dt-3', name: 'Labour Welfare Cess', percentage: 1.0, isMandatory: true, description: '1% Building Construction Welfare Cess' },
          { id: 'dt-4', name: 'Retention Guarantee', percentage: 5.0, isMandatory: true, description: 'Contract Security Deposit Retention' }
        ]
      };
    }
  },
  updateSettings: async (data: any) => {
    try {
      return await request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) });
    } catch {
      return { success: true };
    }
  },
  executeRawQuery: async (query: string) => {
    try {
      return await request<any>('/settings/query', { method: 'POST', body: JSON.stringify({ query }) });
    } catch {
      return [{ result: 'Demo database console. Connect local MySQL for live queries.' }];
    }
  },
  getAuditLogs: async () => {
    try {
      const res = await request<AuditLog[]>('/audit-logs');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  // Documents
  getDocuments: async () => {
    try {
      const res = await request<AppDocument[]>('/documents');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
  uploadDocument: async (data: any) => {
    try {
      return await request<AppDocument>('/documents', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { id: `doc-${Date.now()}`, ...data };
    }
  }
};
