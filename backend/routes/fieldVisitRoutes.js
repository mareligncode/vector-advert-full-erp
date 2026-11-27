import express from 'express';
import {
  createFieldVisit,
  getFieldVisits,
  getMyFieldVisits,
  getFieldVisitById,
  updateFieldVisit,
  checkInFieldVisit,
  deleteFieldVisit,
  getMyFieldVisitSummary
} from '../controllers/fieldVisitController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { MANAGEMENT_ROLES, HR_ADMIN_ROLES } from '../constants/roles.js';
import { upload, setUploadCategory } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All field visit routes are protected
router.use(protect);

// Field Visits Collection
router
  .route('/')
  .post(authorizeRoles(...MANAGEMENT_ROLES), createFieldVisit)
  .get(getFieldVisits);

// Self-assigned visits & summary
router.get('/me', getMyFieldVisits);
router.get('/summary/me', getMyFieldVisitSummary);

// Single Field Visit
router
  .route('/:id')
  .get(getFieldVisitById)
  .patch(updateFieldVisit)
  .delete(authorizeRoles(...HR_ADMIN_ROLES), deleteFieldVisit);

// On-site check-in
router.post(
  '/:id/check-in',
  setUploadCategory('field-visits'),
  upload.single('selfie'),
  checkInFieldVisit
);

export default router;
