import express from 'express';
import {
  getPurchaseRequests,
  getPurchaseRequestById,
  createPurchaseRequest,
  approvePurchaseRequest,
  assignProcurementRequest,
  getVendorPriceComparisons,
  createVendorPriceComparison,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder
} from '../controllers/procurementController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect);

// Purchase Requests
router.get('/requests', getPurchaseRequests);
router.get('/requests/:id', getPurchaseRequestById);
router.post('/requests', createPurchaseRequest);
router.put(
  '/requests/:id/approve',
  authorizeRoles(...MANAGEMENT_ROLES),
  approvePurchaseRequest
);

// Procurement Assignments
router.post(
  '/assignments',
  authorizeRoles(...MANAGEMENT_ROLES),
  assignProcurementRequest
);

// Quotation & Price Comparisons
router.get('/comparisons', getVendorPriceComparisons);
router.post(
  '/comparisons',
  authorizeRoles(ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  createVendorPriceComparison
);

// Purchase Orders (PO)
router.get('/orders', getPurchaseOrders);
router.get('/orders/:id', getPurchaseOrderById);
router.post(
  '/orders',
  authorizeRoles(ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  createPurchaseOrder
);

export default router;
