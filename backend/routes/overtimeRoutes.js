import express from 'express';
import {
  createOvertimeRequest,
  getMyOvertimeRequests,
  getAllOvertimeRequests,
  getOvertimeRequestById,
  decideOvertimeRequest,
  cancelOvertimeRequest,
  getOvertimeConfig,
  updateOvertimeConfig,
  getMyOvertimeSummary
} from '../controllers/overtimeController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { MANAGEMENT_ROLES, HR_ADMIN_ROLES } from '../constants/roles.js';

const router = express.Router();

// All overtime routes are protected
router.use(protect);

// Overtime Policy Configuration
router
  .route('/config')
  .get(getOvertimeConfig)
  .put(authorizeRoles(...HR_ADMIN_ROLES), updateOvertimeConfig);

// Overtime requests collection
router
  .route('/')
  .post(createOvertimeRequest)
  .get(authorizeRoles(...MANAGEMENT_ROLES), getAllOvertimeRequests);

// Logged-in user's requests & summary
router.get('/me', getMyOvertimeRequests);
router.get('/summary/me', getMyOvertimeSummary);

// Single Overtime Request
router.get('/:id', getOvertimeRequestById);

// Decision / Approval (Management / HR)
router.patch('/:id/decision', authorizeRoles(...MANAGEMENT_ROLES), decideOvertimeRequest);

// Cancel Request
router.post('/:id/cancel', cancelOvertimeRequest);

export default router;
