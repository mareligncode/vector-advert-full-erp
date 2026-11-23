import express from 'express';
import {
  getPayrollConfig,
  updatePayrollConfig,
  getSalaryStructures,
  getEmployeeSalaryStructure,
  upsertSalaryStructure,
  getPayrollRuns,
  getPayrollRunById,
  generatePayrollRun,
  recalculatePayrollRun,
  approvePayrollRunStage,
  disbursePayrollRun,
  cancelPayrollRun,
  getPayslips,
  getMyPayslips,
  getPayslipById,
  getPayslipHtml,
  getLoans,
  getMyLoans,
  applyForLoan,
  approveLoanStage,
  disburseLoan,
  getPayrollAnalytics
} from '../controllers/payrollController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  ROLES,
  HR_ADMIN_ROLES,
  EXECUTIVE_ROLES,
  MANAGEMENT_ROLES
} from '../constants/roles.js';

const router = express.Router();

// All payroll routes require authenticated user
router.use(protect);

// ----------------------------------------------------
// Analytics & Summaries
// ----------------------------------------------------
router.get(
  '/analytics/summary',
  authorizeRoles(...HR_ADMIN_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES),
  getPayrollAnalytics
);

// ----------------------------------------------------
// Payroll Configuration
// ----------------------------------------------------
router.get('/config', getPayrollConfig);
router.put(
  '/config',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.CAO,
    ROLES.COO,
    ROLES.HR_MANAGER,
    ROLES.FINANCE
  ),
  updatePayrollConfig
);

// ----------------------------------------------------
// Salary Structures
// ----------------------------------------------------
router.get(
  '/structures',
  authorizeRoles(...HR_ADMIN_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES),
  getSalaryStructures
);
router.get('/structures/employee/:employeeId', getEmployeeSalaryStructure);
router.post(
  '/structures',
  authorizeRoles(...HR_ADMIN_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES),
  upsertSalaryStructure
);

// ----------------------------------------------------
// Payroll Runs (Batches)
// ----------------------------------------------------
router.get(
  '/runs',
  authorizeRoles(...HR_ADMIN_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES),
  getPayrollRuns
);
router.get(
  '/runs/:id',
  authorizeRoles(...HR_ADMIN_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES),
  getPayrollRunById
);
router.post(
  '/runs/generate',
  authorizeRoles(...HR_ADMIN_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES),
  generatePayrollRun
);
router.post(
  '/runs/:id/recalculate',
  authorizeRoles(...HR_ADMIN_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES),
  recalculatePayrollRun
);
router.post(
  '/runs/:id/approve',
  authorizeRoles(
    ...MANAGEMENT_ROLES,
    ROLES.FINANCE,
    ...EXECUTIVE_ROLES
  ),
  approvePayrollRunStage
);
router.post(
  '/runs/:id/disburse',
  authorizeRoles(ROLES.FINANCE, ROLES.SUPER_ADMIN, ROLES.CEO),
  disbursePayrollRun
);
router.delete(
  '/runs/:id',
  authorizeRoles(...HR_ADMIN_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES),
  cancelPayrollRun
);

// ----------------------------------------------------
// Payslips
// ----------------------------------------------------
router.get(
  '/payslips',
  authorizeRoles(...HR_ADMIN_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES),
  getPayslips
);
router.get('/payslips/my-payslips', getMyPayslips);
router.get('/payslips/:id', getPayslipById);
router.get('/payslips/:id/html', getPayslipHtml);

// ----------------------------------------------------
// Salary Advances & Staff Loans
// ----------------------------------------------------
router.get(
  '/loans',
  authorizeRoles(...HR_ADMIN_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES),
  getLoans
);
router.get('/loans/my-loans', getMyLoans);
router.post('/loans', applyForLoan);
router.post(
  '/loans/:id/approve',
  authorizeRoles(
    ...MANAGEMENT_ROLES,
    ROLES.FINANCE,
    ...EXECUTIVE_ROLES
  ),
  approveLoanStage
);
router.post(
  '/loans/:id/disburse',
  authorizeRoles(ROLES.FINANCE, ROLES.SUPER_ADMIN, ROLES.CEO),
  disburseLoan
);

export default router;
