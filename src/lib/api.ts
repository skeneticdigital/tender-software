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
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'An error occurred while processing your request.');
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  getMe: () => request<User>('/auth/me'),

  // Dashboard
  getDashboard: () => request<{
    kpis: any;
    charts: any;
    actionItems: ActionItem[];
    recentActivities: AuditLog[];
    recentNotifications: AppNotification[];
  }>('/dashboard'),

  // Tenders
  getTenders: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<Tender[]>(`/tenders${query ? `?${query}` : ''}`);
  },
  getTenderDetails: (id: string) => request<Tender & { emd?: EmdTransaction; documents?: AppDocument[]; project?: Project }>(`/tenders/${id}`),
  getTenderAnalytics: () => request<any>('/tenders/analytics'),
  createTender: (data: Partial<Tender>) => request<Tender>('/tenders', { method: 'POST', body: JSON.stringify(data) }),
  updateTender: (id: string, data: Partial<Tender>) => request<Tender>(`/tenders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  convertToProject: (id: string, data: any) => request<Project>(`/tenders/${id}/convert-project`, { method: 'POST', body: JSON.stringify(data) }),

  // EMD & Security Deposits
  getEmds: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<EmdTransaction[]>(`/emd${query ? `?${query}` : ''}`);
  },
  createEmd: (data: any) => request<EmdTransaction>('/emd', { method: 'POST', body: JSON.stringify(data) }),
  updateEmd: (id: string, data: any) => request<EmdTransaction>(`/emd/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getSecurityDeposits: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<SecurityDeposit[]>(`/emd/security-deposits${query ? `?${query}` : ''}`);
  },
  createSecurityDeposit: (data: any) => request<SecurityDeposit>('/emd/security-deposits', { method: 'POST', body: JSON.stringify(data) }),
  updateSecurityDeposit: (id: string, data: any) => request<SecurityDeposit>(`/emd/security-deposits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Projects
  getProjects: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<Project[]>(`/projects${query ? `?${query}` : ''}`);
  },
  getProjectDetails: (id: string) => request<any>(`/projects/${id}`),
  createProject: (data: Partial<Project>) => request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<Project>) => request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Materials & Inventory
  getMaterials: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<Material[]>(`/materials${query ? `?${query}` : ''}`);
  },
  createMaterial: (data: Partial<Material>) => request<Material>('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id: string, data: Partial<Material>) => request<Material>(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getInventory: () => request<any[]>('/materials/inventory'),
  dispatchMaterial: (data: any) => request<MaterialDispatch>('/materials/dispatch', { method: 'POST', body: JSON.stringify(data) }),
  receiveMaterial: (data: any) => request<MaterialReceipt>('/materials/receive', { method: 'POST', body: JSON.stringify(data) }),
  consumeMaterial: (data: any) => request<MaterialConsumption>('/materials/consume', { method: 'POST', body: JSON.stringify(data) }),

  // Billing & Financials
  getBills: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<Bill[]>(`/billing${query ? `?${query}` : ''}`);
  },
  getBillDetails: (id: string) => request<any>(`/billing/${id}`),
  createBill: (data: any) => request<Bill>('/billing', { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: (data: any) => request<Payment>('/billing/payment', { method: 'POST', body: JSON.stringify(data) }),
  getPayments: () => request<Payment[]>('/billing/payments/list'),
  getRetentions: () => request<Retention[]>('/billing/retentions/list'),
  updateRetention: (id: string, data: any) => request<Retention>(`/billing/retentions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Reports
  getReport: (reportType: string, params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/reports/${reportType}${query ? `?${query}` : ''}`);
  },

  // Notifications
  getNotifications: () => request<AppNotification[]>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),

  // Users & Settings
  getUsers: async () => {
    try {
      return await request<User[]>('/users');
    } catch (e) {
      return [
        { id: 'u-001', name: 'Rajesh Sharma', email: 'admin@tenderflow.com', role: 'Super Admin', department: 'Management', phone: '+91 98765 43210', status: 'Active', createdAt: new Date().toISOString() },
        { id: 'u-002', name: 'Karthik Raja', email: 'tender@tenderflow.com', role: 'Tender Manager', department: 'Tendering & Bidding', phone: '+91 98765 43211', status: 'Active', createdAt: new Date().toISOString() },
        { id: 'u-003', name: 'Priya Sundaram', email: 'pm@tenderflow.com', role: 'Project Manager', department: 'Operations & Execution', phone: '+91 98765 43212', status: 'Active', createdAt: new Date().toISOString() },
        { id: 'u-004', name: 'Manoj Kumar', email: 'supervisor@tenderflow.com', role: 'Site Supervisor', department: 'Field Supervision', phone: '+91 98765 43213', status: 'Active', createdAt: new Date().toISOString() },
        { id: 'u-005', name: 'Anitha Ramesh', email: 'accounts@tenderflow.com', role: 'Accounts Manager', department: 'Finance & Billing', phone: '+91 98765 43214', status: 'Active', createdAt: new Date().toISOString() }
      ];
    }
  },
  createUser: (data: any) => request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  updateSettings: (data: any) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  executeRawQuery: (query: string) => request<any>('/settings/query', { method: 'POST', body: JSON.stringify({ query }) }),
  getAuditLogs: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<AuditLog[]>(`/audit-logs${query ? `?${query}` : ''}`);
  },

  // Documents
  getDocuments: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<AppDocument[]>(`/documents${query ? `?${query}` : ''}`);
  },
  uploadDocument: (data: any) => request<AppDocument>('/documents', { method: 'POST', body: JSON.stringify(data) })
};
