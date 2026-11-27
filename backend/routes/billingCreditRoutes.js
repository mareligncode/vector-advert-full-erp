import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';
import * as billingCreditController from '../controllers/billingCreditController.js';
import {
  checkCreditHold,
  validatePaymentInput,
  validateInvoiceFromOrderInput
} from '../middleware/billingCreditValidationMiddleware.js';

// ==========================================
// 1. Invoices Router
// ==========================================
export const invoiceRoutes = express.Router();

invoiceRoutes
  .route('/')
  .get(protect, billingCreditController.getInvoices);

invoiceRoutes.post(
  '/from-order/:orderId',
  protect,
  validateInvoiceFromOrderInput,
  billingCreditController.createInvoiceFromOrder
);

invoiceRoutes
  .route('/:id')
  .get(protect, billingCreditController.getInvoiceById);

invoiceRoutes.post(
  '/:id/convert-to-tax',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.CAO,
    ROLES.FINANCE,
    ROLES.MANAGER,
    ROLES.DEPARTMENT_HEAD
  ),
  billingCreditController.convertProformaHandler
);

invoiceRoutes.post(
  '/:id/dispatch-credit',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.CAO,
    ROLES.FINANCE,
    ROLES.MANAGER
  ),
  checkCreditHold,
  billingCreditController.dispatchOnCreditHandler
);

invoiceRoutes.post(
  '/:id/cancel',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.FINANCE,
    ROLES.MANAGER
  ),
  billingCreditController.cancelInvoiceHandler
);

// ==========================================
// 2. Payment Collections Router (CRV)
// ==========================================
export const paymentCollectionRoutes = express.Router();

paymentCollectionRoutes
  .route('/')
  .get(protect, billingCreditController.getPaymentCollections)
  .post(
    protect,
    authorizeRoles(
      ROLES.SUPER_ADMIN,
      ROLES.CEO,
      ROLES.COO,
      ROLES.CAO,
      ROLES.FINANCE,
      ROLES.FRONTDESK,
      ROLES.MANAGER,
      ROLES.DEPARTMENT_HEAD,
      ROLES.EMPLOYEE
    ),
    validatePaymentInput,
    billingCreditController.collectPayment
  );

paymentCollectionRoutes
  .route('/:id')
  .get(protect, billingCreditController.getPaymentCollectionById);

paymentCollectionRoutes.patch(
  '/:id/verify',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.FINANCE,
    ROLES.MANAGER
  ),
  billingCreditController.verifyPayment
);

// ==========================================
// 3. Customer Credit & Aging Router
// ==========================================
export const customerCreditRoutes = express.Router();

customerCreditRoutes.get(
  '/aging-report',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.CAO,
    ROLES.FINANCE,
    ROLES.MANAGER,
    ROLES.DEPARTMENT_HEAD
  ),
  billingCreditController.getAgingReport
);

customerCreditRoutes.post(
  '/evaluate-aging',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.FINANCE,
    ROLES.MANAGER
  ),
  billingCreditController.triggerAgingEvaluation
);

customerCreditRoutes.get(
  '/:clientId/ledger',
  protect,
  billingCreditController.getClientCreditLedger
);

// ==========================================
// 4. Compound Router (Billing & Credit)
// ==========================================
export const billingCreditRoutes = express.Router();

billingCreditRoutes.use('/invoices', invoiceRoutes);
billingCreditRoutes.use('/payment-collections', paymentCollectionRoutes);
billingCreditRoutes.use('/customer-credit', customerCreditRoutes);

export default billingCreditRoutes;
