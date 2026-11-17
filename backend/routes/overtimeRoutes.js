import express from 'express';
import {
  createOvertimeRequest,
  getMyOvertimeRequests,
  getAllOvertimeRequests,
  getOvertimeRequestById,
  decideOvertimeRequest
} from '../controllers/overtimeController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { MANAGEMENT_ROLES } from '../constants/roles.js';

const router = express.Router();

// All overtime routes are protected
router.use(protect);

// Overtime requests collection
router
  .route('/')
  .post(createOvertimeRequest)
  .get(authorizeRoles(...MANAGEMENT_ROLES), getAllOvertimeRequests);

// Logged-in user's requests
router.get('/me', getMyOvertimeRequests);

// Single Overtime Request
router.get('/:id', getOvertimeRequestById);

// Decision / Approval (Management / HR)
router.patch('/:id/decision', authorizeRoles(...MANAGEMENT_ROLES), decideOvertimeRequest);

export default router;
