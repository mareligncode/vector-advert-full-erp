import express from 'express';
import {
  getInternships,
  getInternshipById,
  createInternship,
  updateInternship,
  updateInternshipStatus,
  addInternshipEvaluation,
  convertInternToEmployee,
  deleteInternship,
  addInternshipDocument,
  removeInternshipDocument
} from '../controllers/internshipController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { HR_ADMIN_ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';
import { upload, setUploadCategory } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(protect, authorizeRoles(...MANAGEMENT_ROLES), getInternships)
  .post(protect, authorizeRoles(...HR_ADMIN_ROLES), createInternship);

router
  .route('/:id')
  .get(protect, getInternshipById)
  .put(protect, authorizeRoles(...HR_ADMIN_ROLES), updateInternship)
  .delete(protect, authorizeRoles(...HR_ADMIN_ROLES), deleteInternship);

router.patch(
  '/:id/status',
  protect,
  authorizeRoles(...MANAGEMENT_ROLES),
  updateInternshipStatus
);

// Multiple documents endpoints (Add one file after another via Add button)
router
  .route('/:id/documents')
  .post(
    protect,
    authorizeRoles(...MANAGEMENT_ROLES),
    setUploadCategory('internships'),
    upload.single('file'),
    addInternshipDocument
  );

router
  .route('/:id/documents/:documentId')
  .delete(protect, authorizeRoles(...HR_ADMIN_ROLES), removeInternshipDocument);

router.post(
  '/:id/evaluations',
  protect,
  authorizeRoles(...MANAGEMENT_ROLES),
  addInternshipEvaluation
);

router.post(
  '/:id/convert-to-employee',
  protect,
  authorizeRoles(...HR_ADMIN_ROLES),
  convertInternToEmployee
);

export default router;
