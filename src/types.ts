export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Tender Manager'
  | 'Project Manager'
  | 'Site Supervisor'
  | 'Accounts Manager'
  | 'Management / Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone: string;
  status: 'Active' | 'Inactive';
  accessibleModules?: string[];
  avatar?: string;
  createdAt: string;
}

export interface Tender {
  id: string;
  refNumber: string;
  name: string;
  clientName: string;
  department: string;
  departmentType: 'Central Gov' | 'State Gov' | 'PSU' | 'Private';
  tenderType: 'Item Rate' | 'Percentage Rate' | 'EPC' | 'Turnkey';
  projectCategory: 'Highways' | 'Building' | 'Water Supply' | 'Bridges' | 'Electrical' | 'Urban Infra';
  location: string;
  submissionDate: string;
  openingDate: string;
  estimatedValue: number;
  quotedAmount: number;
  tenderFee: number;
  emdRequired: boolean;
  emdAmount: number;
  emdPaymentDate?: string;
  emdBankAccount?: string;
  tenderStatus: 'Draft' | 'Preparing' | 'Submitted' | 'Under Evaluation' | 'Won' | 'Lost' | 'Cancelled' | 'Withdrawn';
  resultDate?: string;
  awardedAmount?: number;
  competitorInfo?: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  quoteDiff?: number;
  quoteVariancePct?: number;
  awardDiff?: number;
}

export interface EmdTransaction {
  id: string;
  tenderId: string;
  tenderName: string;
  refNumber: string;
  clientName: string;
  emdAmount: number;
  paymentDate: string;
  bankAccount: string;
  transactionRef: string;
  paymentMethod: 'Bank Guarantee' | 'FDR' | 'E-Payment' | 'Demand Draft';
  emdType: string;
  expectedRefundDate: string;
  actualRefundDate?: string;
  refundAmount: number;
  refundStatus: 'Not Paid' | 'Paid' | 'Refund Pending' | 'Partially Refunded' | 'Refunded' | 'Retained' | 'Converted to Security Deposit';
  convertedTo?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityDeposit {
  id: string;
  projectId: string;
  projectName: string;
  tenderId?: string;
  depositType: 'Performance Guarantee' | 'Security Deposit' | 'Additional Deposit';
  amount: number;
  depositDate: string;
  bank: string;
  refNumber: string;
  expectedReleaseDate: string;
  actualReleaseDate?: string;
  status: 'Active' | 'Due Soon' | 'Released' | 'Overdue';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  tenderId?: string;
  projectName: string;
  tenderRef: string;
  client: string;
  contractNumber: string;
  location: string;
  startDate: string;
  plannedCompletionDate: string;
  actualCompletionDate?: string;
  contractValue: number;
  awardedAmount: number;
  projectManagerId?: string;
  siteSupervisorId?: string;
  status: 'Not Started' | 'Active' | 'On Hold' | 'Near Completion' | 'Completed' | 'Closed';
  completionPercentage: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  totalBilled?: number;
  totalCollected?: number;
  outstanding?: number;
  retentionHeld?: number;
}

export interface ProjectSite {
  id: string;
  projectId: string;
  siteName: string;
  location: string;
  supervisorId?: string;
  status: string;
}

export interface Material {
  id: string;
  materialCode: string;
  name: string;
  category: string;
  unit: string;
  specification: string;
  minStockLevel: number;
  reorderLevel: number;
  currentStock: number;
  supplierName: string;
  unitRate: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialDispatch {
  id: string;
  dispatchCode: string;
  projectId: string;
  projectName?: string;
  siteId?: string;
  siteName?: string;
  materialId: string;
  materialName?: string;
  batchNumber: string;
  dispatchDate: string;
  quantity: number;
  unit: string;
  vehicleNumber: string;
  driverName: string;
  issuedById: string;
  issuedByName?: string;
  receivedById?: string;
  status: 'In Transit' | 'Received' | 'Partially Received' | 'Cancelled';
  remarks?: string;
  createdAt: string;
}

export interface MaterialReceipt {
  id: string;
  receiptCode: string;
  dispatchId: string;
  projectId: string;
  materialId: string;
  receivedQuantity: number;
  damagedQuantity: number;
  acceptedQuantity: number;
  receivedDate: string;
  receivedById: string;
  receivedByName?: string;
  remarks?: string;
  createdAt: string;
}

export interface MaterialConsumption {
  id: string;
  projectId: string;
  projectName?: string;
  siteId?: string;
  siteName?: string;
  materialId: string;
  materialName?: string;
  consumptionDate: string;
  quantityConsumed: number;
  unit: string;
  workCategory: string;
  supervisorId: string;
  supervisorName?: string;
  remarks?: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  projectId?: string;
  materialId: string;
  materialName: string;
  currentStock: number;
  reorderLevel: number;
  suggestedReorderQty: number;
  alertDate: string;
  status: 'Active' | 'Resolved' | 'Dismissed';
}

export interface BillItem {
  id?: string;
  billId?: string;
  description: string;
  boqItem: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface BillDeduction {
  id?: string;
  billId?: string;
  deductionTypeId?: string;
  deductionName: string;
  percentage: number;
  fixedAmount: number;
  calculatedAmount: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  projectId: string;
  projectName?: string;
  clientName: string;
  billDate: string;
  billingPeriod: string;
  workDescription: string;
  grossAmount: number;
  gstAmount: number;
  grossWithTax: number;
  totalDeductions: number;
  retentionAmount: number;
  netPayable: number;
  submittedDate?: string;
  approvedDate?: string;
  paymentDueDate: string;
  paymentReceivedDate?: string;
  paymentReceivedAmount: number;
  outstandingAmount: number;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Partially Paid' | 'Paid' | 'Overdue';
  items?: BillItem[];
  deductions?: BillDeduction[];
  createdAt: string;
  updatedAt: string;
}

export interface DeductionType {
  id: string;
  name: string;
  defaultPercentage: number;
  fixedAmount: number;
  calculationBase: 'Gross' | 'Net' | 'Taxable';
  isActive: boolean;
}

export interface Payment {
  id: string;
  billId: string;
  billNumber?: string;
  projectId: string;
  projectName?: string;
  invoiceAmount: number;
  amountReceived: number;
  balance: number;
  paymentDate: string;
  paymentMethod: string;
  bankName: string;
  transactionRef: string;
  remarks?: string;
  createdAt: string;
}

export interface Retention {
  id: string;
  projectId: string;
  projectName?: string;
  billId: string;
  billNumber?: string;
  retentionPercentage: number;
  retentionAmount: number;
  retentionDate: string;
  expectedReleaseDate: string;
  actualReleaseDate?: string;
  status: 'Held' | 'Due Soon' | 'Overdue' | 'Released';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppDocument {
  id: string;
  relatedType: 'Tender' | 'Project' | 'Bill' | 'EMD' | 'Security Deposit' | 'Material Dispatch' | 'Contract';
  relatedId: string;
  relatedName?: string;
  category: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileUrl: string;
  uploadedBy: string;
  uploadDate: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  type: 'Tender' | 'EMD' | 'Stock' | 'Billing' | 'Retention' | 'Project' | 'General';
  relatedModule?: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  type: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  dueDate?: string;
  linkModule: string;
  linkId: string;
}
