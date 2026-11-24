import express from 'express';
import {
  getPurchaseRequests,
  getPurchaseRequestById,
  createPurchaseRequest,
  approvePurchaseRequest,
  rejectPurchaseRequest,
  getProcurementAssignments,
  assignProcurementRequest,
  updateProcurementAssignmentStatus,
  getVendorPriceComparisons,
  getVendorPriceComparisonById,
  createVendorPriceComparison,
  approveVendorPriceComparison,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  getPurchaserAuctions,
  createPurchaserAuction,
  submitBid
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
router.put(
  '/requests/:id/reject',
  authorizeRoles(...MANAGEMENT_ROLES),
  rejectPurchaseRequest
);

// Procurement Assignments
router.get('/assignments', getProcurementAssignments);
router.post(
  '/assignments',
  authorizeRoles(...MANAGEMENT_ROLES),
  assignProcurementRequest
);
router.put(
  '/assignments/:id/status',
  authorizeRoles(ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  updateProcurementAssignmentStatus
);

// Quotation & Price Comparisons
router.get('/comparisons', getVendorPriceComparisons);
router.get('/comparisons/:id', getVendorPriceComparisonById);
router.post(
  '/comparisons',
  authorizeRoles(ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  createVendorPriceComparison
);
router.put(
  '/comparisons/:id/approve',
  authorizeRoles(...MANAGEMENT_ROLES),
  approveVendorPriceComparison
);

// Purchase Orders (PO)
router.get('/orders', getPurchaseOrders);
router.get('/orders/:id', getPurchaseOrderById);
router.post(
  '/orders',
  authorizeRoles(ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  createPurchaseOrder
);

// Auctions & Bidding
router.get('/auctions', getPurchaserAuctions);
router.post(
  '/auctions',
  authorizeRoles(ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  createPurchaserAuction
);
router.post('/auctions/:id/bids', submitBid);

export default router;
