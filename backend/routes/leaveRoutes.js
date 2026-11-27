import express from 'express';
import {
  getLeaveConfig,
  updateLeaveConfig,
  getMyLeaveBalance,
  getAllLeaveBalances,
  getEmployeeLeaveBalances,
  initializeYearBalances,
  adjustLeaveBalance,
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  getLeaveRequestById,
  reviewLeaveRequest,
  cancelLeaveRequest
} from '../controllers/leaveController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { HR_ADMIN_ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect);

// ==========================================
// LEAVE POLICY CONFIGURATION
// ==========================================

router
  .route('/config')
  .get(getLeaveConfig)
  .put(authorizeRoles(...HR_ADMIN_ROLES), updateLeaveConfig);

// ==========================================
// LEAVE BALANCES
// ==========================================

router.get('/balances/me', getMyLeaveBalance);

router
  .route('/balances')
  .get(authorizeRoles(...MANAGEMENT_ROLES), getAllLeaveBalances);

router.post(
  '/balances/initialize',
  authorizeRoles(...HR_ADMIN_ROLES),
  initializeYearBalances
);

router
  .route('/balances/:id')
  .put(authorizeRoles(...HR_ADMIN_ROLES), adjustLeaveBalance);

router.get(
  '/balances/employee/:employeeId',
  authorizeRoles(...MANAGEMENT_ROLES),
  getEmployeeLeaveBalances
);

// ==========================================
// LEAVE REQUESTS
// ==========================================

router
  .route('/requests')
  .post(createLeaveRequest)
  .get(authorizeRoles(...MANAGEMENT_ROLES), getAllLeaveRequests);

router.get('/requests/me', getMyLeaveRequests);

router
  .route('/requests/:id')
  .get(getLeaveRequestById);

router.patch(
  '/requests/:id/review',
  authorizeRoles(...MANAGEMENT_ROLES),
  reviewLeaveRequest
);

router.post('/requests/:id/cancel', cancelLeaveRequest);

export default router;
