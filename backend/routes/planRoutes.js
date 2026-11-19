import express from 'express';
import {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  updatePlanApproval,
  addTask,
  updateTask,
  addDocument,
  deletePlan
} from '../controllers/planController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { MANAGEMENT_ROLES, EXECUTIVE_ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(authorizeRoles(...MANAGEMENT_ROLES), createPlan)
  .get(getPlans);

router
  .route('/:id')
  .get(getPlanById)
  .patch(authorizeRoles(...MANAGEMENT_ROLES), updatePlan)
  .delete(authorizeRoles(...EXECUTIVE_ROLES), deletePlan);

router.patch('/:id/approval', authorizeRoles(...EXECUTIVE_ROLES), updatePlanApproval);

router.post('/:id/tasks', authorizeRoles(...MANAGEMENT_ROLES), addTask);
router.patch('/:id/tasks/:taskId', updateTask);

router.post('/:id/documents', authorizeRoles(...MANAGEMENT_ROLES), addDocument);

export default router;
