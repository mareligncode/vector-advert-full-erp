import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';
import * as orderDesignController from '../controllers/orderDesignController.js';
import {
  validateClientOrderInput,
  validateDesignTaskInput,
  validateDesignProofInput,
  verifyProofNotLocked
} from '../middleware/orderDesignValidationMiddleware.js';

// ==========================================
// 1. Client Orders Router
// ==========================================
export const clientOrderRoutes = express.Router();

clientOrderRoutes
  .route('/')
  .get(protect, orderDesignController.getClientOrders)
  .post(
    protect,
    authorizeRoles(
      ROLES.SUPER_ADMIN,
      ROLES.CEO,
      ROLES.COO,
      ROLES.CAO,
      ROLES.FRONTDESK,
      ROLES.MANAGER,
      ROLES.DEPARTMENT_HEAD,
      ROLES.EMPLOYEE
    ),
    validateClientOrderInput,
    orderDesignController.createClientOrder
  );

clientOrderRoutes
  .route('/:id')
  .get(protect, orderDesignController.getClientOrderById)
  .put(protect, orderDesignController.updateClientOrder);

clientOrderRoutes.post(
  '/:id/cancel',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.CEO, ROLES.COO, ROLES.MANAGER),
  orderDesignController.cancelClientOrder
);

clientOrderRoutes.post(
  '/:id/assign-design',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.MANAGER,
    ROLES.DEPARTMENT_HEAD,
    ROLES.FRONTDESK,
    ROLES.EMPLOYEE
  ),
  validateDesignTaskInput,
  orderDesignController.assignDesignTask
);

// ==========================================
// 2. Design Tasks Router
// ==========================================
export const designTaskRoutes = express.Router();

designTaskRoutes
  .route('/')
  .get(protect, orderDesignController.getDesignTasks)
  .post(
    protect,
    authorizeRoles(
      ROLES.SUPER_ADMIN,
      ROLES.CEO,
      ROLES.COO,
      ROLES.MANAGER,
      ROLES.DEPARTMENT_HEAD,
      ROLES.FRONTDESK,
      ROLES.EMPLOYEE
    ),
    validateDesignTaskInput,
    orderDesignController.assignDesignTask
  );

designTaskRoutes.get('/:id', protect, orderDesignController.getDesignTaskById);
designTaskRoutes.patch('/:id/status', protect, orderDesignController.updateDesignTaskStatus);

designTaskRoutes
  .route('/:taskId/proofs')
  .get(protect, orderDesignController.getDesignProofsByTask)
  .post(
    protect,
    authorizeRoles(
      ROLES.SUPER_ADMIN,
      ROLES.CEO,
      ROLES.COO,
      ROLES.MANAGER,
      ROLES.DESIGNER,
      ROLES.EMPLOYEE
    ),
    validateDesignProofInput,
    orderDesignController.submitDesignProofVersion
  );

// ==========================================
// 3. Design Proofs Router
// ==========================================
export const designProofRoutes = express.Router();

designProofRoutes.get('/:id', protect, orderDesignController.getDesignProofById);

designProofRoutes.post(
  '/:id/client-review',
  protect,
  verifyProofNotLocked,
  orderDesignController.processClientProofReview
);

designProofRoutes.post(
  '/:id/lock',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.MANAGER,
    ROLES.DEPARTMENT_HEAD,
    ROLES.DESIGNER,
    ROLES.FRONTDESK,
    ROLES.EMPLOYEE
  ),
  orderDesignController.lockProofForProduction
);

// ==========================================
// 4. Consolidated Orders & Design Router
// ==========================================
const orderDesignRoutes = express.Router();
orderDesignRoutes.use('/orders', clientOrderRoutes);
orderDesignRoutes.use('/tasks', designTaskRoutes);
orderDesignRoutes.use('/proofs', designProofRoutes);

export default orderDesignRoutes;
