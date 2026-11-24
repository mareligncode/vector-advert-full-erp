import express from 'express';
import {
  getStaffRequests,
  getStaffRequestById,
  createStaffRequest,
  approveStaffRequest,
  rejectStaffRequest,
  getStoreIssueVouchers,
  getStoreIssueVoucherById,
  createStoreIssueVoucher,
  getStaffReturns,
  createStaffReturn,
  getGRVReturns,
  createGRVReturn,
  getSIVWastes,
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
router.put(
  '/requests/:id/reject',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  rejectStaffRequest
);

// Store Issue Vouchers (SIV)
router.get('/siv', getStoreIssueVouchers);
router.get('/siv/:id', getStoreIssueVoucherById);
router.post(
  '/siv',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createStoreIssueVoucher
);

// Staff Returns
router.get('/returns', getStaffReturns);
router.post(
  '/returns',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createStaffReturn
);

// Supplier Returns (GRV Returns)
router.get('/supplier-returns', getGRVReturns);
router.post(
  '/supplier-returns',
  authorizeRoles(ROLES.STOREKEEPER, ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  createGRVReturn
);

// Scrap & Waste Write-Offs
router.get('/waste', getSIVWastes);
router.post(
  '/waste',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createSIVWaste
);

export default router;
