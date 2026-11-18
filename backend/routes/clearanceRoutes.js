import express from 'express';
import {
  initiateClearance,
  getClearances,
  getMyClearance,
  getClearanceById,
  updateDepartmentClearance,
  finalizeClearance,
  updateClearance,
  deleteClearance
} from '../controllers/clearanceController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { upload, setUploadCategory } from '../middleware/uploadMiddleware.js';
import { HR_ADMIN_ROLES, MANAGEMENT_ROLES, EXECUTIVE_ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect);

// Clearance collection & self
router
  .route('/')
  .post(initiateClearance)
  .get(authorizeRoles(...MANAGEMENT_ROLES), getClearances);

router.get('/me', getMyClearance);

// Single clearance record
router
  .route('/:id')
  .get(getClearanceById)
  .patch(authorizeRoles(...HR_ADMIN_ROLES), updateClearance)
  .delete(authorizeRoles(...EXECUTIVE_ROLES), deleteClearance);

// Multi-Department Sign-off (department authorization verified in controller)
router.patch('/:id/department/:department', updateDepartmentClearance);

// Finalize clearance & attach certificate
router.post(
  '/:id/finalize',
  authorizeRoles(...HR_ADMIN_ROLES),
  setUploadCategory('clearances'),
  upload.single('certificate'),
  finalizeClearance
);

export default router;
