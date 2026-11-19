import express from 'express';
import {
  createProfessionalUpgrade,
  getProfessionalUpgrades,
  getMyProfessionalUpgrades,
  getProfessionalUpgradeById,
  reviewProfessionalUpgrade,
  updateProfessionalUpgrade,
  deleteProfessionalUpgrade
} from '../controllers/professionalUpgradeController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { MANAGEMENT_ROLES, EXECUTIVE_ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(createProfessionalUpgrade)
  .get(authorizeRoles(...MANAGEMENT_ROLES), getProfessionalUpgrades);

router.get('/me', getMyProfessionalUpgrades);

router
  .route('/:id')
  .get(getProfessionalUpgradeById)
  .patch(updateProfessionalUpgrade)
  .delete(authorizeRoles(...EXECUTIVE_ROLES), deleteProfessionalUpgrade);

router.patch('/:id/review', authorizeRoles(...MANAGEMENT_ROLES), reviewProfessionalUpgrade);

export default router;
