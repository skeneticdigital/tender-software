-- ===================================================
-- TenderFlow ERP - Production Seed Data (Indian Construction Context)
-- ===================================================

USE tenderflow_db;

-- 1. Default Users
INSERT INTO users (id, name, email, password_hash, role, department, phone, status) VALUES
('u-001', 'Rajesh Sharma', 'admin@tenderflow.com', '$2a$10$wT8KzQe6I9Nf5Vw0Y5G3u.4oZ.U1gZq3vV7nKxLmP2qRsTuVwXyZa', 'Super Admin', 'Executive Management', '+91 98765 43210', 'Active'),
('u-002', 'Vikramaditya Rao', 'tender@tenderflow.com', '$2a$10$wT8KzQe6I9Nf5Vw0Y5G3u.4oZ.U1gZq3vV7nKxLmP2qRsTuVwXyZa', 'Tender Manager', 'Business Development', '+91 98765 43211', 'Active'),
('u-003', 'Anil Mehta', 'pm@tenderflow.com', '$2a$10$wT8KzQe6I9Nf5Vw0Y5G3u.4oZ.U1gZq3vV7nKxLmP2qRsTuVwXyZa', 'Project Manager', 'Project Operations', '+91 98765 43212', 'Active'),
('u-004', 'Suresh Kumar', 'supervisor@tenderflow.com', '$2a$10$wT8KzQe6I9Nf5Vw0Y5G3u.4oZ.U1gZq3vV7nKxLmP2qRsTuVwXyZa', 'Site Supervisor', 'Site Engineering', '+91 98765 43213', 'Active'),
('u-005', 'Priya Patel', 'accounts@tenderflow.com', '$2a$10$wT8KzQe6I9Nf5Vw0Y5G3u.4oZ.U1gZq3vV7nKxLmP2qRsTuVwXyZa', 'Accounts Manager', 'Finance & Accounts', '+91 98765 43214', 'Active'),
('u-006', 'Sunil Verma', 'mgmt@tenderflow.com', '$2a$10$wT8KzQe6I9Nf5Vw0Y5G3u.4oZ.U1gZq3vV7nKxLmP2qRsTuVwXyZa', 'Management / Viewer', 'Board of Directors', '+91 98765 43215', 'Active');

-- 2. Deduction Types
INSERT INTO deduction_types (id, name, default_percentage, fixed_amount, calculation_base, is_active) VALUES
('dt-001', 'Welfare Fund', 1.00, 0.00, 'Gross', 1),
('dt-002', 'Labour Cess', 1.00, 0.00, 'Gross', 1),
('dt-003', 'TDS (Income Tax)', 2.00, 0.00, 'Gross', 1),
('dt-004', 'GST TDS', 2.00, 0.00, 'Gross', 1),
('dt-005', 'Retention Money', 5.00, 0.00, 'Gross', 1),
('dt-006', 'Security Deposit', 2.50, 0.00, 'Gross', 1);

-- 3. System Settings
INSERT INTO settings (id, setting_key, setting_value, description) VALUES
('s-001', 'company_name', 'TenderFlow Infrastructure Developers Pvt Ltd', 'Company Official Name'),
('s-002', 'company_address', 'Plot 42, Cyber City Infrastructure Zone, Hyderabad, Telangana - 500081', 'Registered Office Address'),
('s-003', 'currency_symbol', '₹', 'Currency Symbol'),
('s-004', 'emd_refund_period_days', '60', 'Default EMD refund grace period for lost tenders (Days)'),
('s-005', 'retention_release_period_months', '12', 'Default Defect Liability / Retention release duration (Months)'),
('s-006', 'stock_alert_notification', 'true', 'Auto trigger notifications on low stock'),
('s-007', 'gst_default_rate', '18.00', 'Default GST percentage on work contracts');
