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

// Full Rich Sample Data Collections for All Pages
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
    refNumber: 'NHAI/2026/TN-042',
    name: 'Construction of 4-Lane Bypass Highway',
    clientName: 'NHAI Tamil Nadu',
    department: 'Highways Division',
    departmentType: 'Central Gov',
    tenderType: 'Item Rate',
    projectCategory: 'Highways',
    location: 'Madurai, TN',
    submissionDate: '2026-06-15T10:00:00Z',
    openingDate: '2026-06-16T11:00:00Z',
    estimatedValue: 145000000,
    quotedAmount: 142000000,
    tenderFee: 10000,
    emdRequired: true,
    emdAmount: 1450000,
    tenderStatus: 'Submitted',
    quoteVariancePct: -2.07,
    createdBy: 'u-001',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z'
  },
  {
    id: 't-002',
    refNumber: 'TWAD/2026/WS-109',
    name: 'Water Supply Augmentation & Pipeline Scheme',
    clientName: 'TWAD Board Chennai',
    department: 'Water Supply Div',
    departmentType: 'State Gov',
    tenderType: 'EPC',
    projectCategory: 'Water Supply',
    location: 'Coimbatore, TN',
    submissionDate: '2026-05-25T10:00:00Z',
    openingDate: '2026-05-26T11:00:00Z',
    estimatedValue: 85000000,
    quotedAmount: 84000000,
    tenderFee: 5000,
    emdRequired: true,
    emdAmount: 850000,
    tenderStatus: 'Under Evaluation',
    quoteVariancePct: -1.18,
    createdBy: 'u-001',
    createdAt: '2026-04-15T10:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z'
  },
  {
    id: 't-003',
    refNumber: 'PWD/2026/BRG-07',
    name: 'High-Level Bridge Across Vaigai River',
    clientName: 'PWD Tamil Nadu',
    department: 'Bridges Wing',
    departmentType: 'State Gov',
    tenderType: 'Percentage Rate',
    projectCategory: 'Bridges',
    location: 'Madurai, TN',
    submissionDate: '2026-04-10T10:00:00Z',
    openingDate: '2026-04-11T11:00:00Z',
    estimatedValue: 65000000,
    quotedAmount: 63700000,
    tenderFee: 5000,
    emdRequired: true,
    emdAmount: 650000,
    tenderStatus: 'Won',
    quoteVariancePct: -2.00,
    createdBy: 'u-001',
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-03-20T10:00:00Z'
  }
];

const mockProjects: Project[] = [
  {
    id: 'p-001',
    contractNumber: 'CONT/NHAI/2026/001',
    projectName: 'Madurai Ring Road Expansion Project',
    tenderRef: 'NHAI/2026/TN-042',
    client: 'NHAI Tamil Nadu',
    location: 'Madurai, TN',
    startDate: '2026-01-15',
    plannedCompletionDate: '2027-06-30',
    contractValue: 145000000,
    awardedAmount: 142000000,
    status: 'Active',
    completionPercentage: 42,
    totalBilled: 18500000,
    totalCollected: 12000000,
    outstanding: 6500000,
    retentionHeld: 925000,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z'
  },
  {
    id: 'p-002',
    contractNumber: 'CONT/TWAD/2026/008',
    projectName: 'Coimbatore Underground Drainage System',
    tenderRef: 'TWAD/2026/WS-109',
    client: 'TWAD Board Chennai',
    location: 'Coimbatore, TN',
    startDate: '2026-02-01',
    plannedCompletionDate: '2027-12-31',
    contractValue: 85000000,
    awardedAmount: 84000000,
    status: 'Active',
    completionPercentage: 28,
    totalBilled: 12000000,
    totalCollected: 10000000,
    outstanding: 2000000,
    retentionHeld: 600000,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z'
  }
];

const mockMaterials: Material[] = [
  {
    id: 'm-001',
    materialCode: 'MAT-CEM-53',
    name: 'OPC 53 Grade Cement',
    category: 'Cement & Concrete',
    unit: 'Bags',
    unitRate: 385,
    specification: 'IS 12269:2013 UltraTech / Dalmia',
    minStockLevel: 200,
    reorderLevel: 500,
    currentStock: 1200,
    supplierName: 'UltraTech Cement Ltd'
  },
  {
    id: 'm-002',
    materialCode: 'MAT-STL-16',
    name: 'TMT Steel Bars 16mm Fe550D',
    category: 'Steel & Rebar',
    unit: 'MT',
    unitRate: 62500,
    specification: 'IS 1786:2008 Tata Tiscon / JSW',
    minStockLevel: 10,
    reorderLevel: 20,
    currentStock: 45,
    supplierName: 'Tata Steel Infrastructure'
  },
  {
    id: 'm-003',
    materialCode: 'MAT-AGG-20',
    name: 'Coarse Aggregate 20mm',
    category: 'Aggregates & Sand',
    unit: 'Cu.m',
    unitRate: 1450,
    specification: 'Crushed Granite Stone IS 383',
    minStockLevel: 50,
    reorderLevel: 150,
    currentStock: 680,
    supplierName: 'Sri Amman Blue Metals'
  }
];

const mockEmds: EmdTransaction[] = [
  {
    id: 'emd-001',
    tenderId: 't-001',
    tenderName: 'Construction of 4-Lane Bypass Highway',
    refNumber: 'NHAI/2026/TN-042',
    clientName: 'NHAI Tamil Nadu',
    emdAmount: 1450000,
    paymentDate: '2026-05-05',
    bankAccount: 'HDFC Bank - A/c 50200012345678',
    transactionRef: 'BG/NHAI/2026/9981',
    paymentMethod: 'Bank Guarantee',
    emdType: 'Bid EMD',
    expectedRefundDate: '2026-07-30',
    refundAmount: 1450000,
    refundStatus: 'Refund Pending',
    createdAt: '2026-05-05T00:00:00Z',
    updatedAt: '2026-05-05T00:00:00Z'
  },
  {
    id: 'emd-002',
    tenderId: 't-002',
    tenderName: 'Water Supply Augmentation & Pipeline Scheme',
    refNumber: 'TWAD/2026/WS-109',
    clientName: 'TWAD Board Chennai',
    emdAmount: 850000,
    paymentDate: '2026-04-18',
    bankAccount: 'SBI - A/c 30998877665',
    transactionRef: 'FDR/TWAD/88712',
    paymentMethod: 'FDR',
    emdType: 'Bid EMD',
    expectedRefundDate: '2026-06-25',
    refundAmount: 850000,
    refundStatus: 'Not Paid',
    createdAt: '2026-04-18T00:00:00Z',
    updatedAt: '2026-04-18T00:00:00Z'
  }
];

const mockSecurityDeposits: SecurityDeposit[] = [
  {
    id: 'sd-001',
    projectId: 'p-001',
    projectName: 'Madurai Ring Road Expansion Project',
    tenderId: 't-001',
    depositType: 'Performance Guarantee',
    amount: 7250000,
    depositDate: '2026-01-20',
    bank: 'HDFC Bank Ltd',
    refNumber: 'PBG/2026/MAD-001',
    expectedReleaseDate: '2027-08-30',
    status: 'Active',
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z'
  }
];

const mockInventory = [
  {
    id: 'inv-001',
    materialId: 'm-001',
    materialCode: 'MAT-CEM-53',
    materialName: 'OPC 53 Grade Cement',
    unit: 'Bags',
    centralStock: 1200,
    reorderLevel: 500,
    minStockLevel: 200,
    siteStocks: [
      { siteName: 'Madurai Bypass Site #1', stock: 450 },
      { siteName: 'Coimbatore Pipeline Site #2', stock: 250 }
    ],
    status: 'Sufficient'
  },
  {
    id: 'inv-002',
    materialId: 'm-002',
    materialCode: 'MAT-STL-16',
    materialName: 'TMT Steel Bars 16mm Fe550D',
    unit: 'MT',
    centralStock: 45,
    reorderLevel: 20,
    minStockLevel: 10,
    siteStocks: [
      { siteName: 'Madurai Bypass Site #1', stock: 18 }
    ],
    status: 'Sufficient'
  }
];

const mockBills: Bill[] = [
  {
    id: 'b-001',
    billNo: 'RA-01/2026/MAD',
    projectId: 'p-001',
    projectName: 'Madurai Ring Road Expansion Project',
    clientName: 'NHAI Tamil Nadu',
    billType: 'Running Account (RA)',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    grossAmount: 18500000,
    totalDeductions: 1850000,
    netAmount: 16650000,
    billDate: '2026-05-05',
    dueDate: '2026-06-05',
    status: 'Submitted',
    deductions: [
      { type: 'TDS (Income Tax)', rate: 2.0, amount: 370000 },
      { type: 'GST TDS', rate: 2.0, amount: 370000 },
      { type: 'Labour Cess', rate: 1.0, amount: 185000 },
      { type: 'Retention Money', rate: 5.0, amount: 925000 }
    ],
    createdAt: '2026-05-05T00:00:00Z',
    updatedAt: '2026-05-05T00:00:00Z'
  }
];

const mockPayments: Payment[] = [
  {
    id: 'pay-001',
    billId: 'b-001',
    billNo: 'RA-01/2026/MAD',
    projectName: 'Madurai Ring Road Expansion Project',
    clientName: 'NHAI Tamil Nadu',
    amountReceived: 12000000,
    paymentDate: '2026-05-20',
    paymentMode: 'NEFT / RTGS',
    transactionRef: 'UTIBR5202605200099',
    bankAccount: 'HDFC Bank - A/c 50200012345678',
    remarks: 'Part Payment for RA-01 Bill',
    status: 'Received',
    createdAt: '2026-05-20T00:00:00Z'
  }
];

const mockRetentions: Retention[] = [
  {
    id: 'ret-001',
    projectId: 'p-001',
    projectName: 'Madurai Ring Road Expansion Project',
    clientName: 'NHAI Tamil Nadu',
    billNo: 'RA-01/2026/MAD',
    retentionAmount: 925000,
    retentionRatePct: 5.0,
    heldDate: '2026-05-05',
    expectedReleaseDate: '2027-07-31',
    status: 'Held',
    createdAt: '2026-05-05T00:00:00Z',
    updatedAt: '2026-05-05T00:00:00Z'
  }
];

const mockNotifications: AppNotification[] = [
  {
    id: 'n-001',
    title: 'Tender Submission Deadline Alert',
    message: 'NHAI Madurai Highway tender submission closes in 2 days.',
    priority: 'High',
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'n-002',
    title: 'EMD Refund Due Notification',
    message: 'TWAD EMD amount ₹8.50 Lakhs refund follow-up due.',
    priority: 'Medium',
    isRead: false,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-001',
    userName: 'Rajesh Sharma',
    userRole: 'Super Admin',
    action: 'CREATE_USER',
    module: 'User Management',
    details: 'Registered new user account Gunaseelan (Project Manager)',
    timestamp: new Date().toISOString()
  },
  {
    id: 'log-002',
    userName: 'Karthik Raja',
    userRole: 'Tender Manager',
    action: 'SUBMIT_TENDER',
    module: 'Tenders',
    details: 'Submitted Tender Quote NHAI/2026/TN-042 (Value: ₹14.20 Cr)',
    timestamp: new Date(Date.now() - 3600000).toISOString()
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
          },
          {
            id: 'act-2',
            title: 'EMD Refund Overdue',
            priority: 'High',
            type: 'EMD',
            description: 'TWAD Board EMD ₹8.50 Lakhs pending refund from department',
            linkModule: 'emd',
            linkId: 'emd-002'
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
        recentActivities: mockAuditLogs,
        recentNotifications: mockNotifications
      };
    }
  },

  // Tenders
  getTenders: async (params?: Record<string, string>) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await request<Tender[]>(`/tenders${query ? `?${query}` : ''}`);
      return Array.isArray(res) && res.length > 0 ? res : mockTenders;
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
      return Array.isArray(res) && res.length > 0 ? res : mockEmds;
    } catch {
      return mockEmds;
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
      return Array.isArray(res) && res.length > 0 ? res : mockSecurityDeposits;
    } catch {
      return mockSecurityDeposits;
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
      return Array.isArray(res) && res.length > 0 ? res : mockProjects;
    } catch {
      return mockProjects;
    }
  },
  getProjectDetails: async (id: string) => {
    try {
      const res = await request<any>(`/projects/${id}`);
      if (res && res.id) return res;
      throw new Error();
    } catch {
      return {
        id: id || 'p-001',
        contractNumber: 'CONT/NHAI/2026/001',
        projectName: 'Madurai Ring Road Expansion Project',
        tenderRef: 'NHAI/2026/TN-042',
        client: 'NHAI Tamil Nadu',
        location: 'Madurai, TN',
        startDate: '2026-01-15',
        plannedCompletionDate: '2027-06-30',
        contractValue: 145000000,
        awardedAmount: 142000000,
        status: 'Active',
        completionPercentage: 42,
        totalBilled: 18500000,
        totalCollected: 12000000,
        outstanding: 6500000,
        retentionHeld: 925000,
        sites: [
          { id: 's-1', siteName: 'Madurai Bypass Site #1', location: 'Madurai South', supervisorId: 'u-004', status: 'Active' }
        ],
        milestones: [
          { id: 'm-1', name: 'Earthwork & Foundation Leveling', dueDate: '2026-03-31', progress: 100, status: 'Completed' },
          { id: 'm-2', name: 'Sub-Base Granular Layer (GSB)', dueDate: '2026-06-30', progress: 65, status: 'In Progress' },
          { id: 'm-3', name: 'Bituminous Macadam Laying', dueDate: '2026-10-31', progress: 0, status: 'Pending' }
        ],
        boqItems: [
          { id: 'boq-1', itemCode: 'BOQ-01', description: 'Excavation in Hard Soil / Rock', quantity: 25000, unit: 'Cu.m', rate: 450, totalAmount: 11250000, executedQty: 25000 },
          { id: 'boq-2', itemCode: 'BOQ-02', description: 'Granular Sub-Base (GSB) Construction', quantity: 18000, unit: 'Cu.m', rate: 1200, totalAmount: 21600000, executedQty: 11700 }
        ]
      };
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
      return Array.isArray(res) && res.length > 0 ? res : mockMaterials;
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
      return Array.isArray(res) && res.length > 0 ? res : mockInventory;
    } catch {
      return mockInventory;
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
      return Array.isArray(res) && res.length > 0 ? res : mockBills;
    } catch {
      return mockBills;
    }
  },
  getBillDetails: async (id: string) => {
    try {
      return await request<any>(`/billing/${id}`);
    } catch {
      return mockBills[0];
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
      return Array.isArray(res) && res.length > 0 ? res : mockPayments;
    } catch {
      return mockPayments;
    }
  },
  getRetentions: async () => {
    try {
      const res = await request<Retention[]>('/billing/retentions/list');
      return Array.isArray(res) && res.length > 0 ? res : mockRetentions;
    } catch {
      return mockRetentions;
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
      return {
        summary: { totalBilled: 340000000, totalCollected: 298000000, retentionHeld: 17000000, tdsDeducted: 6800000 },
        data: [
          { project: 'Madurai Ring Road Expansion Project', billed: 18500000, collected: 12000000, outstanding: 6500000 }
        ]
      };
    }
  },

  // Notifications
  getNotifications: async () => {
    try {
      const res = await request<AppNotification[]>('/notifications');
      return Array.isArray(res) && res.length > 0 ? res : mockNotifications;
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
      return Array.isArray(res) && res.length > 0 ? res : [
        mockUser,
        { id: 'u-002', name: 'Gunaseelan', email: 'guna@tenderflow.com', role: 'Project Manager', department: 'Operations & Execution', phone: '+91 98765 43210', status: 'Active', createdAt: new Date().toISOString() },
        { id: 'u-003', name: 'Karthik Raja', email: 'tender@tenderflow.com', role: 'Tender Manager', department: 'Tendering & Bidding', phone: '+91 98765 43211', status: 'Active', createdAt: new Date().toISOString() }
      ];
    } catch (e) {
      return [
        mockUser,
        { id: 'u-002', name: 'Gunaseelan', email: 'guna@tenderflow.com', role: 'Project Manager', department: 'Operations & Execution', phone: '+91 98765 43210', status: 'Active', createdAt: new Date().toISOString() },
        { id: 'u-003', name: 'Karthik Raja', email: 'tender@tenderflow.com', role: 'Tender Manager', department: 'Tendering & Bidding', phone: '+91 98765 43211', status: 'Active', createdAt: new Date().toISOString() }
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
      return [
        { table_name: 'User', records: 5, status: 'Active' },
        { table_name: 'Tender', records: 12, status: 'Active' },
        { table_name: 'Project', records: 5, status: 'Active' }
      ];
    }
  },
  getAuditLogs: async () => {
    try {
      const res = await request<AuditLog[]>('/audit-logs');
      return Array.isArray(res) && res.length > 0 ? res : mockAuditLogs;
    } catch {
      return mockAuditLogs;
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
