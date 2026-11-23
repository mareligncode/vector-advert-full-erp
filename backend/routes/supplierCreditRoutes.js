import express from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  getCreditTransactions,
  recordCreditPayment,
  getTaxConfigurations,
  createTaxConfiguration
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

// Credit Transactions & Payments
router.get(
  '/credits',
  authorizeRoles(ROLES.FINANCE, ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  getCreditTransactions
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

export default router;
