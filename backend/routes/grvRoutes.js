import express from 'express';
import {
  getGRVs,
  getGRVById,
  createGRVByPurchaser,
  updateGRVByPurchaser,
  acceptGRVByStoreKeeper,
  rejectGRVByStoreKeeper
} from '../controllers/grvController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect);

router.get('/', getGRVs);
router.get('/:id', getGRVById);

// Step 1: Purchaser creates incoming GRV (status: pending_store_acceptance)
router.post(
  '/',
  authorizeRoles(ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  createGRVByPurchaser
);

// Edit GRV by Purchaser before storekeeper acceptance
router.put(
  '/:id',
  authorizeRoles(ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  updateGRVByPurchaser
);

// Step 2: Storekeeper accepts GRV (with comments, deliveryStatus, and stock upsert)
router.put(
  '/:id/accept',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  acceptGRVByStoreKeeper
);

// Step 2 (Alternative): Storekeeper rejects incoming GRV
router.put(
  '/:id/reject',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  rejectGRVByStoreKeeper
);

export default router;
