import express from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getCreditTransactions,
  getCreditTransactionById,
  getCreditPayments,
  recordCreditPayment,
  getTaxConfigurations,
  createTaxConfiguration,
  updateTaxConfiguration
} from '../controllers/supplierCreditController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect);

// Suppliers
router.get('/suppliers', getSuppliers);
router.get('/suppliers/:id', getSupplierById);
router.post(
  '/suppliers',
  authorizeRoles(ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  createSupplier
);
router.put(
  '/suppliers/:id',
  authorizeRoles(ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  updateSupplier
);
router.delete(
  '/suppliers/:id',
  authorizeRoles(...MANAGEMENT_ROLES),
  deleteSupplier
);

// Credit Transactions (Vendor Payables)
router.get(
  '/credits',
  authorizeRoles(ROLES.FINANCE, ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  getCreditTransactions
);
router.get(
  '/credits/:id',
  authorizeRoles(ROLES.FINANCE, ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  getCreditTransactionById
);

// Supplier Payments
router.get(
  '/payments',
  authorizeRoles(ROLES.FINANCE, ...MANAGEMENT_ROLES),
  getCreditPayments
);
router.post(
  '/payments',
  authorizeRoles(ROLES.FINANCE, ...MANAGEMENT_ROLES),
  recordCreditPayment
);

// Tax Configurations
router.get('/taxes', getTaxConfigurations);
router.post(
  '/taxes',
  authorizeRoles(ROLES.FINANCE, ...MANAGEMENT_ROLES),
  createTaxConfiguration
);
router.put(
  '/taxes/:id',
  authorizeRoles(ROLES.FINANCE, ...MANAGEMENT_ROLES),
  updateTaxConfiguration
);

export default router;
