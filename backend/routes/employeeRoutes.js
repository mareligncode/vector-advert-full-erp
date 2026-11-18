import express from 'express';
import {
  createEmployee,
  getEmployees,
  getMeEmployee,
  getEmployeeById,
  updateEmployee,
  updateEmploymentStatus,
  deleteEmployee,
  linkUserAccount,
  createAndLinkUserAccount,
  unlinkUserAccount,
  uploadProfilePhoto,
  removeProfilePhoto,
  uploadNationalIdPhotos,
  addDocument,
  removeDocument,
  approveDocument,
  approveNationalId,
  approveGuarantorNationalId
} from '../controllers/employeeController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { HR_ADMIN_ROLES, EXECUTIVE_ROLES } from '../constants/roles.js';
import { upload, setUploadCategory } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Apply auth protection to all employee routes
router.use(protect);

// Current logged-in user's employee profile
router.get('/me', getMeEmployee);

// Employee CRUD collection
router
  .route('/')
  .get(getEmployees)
  .post(authorizeRoles(...HR_ADMIN_ROLES), createEmployee);

// Single Employee operations
router
  .route('/:id')
  .get(getEmployeeById)
  .put(authorizeRoles(...HR_ADMIN_ROLES), updateEmployee)
  .delete(authorizeRoles(...EXECUTIVE_ROLES), deleteEmployee);

// Profile photo upload & removal
router.post(
  '/:id/profile-photo',
  setUploadCategory('employees'),
  upload.single('photo'),
  uploadProfilePhoto
);
router.delete('/:id/profile-photo', removeProfilePhoto);

// Fayda National ID photos upload
router.post(
  '/:id/national-id/photos',
  setUploadCategory('national-ids'),
  upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
  ]),
  uploadNationalIdPhotos
);

// Employment Status updates
router.patch('/:id/status', authorizeRoles(...HR_ADMIN_ROLES), updateEmploymentStatus);

// User Account Linkage
router.post('/:id/link-user', authorizeRoles(...HR_ADMIN_ROLES), linkUserAccount);
router.post('/:id/create-user', authorizeRoles(...HR_ADMIN_ROLES), createAndLinkUserAccount);
router.post('/:id/unlink-user', authorizeRoles(...HR_ADMIN_ROLES), unlinkUserAccount);

// Employee Documents
router.post(
  '/:id/documents',
  setUploadCategory('employees'),
  upload.single('file'),
  addDocument
);
router.delete('/:id/documents/:documentId', authorizeRoles(...HR_ADMIN_ROLES), removeDocument);

// Approvals: Documents & Fayda National IDs
router.patch('/:id/documents/:documentId/approve', authorizeRoles(...HR_ADMIN_ROLES), approveDocument);
router.patch('/:id/national-id/approve', authorizeRoles(...HR_ADMIN_ROLES), approveNationalId);
router.patch('/:id/guarantors/:guarantorId/national-id/approve', authorizeRoles(...HR_ADMIN_ROLES), approveGuarantorNationalId);

export default router;
