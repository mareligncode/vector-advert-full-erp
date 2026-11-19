import express from 'express';
import {
  createTraining,
  getTrainings,
  getMyTrainings,
  getTrainingById,
  updateTraining,
  deleteTraining,
  addParticipant,
  updateParticipant
} from '../controllers/trainingController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { MANAGEMENT_ROLES, EXECUTIVE_ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(authorizeRoles(...MANAGEMENT_ROLES), createTraining)
  .get(getTrainings);

router.get('/my-trainings', getMyTrainings);

router
  .route('/:id')
  .get(getTrainingById)
  .patch(authorizeRoles(...MANAGEMENT_ROLES), updateTraining)
  .delete(authorizeRoles(...EXECUTIVE_ROLES), deleteTraining);

router.post('/:id/participants', authorizeRoles(...MANAGEMENT_ROLES), addParticipant);
router.patch('/:id/participants/:participantId', authorizeRoles(...MANAGEMENT_ROLES), updateParticipant);

export default router;
