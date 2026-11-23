import express from 'express';
import {
  getStaffRequests,
  getStaffRequestById,
  createStaffRequest,
  approveStaffRequest,
  getStoreIssueVouchers,
  createStoreIssueVoucher,
  createStaffReturn,
  createSIVWaste
} from '../controllers/storeRequestController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect);

// Staff Requisitions (Office & Workshop)
router.get('/requests', getStaffRequests);
router.get('/requests/:id', getStaffRequestById);
router.post('/requests', createStaffRequest);
router.put(
  '/requests/:id/approve',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  approveStaffRequest
);

// Store Issue Vouchers (SIV)
router.get('/siv', getStoreIssueVouchers);
router.post(
  '/siv',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createStoreIssueVoucher
);

// Staff Returns & Waste
router.post(
  '/returns',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createStaffReturn
);
router.post(
  '/waste',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createSIVWaste
);

export default router;
