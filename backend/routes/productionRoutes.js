import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';
import * as productionController from '../controllers/productionController.js';
import {
  verifyProductionReleaseGate,
  validateMachineInput,
  validateDimensionsAndSizing
} from '../middleware/productionValidationMiddleware.js';

// ==========================================
// 1. Job Orders Router (Shop-Floor Travelers)
// ==========================================
export const jobOrderRoutes = express.Router();

jobOrderRoutes
  .route('/')
  .get(protect, productionController.getJobOrders);

jobOrderRoutes.post(
  '/release/:clientOrderId',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.MANAGER,
    ROLES.DEPARTMENT_HEAD
  ),
  verifyProductionReleaseGate,
  productionController.releaseJobOrderHandler
);

jobOrderRoutes
  .route('/:id')
  .get(protect, productionController.getJobOrderById);

jobOrderRoutes.patch(
  '/:id/status',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.MANAGER,
    ROLES.DEPARTMENT_HEAD,
    ROLES.EMPLOYEE
  ),
  productionController.updateJobOrderStatus
);

// ==========================================
// 2. Production Machines Router
// ==========================================
export const productionMachineRoutes = express.Router();

productionMachineRoutes
  .route('/')
  .get(protect, productionController.getProductionMachines)
  .post(
    protect,
    authorizeRoles(
      ROLES.SUPER_ADMIN,
      ROLES.CEO,
      ROLES.COO,
      ROLES.MANAGER,
      ROLES.DEPARTMENT_HEAD
    ),
    validateMachineInput,
    productionController.createProductionMachine
  );

productionMachineRoutes
  .route('/:id')
  .get(protect, productionController.getProductionMachineById);

productionMachineRoutes.patch(
  '/:id/status',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.MANAGER,
    ROLES.DEPARTMENT_HEAD,
    ROLES.EMPLOYEE
  ),
  productionController.updateMachineStatus
);

// ==========================================
// 3. Production Requests Router
// ==========================================
export const productionRequestRoutes = express.Router();

productionRequestRoutes
  .route('/')
  .get(protect, productionController.getProductionRequests)
  .post(
    protect,
    authorizeRoles(
      ROLES.SUPER_ADMIN,
      ROLES.CEO,
      ROLES.COO,
      ROLES.MANAGER,
      ROLES.DEPARTMENT_HEAD,
      ROLES.EMPLOYEE
    ),
    validateDimensionsAndSizing,
    productionController.createProductionRequestHandler
  );

productionRequestRoutes
  .route('/:id')
  .get(protect, productionController.getProductionRequestById);

productionRequestRoutes.put(
  '/:id/machine-execution',
  protect,
  productionController.updateMachiningExecution
);

productionRequestRoutes.patch(
  '/:id/finishing-tasks/:taskNumber',
  protect,
  productionController.updateFinishingTask
);

productionRequestRoutes.post(
  '/:id/qc-clearance',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.MANAGER,
    ROLES.DEPARTMENT_HEAD,
    ROLES.EMPLOYEE
  ),
  productionController.submitQcClearance
);

// ==========================================
// 4. Consolidated Production Router
// ==========================================
export const productionRoutes = express.Router();

productionRoutes.use('/job-orders', jobOrderRoutes);
productionRoutes.use('/machines', productionMachineRoutes);
productionRoutes.use('/requests', productionRequestRoutes);

export default productionRoutes;
