import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';
import * as productionWastageController from '../controllers/productionWastageController.js';
import {
  validateWastageItems,
  validateStaffReturnJobLink
} from '../middleware/productionWastageValidationMiddleware.js';

// ==========================================
// 1. Production Scrap & Wastage Router
// ==========================================
export const productionWastageRoutes = express.Router();

productionWastageRoutes
  .route('/')
  .get(protect, productionWastageController.getProductionWastage)
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
    validateWastageItems,
    productionWastageController.createProductionWastageHandler
  );

productionWastageRoutes
  .route('/:id')
  .get(protect, productionWastageController.getWastageById);

productionWastageRoutes.patch(
  '/:id/verify',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.FINANCE,
    ROLES.MANAGER
  ),
  productionWastageController.approveWastageWriteOff
);

// ==========================================
// 2. Staff Return Job Order Sub-Router
// ==========================================
export const staffReturnJobRoutes = express.Router();

staffReturnJobRoutes.post(
  '/job-order',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.STOREKEEPER,
    ROLES.MANAGER,
    ROLES.DEPARTMENT_HEAD,
    ROLES.EMPLOYEE
  ),
  validateStaffReturnJobLink,
  productionWastageController.createStaffReturnHandler
);

// ==========================================
// 3. Workshop Requisition Sub-Router
// ==========================================
export const workshopRequisitionRoutes = express.Router();

workshopRequisitionRoutes.post(
  '/workshop',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.MANAGER,
    ROLES.DEPARTMENT_HEAD,
    ROLES.EMPLOYEE
  ),
  productionWastageController.createWorkshopRequisitionHandler
);

// Consolidated Materials & Wastage Router
export const materialsWastageRoutes = express.Router();
materialsWastageRoutes.use('/wastage', productionWastageRoutes);
materialsWastageRoutes.use('/returns', staffReturnJobRoutes);
materialsWastageRoutes.use('/requisitions', workshopRequisitionRoutes);

export default productionWastageRoutes;
