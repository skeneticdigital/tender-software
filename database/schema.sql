-- ===================================================
-- TenderFlow ERP - Complete MySQL 8+ Relational Schema
-- Tender, Project, Material & Financial Management System
-- ===================================================

CREATE DATABASE IF NOT EXISTS tenderflow_db;
USE tenderflow_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Active',
    avatar VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Deduction Types Configuration Table
CREATE TABLE IF NOT EXISTS deduction_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    default_percentage DECIMAL(5,2) DEFAULT 0.00,
    fixed_amount DECIMAL(15,2) DEFAULT 0.00,
    calculation_base VARCHAR(50) DEFAULT 'Gross', -- Gross, Net, Taxable
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tenders Table
CREATE TABLE IF NOT EXISTS tenders (
    id VARCHAR(36) PRIMARY KEY,
    ref_number VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    department_type VARCHAR(50) NOT NULL, -- Central Gov, State Gov, PSU, Private
    tender_type VARCHAR(50) NOT NULL, -- Item Rate, Percentage Rate, EPC, Turnkey
    project_category VARCHAR(100) NOT NULL, -- Highways, Building, Water Supply, Bridges, Electrical
    location VARCHAR(255) NOT NULL,
    submission_date DATETIME NOT NULL,
    opening_date DATETIME NOT NULL,
    estimated_value DECIMAL(15,2) NOT NULL,
    quoted_amount DECIMAL(15,2) DEFAULT 0.00,
    tender_fee DECIMAL(15,2) DEFAULT 0.00,
    emd_required TINYINT(1) DEFAULT 1,
    emd_amount DECIMAL(15,2) DEFAULT 0.00,
    emd_payment_date DATE,
    emd_bank_account VARCHAR(100),
    tender_status VARCHAR(50) DEFAULT 'Preparing', -- Draft, Preparing, Submitted, Under Evaluation, Won, Lost, Cancelled, Withdrawn
    result_date DATE,
    awarded_amount DECIMAL(15,2) DEFAULT 0.00,
    competitor_info TEXT,
    remarks TEXT,
    created_by VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tender_status (tender_status),
    INDEX idx_tender_client (client_name),
    INDEX idx_tender_dates (submission_date, opening_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. EMD Transactions Table
CREATE TABLE IF NOT EXISTS emd_transactions (
    id VARCHAR(36) PRIMARY KEY,
    tender_id VARCHAR(36) NOT NULL,
    emd_amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    bank_account VARCHAR(100) NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- Bank Guarantee, FDR, E-Payment, Demand Draft
    emd_type VARCHAR(50) DEFAULT 'Standard',
    expected_refund_date DATE,
    actual_refund_date DATE,
    refund_amount DECIMAL(15,2) DEFAULT 0.00,
    refund_status VARCHAR(50) DEFAULT 'Paid', -- Not Paid, Paid, Refund Pending, Partially Refunded, Refunded, Retained, Converted to Security Deposit
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE,
    INDEX idx_emd_status (refund_status),
    INDEX idx_emd_refund_date (expected_refund_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    tender_id VARCHAR(36),
    project_name VARCHAR(255) NOT NULL,
    tender_ref VARCHAR(100),
    client VARCHAR(255) NOT NULL,
    contract_number VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    planned_completion_date DATE NOT NULL,
    actual_completion_date DATE,
    contract_value DECIMAL(15,2) NOT NULL,
    awarded_amount DECIMAL(15,2) NOT NULL,
    project_manager_id VARCHAR(36),
    site_supervisor_id VARCHAR(36),
    status VARCHAR(50) DEFAULT 'Active', -- Not Started, Active, On Hold, Near Completion, Completed, Closed
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE SET NULL,
    FOREIGN KEY (project_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_supervisor_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_project_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Security Deposits Table
CREATE TABLE IF NOT EXISTS security_deposits (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    tender_id VARCHAR(36),
    deposit_type VARCHAR(50) NOT NULL, -- Performance Guarantee, Security Deposit, Additional Deposit
    amount DECIMAL(15,2) NOT NULL,
    deposit_date DATE NOT NULL,
    bank VARCHAR(100) NOT NULL,
    ref_number VARCHAR(100) NOT NULL,
    expected_release_date DATE NOT NULL,
    actual_release_date DATE,
    status VARCHAR(50) DEFAULT 'Active', -- Active, Due Soon, Released, Overdue
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE SET NULL,
    INDEX idx_security_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Project Sites Table
CREATE TABLE IF NOT EXISTS project_sites (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    site_name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    supervisor_id VARCHAR(36),
    status VARCHAR(50) DEFAULT 'Active',
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Materials Master Table
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(36) PRIMARY KEY,
    material_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Cement, Steel, Bricks, Aggregates, Electrical, Plumbing, Tiles, Sand, Aggregates, Others
    unit VARCHAR(20) NOT NULL, -- Bags, MT, Nos, Cu.m, Sq.m, Meters
    specification TEXT,
    min_stock_level DECIMAL(12,2) DEFAULT 0.00,
    reorder_level DECIMAL(12,2) DEFAULT 0.00,
    current_stock DECIMAL(12,2) DEFAULT 0.00,
    supplier_name VARCHAR(100),
    unit_rate DECIMAL(15,2) DEFAULT 0.00,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_material_cat (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Material Dispatch Table
CREATE TABLE IF NOT EXISTS material_dispatch (
    id VARCHAR(36) PRIMARY KEY,
    dispatch_code VARCHAR(50) NOT NULL UNIQUE,
    project_id VARCHAR(36) NOT NULL,
    site_id VARCHAR(36),
    material_id VARCHAR(36) NOT NULL,
    batch_number VARCHAR(50),
    dispatch_date DATE NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(100),
    issued_by_id VARCHAR(36),
    received_by_id VARCHAR(36),
    status VARCHAR(50) DEFAULT 'In Transit', -- In Transit, Received, Partially Received, Cancelled
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    INDEX idx_dispatch_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Material Receipts Table
CREATE TABLE IF NOT EXISTS material_receipts (
    id VARCHAR(36) PRIMARY KEY,
    receipt_code VARCHAR(50) NOT NULL UNIQUE,
    dispatch_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36) NOT NULL,
    material_id VARCHAR(36) NOT NULL,
    received_quantity DECIMAL(12,2) NOT NULL,
    damaged_quantity DECIMAL(12,2) DEFAULT 0.00,
    accepted_quantity DECIMAL(12,2) NOT NULL,
    received_date DATE NOT NULL,
    received_by_id VARCHAR(36),
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispatch_id) REFERENCES material_dispatch(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Material Consumption Table
CREATE TABLE IF NOT EXISTS material_consumption (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    site_id VARCHAR(36),
    material_id VARCHAR(36) NOT NULL,
    consumption_date DATE NOT NULL,
    quantity_consumed DECIMAL(12,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    work_category VARCHAR(100) NOT NULL, -- Foundation, Superstructure, Brickwork, Plastering, Flooring, Electrical, Plumbing, Road Work
    supervisor_id VARCHAR(36),
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    INDEX idx_consumption_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Stock Alerts Table
CREATE TABLE IF NOT EXISTS stock_alerts (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36),
    material_id VARCHAR(36) NOT NULL,
    current_stock DECIMAL(12,2) NOT NULL,
    reorder_level DECIMAL(12,2) NOT NULL,
    suggested_reorder_qty DECIMAL(12,2) NOT NULL,
    alert_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Active', -- Active, Resolved, Dismissed
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Bills Table
CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(36) PRIMARY KEY,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    project_id VARCHAR(36) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    bill_date DATE NOT NULL,
    billing_period VARCHAR(100) NOT NULL,
    work_description TEXT,
    gross_amount DECIMAL(15,2) NOT NULL,
    gst_amount DECIMAL(15,2) DEFAULT 0.00,
    gross_with_tax DECIMAL(15,2) NOT NULL,
    total_deductions DECIMAL(15,2) DEFAULT 0.00,
    retention_amount DECIMAL(15,2) DEFAULT 0.00,
    net_payable DECIMAL(15,2) NOT NULL,
    submitted_date DATE,
    approved_date DATE,
    payment_due_date DATE NOT NULL,
    payment_received_date DATE,
    payment_received_amount DECIMAL(15,2) DEFAULT 0.00,
    outstanding_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Submitted', -- Draft, Submitted, Under Review, Approved, Partially Paid, Paid, Overdue
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_bill_status (status),
    INDEX idx_bill_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Bill Items Table
CREATE TABLE IF NOT EXISTS bill_items (
    id VARCHAR(36) PRIMARY KEY,
    bill_id VARCHAR(36) NOT NULL,
    description VARCHAR(255) NOT NULL,
    boq_item VARCHAR(50),
    quantity DECIMAL(12,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    rate DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Bill Deductions Table
CREATE TABLE IF NOT EXISTS bill_deductions (
    id VARCHAR(36) PRIMARY KEY,
    bill_id VARCHAR(36) NOT NULL,
    deduction_type_id VARCHAR(36),
    deduction_name VARCHAR(100) NOT NULL,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    fixed_amount DECIMAL(15,2) DEFAULT 0.00,
    calculated_amount DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    bill_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36) NOT NULL,
    invoice_amount DECIMAL(15,2) NOT NULL,
    amount_received DECIMAL(15,2) NOT NULL,
    balance DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- NEFT/RTGS, Cheque, Bank Transfer, Demand Draft
    bank_name VARCHAR(100) NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. Retentions Table
CREATE TABLE IF NOT EXISTS retentions (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    bill_id VARCHAR(36) NOT NULL,
    retention_percentage DECIMAL(5,2) DEFAULT 5.00,
    retention_amount DECIMAL(15,2) NOT NULL,
    retention_date DATE NOT NULL,
    expected_release_date DATE NOT NULL,
    actual_release_date DATE,
    status VARCHAR(50) DEFAULT 'Held', -- Held, Due Soon, Overdue, Released
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    INDEX idx_retention_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(36) PRIMARY KEY,
    related_type VARCHAR(50) NOT NULL, -- Tender, Project, Bill, EMD, Security Deposit, Material Dispatch, Contract
    related_id VARCHAR(36) NOT NULL,
    category VARCHAR(100) NOT NULL, -- Tender Documents, BOQ, Contract, Work Order, Invoice, Payment Proof, EMD Receipt, Security Deposit, Other Documents
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size VARCHAR(20) NOT NULL,
    file_url TEXT,
    uploaded_by VARCHAR(100) NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_doc_rel (related_type, related_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 19. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium', -- Critical, High, Medium, Low
    type VARCHAR(50) DEFAULT 'General', -- Tender, EMD, Stock, Billing, Retention, Project
    related_module VARCHAR(50),
    related_id VARCHAR(36),
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_read (is_read),
    INDEX idx_notif_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 20. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    user_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id VARCHAR(36),
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_module (module),
    INDEX idx_audit_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21. System Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
