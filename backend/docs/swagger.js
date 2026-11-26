import { components } from './components.js';
import { systemPaths } from './paths/systemPaths.js';
import { authPaths } from './paths/authPaths.js';
import { employeePaths } from './paths/employeePaths.js';
import { attendanceOvertimeFieldPaths } from './paths/attendanceOvertimeFieldPaths.js';
import { leavePaths } from './paths/leavePaths.js';
import { recruitmentInternshipPaths } from './paths/recruitmentInternshipPaths.js';
import { uploadEvidencePaths } from './paths/uploadEvidencePaths.js';
import { hrLifecyclePaths } from './paths/hrLifecyclePaths.js';
import { payrollPaths } from './paths/payrollPaths.js';
import { inventoryPaths } from './paths/inventoryPaths.js';
import { supplyChainPaths } from './paths/supplyChainPaths.js';

const PORT = process.env.PORT || 5000;

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Vector Advert Full ERP - Backend API',
    version: '1.0.0',
    description:
      'Complete REST API documentation for Vector Advert Full ERP covering Authentication, HR & Employees, Attendance, Overtime, Field Visits, Leave Management, Recruitment, Internships, Clearances, Professional Upgrades, Trainings, Strategic Plans, Ethiopian Payroll & Loans, Multi-Warehouse Inventory & Fixed Assets, GRV, Store Requests & SIV, Procurement, Supplier Credits, File Uploads, and the Universal Evidence Hub.\n\n### Authentication\nObtain a JWT via `POST /api/auth/login`, click **Authorize**, and enter `<token>` (Swagger UI prepends `Bearer `).'
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Local development server'
    },
    {
      url: '/',
      description: 'Relative to current host'
    }
  ],
  tags: [
    { name: 'System', description: 'API health probe and documentation metadata' },
    { name: 'Auth', description: 'JWT authentication, registration, password reset, Telegram linking & RBAC' },
    { name: 'Employees', description: 'Employee profiles, National ID/guarantor approvals, documents & linked accounts' },
    { name: 'Attendance', description: 'Geofenced morning/afternoon shift check-in/out & attendance config' },
    { name: 'Overtime', description: 'Overtime requests and dual-stage manager/HR approvals' },
    { name: 'Field Visits', description: 'Outdoor site visit scheduling, leader assignment & geofence check-ins' },
    { name: 'Leave Management', description: 'Leave balances, initialization, requests, dual approvals & cancellations' },
    { name: 'Recruitment', description: 'Job postings, public applications, interviews & convert-to-employee onboarding' },
    { name: 'Internships', description: 'Intern/apprentice tracking, evaluations & full-time conversion' },
    { name: 'Clearances', description: '5-department employee exit clearance workflow & offboarding finalization' },
    { name: 'Professional Upgrades', description: 'Employee education/certification sponsorship requests & reviews' },
    { name: 'Trainings', description: 'Training sessions, participant enrollment, attendance & scoring' },
    { name: 'Plans', description: 'Strategic & departmental plans, executive approval, KPIs & tasks' },
    { name: 'Payroll', description: 'Payroll rules/tax slabs, salary structures, batch runs, payslips & staff loans' },
    { name: 'Inventory', description: 'Stock catalog, balances, movement ledger, warehouses, adjustments, transfers, counts, fixed assets & EOD reports' },
    { name: 'GRV', description: 'Goods Receiving Vouchers (purchaser submission & storekeeper accept/reject)' },
    { name: 'Store Requests & SIV', description: 'Material requisitions, Store Issue Vouchers, returns & spoilage waste' },
    { name: 'Procurement', description: 'Purchase requests, buyer assignments, price comparisons, Purchase Orders & auctions' },
    { name: 'Supplier Credits', description: 'Supplier master records, payable credit balances, settlements & tax rules' },
    { name: 'Uploads & Evidence', description: 'Multer file uploads and the polymorphic Evidence attachment/note hub' }
  ],
  security: [{ bearerAuth: [] }],
  components,
  paths: {
    ...systemPaths,
    ...authPaths,
    ...employeePaths,
    ...attendanceOvertimeFieldPaths,
    ...leavePaths,
    ...recruitmentInternshipPaths,
    ...uploadEvidencePaths,
    ...hrLifecyclePaths,
    ...payrollPaths,
    ...inventoryPaths,
    ...supplyChainPaths
  }
};

export default swaggerSpec;
