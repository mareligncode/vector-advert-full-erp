import express from 'express';
import {
  createFieldVisit,
  getFieldVisits,
  getMyFieldVisits,
  getFieldVisitById,
  updateFieldVisit,
  checkInFieldVisit
} from '../controllers/fieldVisitController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { MANAGEMENT_ROLES } from '../constants/roles.js';

const router = express.Router();

// All field visit routes are protected
router.use(protect);

// Field Visits Collection
router
  .route('/')
  .post(authorizeRoles(...MANAGEMENT_ROLES), createFieldVisit)
  .get(getFieldVisits);

// Self-assigned visits
router.get('/me', getMyFieldVisits);

// Single Field Visit
router
  .route('/:id')
  .get(getFieldVisitById)
  .patch(updateFieldVisit);

// On-site check-in
router.post('/:id/check-in', checkInFieldVisit);

export default router;
