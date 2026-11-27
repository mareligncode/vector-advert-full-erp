import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';
import * as installationController from '../controllers/installationController.js';
import {
  verifyJobReadyForDelivery,
  validateHandoverSignOff
} from '../middleware/installationValidationMiddleware.js';

export const siteInstallationRoutes = express.Router();

siteInstallationRoutes
  .route('/')
  .get(protect, installationController.getInstallations)
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
    verifyJobReadyForDelivery,
    installationController.createInstallation
  );

siteInstallationRoutes
  .route('/:id')
  .get(protect, installationController.getInstallationById);

siteInstallationRoutes.patch(
  '/:id/dispatch',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.MANAGER,
    ROLES.DEPARTMENT_HEAD,
    ROLES.EMPLOYEE
  ),
  installationController.dispatchCrew
);

siteInstallationRoutes.put(
  '/:id/checklist',
  protect,
  installationController.updateChecklist
);

siteInstallationRoutes.post(
  '/:id/night-test',
  protect,
  installationController.submitNightTest
);

siteInstallationRoutes.post(
  '/:id/handover',
  protect,
  validateHandoverSignOff,
  installationController.signHandover
);

export default siteInstallationRoutes;
