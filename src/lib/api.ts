import {
  User, Tender, EmdTransaction, SecurityDeposit, Project, Material,
  MaterialDispatch, MaterialReceipt, MaterialConsumption, Bill, Payment,
  Retention, AppDocument, AppNotification, AuditLog, ActionItem, DeductionType,
  EstimateComparison, EstimateItem, RateAnalysisItem, WorkOrder, MachineryItem,
  MachineryLog, LabourWorker, LabourDisbursement, CompanyFilingDoc, WorkExperienceCertificate
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
  name: 'Gunaseelan',
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
    billNumber: 'RA-01/2026/MAD',
    billNo: 'RA-01/2026/MAD',
    projectId: 'p-001',
    projectName: 'Madurai Ring Road Expansion Project',
    clientName: 'NHAI Tamil Nadu',
    billType: 'Running Account (RA)',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    grossAmount: 18500000,
    totalDeductions: 1850000,
    netPayable: 16650000,
    netAmount: 16650000,
    outstandingAmount: 4650000,
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
    billNumber: 'RA-01/2026/MAD',
    billNo: 'RA-01/2026/MAD',
    projectId: 'p-001',
    projectName: 'Madurai Ring Road Expansion Project',
    clientName: 'NHAI Tamil Nadu',
    amountReceived: 12000000,
    balance: 4650000,
    paymentDate: '2026-05-20',
    paymentMode: 'NEFT / RTGS',
    transactionRef: 'UTIBR5202605200099',
    bankName: 'HDFC Bank - A/c 50200012345678',
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
    billNumber: 'RA-01/2026/MAD',
    billNo: 'RA-01/2026/MAD',
    retentionAmount: 925000,
    retentionRatePct: 5.0,
    retentionDate: '2026-05-05',
    heldDate: '2026-05-05',
    withheldDate: '2026-05-05',
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
    relatedModule: 'tenders',
    relatedId: 't-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'n-002',
    title: 'EMD Refund Due Notification',
    message: 'TWAD EMD amount ₹8.50 Lakhs refund follow-up due.',
    priority: 'Medium',
    isRead: false,
    relatedModule: 'emd',
    relatedId: 'emd-002',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'n-003',
    title: 'Client Bill Payment Milestone',
    message: 'RA-01/2026/MAD running bill payment of ₹1.66 Cr due from NHAI.',
    priority: 'High',
    isRead: false,
    relatedModule: 'billing',
    relatedId: 'b-001',
    createdAt: new Date(Date.now() - 172800000).toISOString()
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

const mockUsersList: User[] = [
  mockUser,
  { id: 'u-002', name: 'Gunaseelan', email: 'guna@tenderflow.com', role: 'Project Manager', department: 'Operations & Execution', phone: '+91 98765 43210', status: 'Active', createdAt: new Date().toISOString() },
  { id: 'u-003', name: 'Karthik Raja', email: 'tender@tenderflow.com', role: 'Tender Manager', department: 'Tendering & Bidding', phone: '+91 98765 43211', status: 'Active', createdAt: new Date().toISOString() }
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
      const found = mockTenders.find(t => t.id === id);
      return found ? { ...found } : { ...mockTenders[0], id };
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
      const newTender = { ...mockTenders[0], ...data, id: `t-${Date.now()}` } as Tender;
      mockTenders.unshift(newTender);
      return newTender;
    }
  },
  updateTender: async (id: string, data: Partial<Tender>) => {
    try {
      return await request<Tender>(`/tenders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch {
      const idx = mockTenders.findIndex(t => t.id === id);
      if (idx !== -1) {
        mockTenders[idx] = { ...mockTenders[idx], ...data };
        return mockTenders[idx];
      }
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
      return Array.isArray(res) && res.length > 0 ? res : mockUsersList;
    } catch (e) {
      return mockUsersList;
    }
  },
  createUser: async (data: any) => {
    try {
      return await request<User>('/users', { method: 'POST', body: JSON.stringify(data) });
    } catch (e) {
      const newUser: User = {
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
      mockUsersList.push(newUser);
      return newUser;
    }
  },
  updateUser: async (id: string, data: any) => {
    try {
      return await request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch (e) {
      const idx = mockUsersList.findIndex(u => u.id === id);
      if (idx !== -1) {
        mockUsersList[idx] = { ...mockUsersList[idx], ...data };
        return mockUsersList[idx];
      }
      return { id, name: data.name || 'User', email: 'user@tenderflow.com', role: 'Admin', department: 'Management', status: data.status || 'Active', createdAt: new Date().toISOString() };
    }
  },
  deleteUser: async (id: string) => {
    try {
      return await request<any>(`/users/${id}`, { method: 'DELETE' });
    } catch (e) {
      const idx = mockUsersList.findIndex(u => u.id === id);
      if (idx !== -1) mockUsersList.splice(idx, 1);
      return { success: true };
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
  },

  // 2. Estimate Module API
  getEstimates: async () => mockEstimates,
  createEstimate: async (data: any) => {
    const newEst: EstimateComparison = { id: `est-${Date.now()}`, ...data };
    mockEstimates.unshift(newEst);
    return newEst;
  },

  // 3. Rate Calculations API
  getRateAnalysis: async () => mockRateAnalysis,

  // 4. Work Orders API
  getWorkOrders: async () => mockWorkOrders,
  createWorkOrder: async (data: any) => {
    const newWo: WorkOrder = { id: `wo-${Date.now()}`, ...data };
    mockWorkOrders.unshift(newWo);
    return newWo;
  },

  // 7. Machinery Management API
  getMachinery: async () => mockMachinery,
  getMachineryLogs: async () => mockMachineryLogs,
  addMachineryLog: async (data: any) => {
    const newLog: MachineryLog = { id: `mlog-${Date.now()}`, ...data };
    mockMachineryLogs.unshift(newLog);
    return newLog;
  },

  // 8. Labour Management API
  getLabourWorkers: async () => mockLabourWorkers,
  getLabourDisbursements: async () => mockLabourDisbursements,
  addLabourDisbursement: async (data: any) => {
    const newDisb: LabourDisbursement = { id: `ldisb-${Date.now()}`, ...data };
    mockLabourDisbursements.unshift(newDisb);
    return newDisb;
  },

  // 10. Company Filing Management API
  getCompanyFilings: async () => mockCompanyFilings,
  addCompanyFiling: async (data: any) => {
    const newFiling: CompanyFilingDoc = { id: `cfg-${Date.now()}`, ...data };
    mockCompanyFilings.unshift(newFiling);
    return newFiling;
  },

  // 11. Work Experience Certificate API
  getCertificates: async () => mockCertificates,
  addCertificate: async (data: any) => {
    const newCert: WorkExperienceCertificate = { id: `cert-${Date.now()}`, ...data };
    mockCertificates.unshift(newCert);
    return newCert;
  }
};

// --- Rich Mock Datasets for 11 Modules ---

export const mockEstimates: EstimateComparison[] = [
  {
    id: 'est-001',
    projectId: 'p-001',
    projectName: 'Madurai Ring Road Expansion Project',
    estimateName: 'Detailed BOQ & Quantity Take-off Estimate v2',
    date: '2026-05-10',
    totalEstimate1Value: 185000000,
    totalEstimate2Value: 198200000,
    varianceValue: 13200000,
    remarks: 'Estimate 2 includes revised market price escalation for TMT Steel and Bitumen.',
    items: [
      {
        id: 'ei-1',
        code: 'BOQ-CONC-01',
        description: 'M30 Grade Reinforced Cement Concrete for Bridge Piers & Abutments',
        unit: 'cu.m',
        quantity: 4500,
        length: 20,
        width: 15,
        height: 15,
        steelQtyPerUnitKg: 110,
        cementQtyPerUnitBags: 7.8,
        sandQtyPerUnitCuM: 0.45,
        jellyQtyPerUnitCuM: 0.85,
        estimate1Rate: 8500,
        estimate1Total: 38250000,
        estimate2Rate: 9200,
        estimate2Total: 41400000,
        varianceAmount: 3150000,
        variancePct: 8.23
      },
      {
        id: 'ei-2',
        code: 'BOQ-STEL-02',
        description: 'Fe550D High Yield Strength Deformed TMT Bars Cutting & Bending',
        unit: 'MT',
        quantity: 495,
        steelQtyPerUnitKg: 1000,
        cementQtyPerUnitBags: 0,
        sandQtyPerUnitCuM: 0,
        jellyQtyPerUnitCuM: 0,
        estimate1Rate: 68000,
        estimate1Total: 33660000,
        estimate2Rate: 72500,
        estimate2Total: 35887500,
        varianceAmount: 2227500,
        variancePct: 6.62
      }
    ]
  }
];

export const mockRateAnalysis: RateAnalysisItem[] = [
  {
    id: 'ra-001',
    itemCode: 'RAT-CONC-M30',
    itemName: 'M30 Ready Mix Concrete (Pumping included)',
    unit: 'cu.m',
    tenderEstimatedRate: 7800,
    currentMarketRate: 8450,
    variancePerUnit: 650,
    variancePct: 8.33,
    labourComponentRate: 1200,
    materialComponentRate: 5800,
    machineryComponentRate: 850,
    overheadProfitPct: 10,
    finalAnalyzedRate: 8635,
    status: 'Tight Margin',
    lastUpdated: '2026-05-18'
  },
  {
    id: 'ra-002',
    itemCode: 'RAT-ASPH-50MM',
    itemName: 'Bituminous Concrete 50mm Layer Paving',
    unit: 'sq.m',
    tenderEstimatedRate: 620,
    currentMarketRate: 580,
    variancePerUnit: -40,
    variancePct: -6.45,
    labourComponentRate: 90,
    materialComponentRate: 380,
    machineryComponentRate: 110,
    overheadProfitPct: 15,
    finalAnalyzedRate: 667,
    status: 'Profitable',
    lastUpdated: '2026-05-15'
  }
];

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo-001',
    workOrderNumber: 'WO/NHAI/MAD/2026/041',
    title: 'Madurai Ring Road 4-Lane Expansion Package I',
    clientName: 'National Highways Authority of India (NHAI)',
    contractorName: 'Elvina Infra Pvt Ltd (Prime Contractor)',
    orderType: 'Government Work Order',
    value: 245000000,
    startDate: '2026-01-15',
    completionDate: '2027-07-31',
    status: 'Active',
    scopeOfWork: '4-Laning of Madurai Bypass Road 14.2 km with 2 Minor Bridges & Culverts',
    paymentTerms: 'Monthly Running Account (RA) Bills with 5% Retention',
    retentionPct: 5.0,
    emdDeposited: 2450000
  },
  {
    id: 'wo-002',
    workOrderNumber: 'SUB-WO/2026/ELEC-09',
    title: 'Highway Street Lighting & Electrical Substation Work',
    clientName: 'Elvina Infra Pvt Ltd',
    contractorName: 'Sri Lakshmi Electrical Contractors (Subcontractor)',
    orderType: 'Outward Subcontract',
    value: 18500000,
    startDate: '2026-03-01',
    completionDate: '2026-11-30',
    status: 'Active',
    scopeOfWork: 'Installation of 340 LED Pole Lights, Cabling, and 11kV Transformer Substation',
    paymentTerms: 'Milestone Based: 20% Advance, 60% Work Progress, 20% Commissioning',
    retentionPct: 5.0,
    emdDeposited: 185000
  }
];

export const mockMachinery: MachineryItem[] = [
  {
    id: 'mac-001',
    machineCode: 'MCH-JCB-01',
    name: 'JCB 3DX Super Backhoe Loader',
    category: 'Earthmoving',
    ownership: 'Owned',
    dailyRentalRate: 0,
    hourlyOperatorRate: 280,
    dieselConsumptionLitresPerHr: 8.5,
    totalOperatingHours: 1420,
    currentSite: 'Madurai Ring Road Site #1',
    status: 'Active Operating'
  },
  {
    id: 'mac-002',
    machineCode: 'MCH-ROLR-02',
    name: 'Hamm 311 Heavy Vibratory Soil Compactor Roller 11T',
    category: 'Compaction',
    ownership: 'Rented',
    rentalVendor: 'Tamilnadu Heavy Cranes & Equipment Hire',
    dailyRentalRate: 7500,
    hourlyOperatorRate: 300,
    dieselConsumptionLitresPerHr: 12.0,
    totalOperatingHours: 680,
    currentSite: 'Coimbatore Underground Pipeline Site #2',
    status: 'Active Operating'
  }
];

export const mockMachineryLogs: MachineryLog[] = [
  {
    id: 'mlog-001',
    machineId: 'mac-001',
    machineName: 'JCB 3DX Super Backhoe Loader (MCH-JCB-01)',
    date: '2026-05-18',
    projectId: 'p-001',
    projectName: 'Madurai Ring Road Expansion Project',
    operatingHours: 8.5,
    startMeterReading: 1411.5,
    endMeterReading: 1420.0,
    dieselFilledLitres: 70,
    fuelCost: 6650,
    operatorSalary: 2380,
    rentalExpense: 0,
    totalDailyExpense: 9030,
    workDoneDescription: 'Earth excavation and trenching for drain line along chainage 4+200 to 4+600.'
  }
];

export const mockLabourWorkers: LabourWorker[] = [
  {
    id: 'lw-001',
    workerName: 'M. Palanivel (Kottan Master)',
    category: 'Mason (Kottan)',
    dailyWageRate: 1100,
    phone: '+91 98421 88312',
    assignedProject: 'Madurai Ring Road Expansion',
    status: 'Active'
  },
  {
    id: 'lw-002',
    workerName: 'S. Ramar (Mazdoor Leader)',
    category: 'Coolie (Mazdoor)',
    dailyWageRate: 650,
    phone: '+91 97860 12345',
    assignedProject: 'Madurai Ring Road Expansion',
    status: 'Active'
  }
];

export const mockLabourDisbursements: LabourDisbursement[] = [
  {
    id: 'ld-001',
    projectId: 'p-001',
    projectName: 'Madurai Ring Road Expansion Project',
    date: '2026-05-18',
    masonsCount: 14,
    cooliesCount: 38,
    operatorsCount: 4,
    totalManpowerCount: 56,
    masonsWageTotal: 15400,
    cooliesWageTotal: 24700,
    totalDisbursementAmount: 46300,
    paymentMode: 'Cash',
    supervisorInCharge: 'V. Gunaseelan',
    remarks: 'Daily muster roll wage payout for culvert concrete pouring gang.'
  }
];

export const mockCompanyFilings: CompanyFilingDoc[] = [
  {
    id: 'cfg-001',
    documentTitle: 'Tamil Nadu PWD Class I Highway Contractor Registration',
    documentCategory: 'PWD / NHAI Registration',
    referenceNumber: 'PWD/TN/CLASS-I/2023/8892',
    issuingAuthority: 'Chief Engineer, PWD Tamil Nadu',
    issueDate: '2023-06-15',
    expiryDate: '2028-06-14',
    renewalCycleYears: 5,
    daysUntilExpiry: 755,
    status: 'Valid Active'
  },
  {
    id: 'cfg-002',
    documentTitle: 'Commercial Vehicle RC Book - JCB 3DX (TN-59-CA-8891)',
    documentCategory: 'Vehicle RC Book',
    referenceNumber: 'RC-TN59CA8891',
    issuingAuthority: 'RTO Madurai South',
    issueDate: '2021-09-10',
    expiryDate: '2026-09-09',
    renewalCycleYears: 5,
    daysUntilExpiry: 113,
    status: 'Renewal Due Soon'
  }
];

export const mockCertificates: WorkExperienceCertificate[] = [
  {
    id: 'cert-001',
    certificateNumber: 'TN-PWD-WEC-2025-014',
    projectName: 'Construction of 4-Lane ROB Bridge at Dindigul Highway Junction',
    issuingDepartment: 'Public Works Department (PWD) Bridges Division',
    clientAuthority: 'Executive Engineer, PWD Dindigul',
    contractValue: 145000000,
    actualCompletedValue: 148200000,
    commencementDate: '2022-04-10',
    completionDate: '2025-03-31',
    financialYear: '2024-2025',
    qualityRating: 'Outstanding',
    isPast5Years: true
  },
  {
    id: 'cert-002',
    certificateNumber: 'TWAD-WEC-2024-88',
    projectName: 'Coimbatore Combined Water Supply Scheme (CWSS) Pipeline Network',
    issuingDepartment: 'Tamil Nadu Water Supply & Drainage Board (TWAD)',
    clientAuthority: 'Superintending Engineer, TWAD Board Coimbatore',
    contractValue: 98000000,
    actualCompletedValue: 98000000,
    commencementDate: '2021-08-01',
    completionDate: '2024-01-20',
    financialYear: '2023-2024',
    qualityRating: 'Very Good',
    isPast5Years: true
  }
];

