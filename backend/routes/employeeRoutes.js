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
  addDocument,
  removeDocument,
  approveDocument,
  approveNationalId,
  approveGuarantorNationalId
} from '../controllers/employeeController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { HR_ADMIN_ROLES, EXECUTIVE_ROLES } from '../constants/roles.js';

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

// Employment Status updates
router.patch('/:id/status', authorizeRoles(...HR_ADMIN_ROLES), updateEmploymentStatus);

// User Account Linkage
router.post('/:id/link-user', authorizeRoles(...HR_ADMIN_ROLES), linkUserAccount);
router.post('/:id/create-user', authorizeRoles(...HR_ADMIN_ROLES), createAndLinkUserAccount);
router.post('/:id/unlink-user', authorizeRoles(...HR_ADMIN_ROLES), unlinkUserAccount);

// Employee Documents
router.post('/:id/documents', addDocument);
router.delete('/:id/documents/:documentId', authorizeRoles(...HR_ADMIN_ROLES), removeDocument);

// Approvals: Documents & Fayda National IDs
router.patch('/:id/documents/:documentId/approve', authorizeRoles(...HR_ADMIN_ROLES), approveDocument);
router.patch('/:id/national-id/approve', authorizeRoles(...HR_ADMIN_ROLES), approveNationalId);
router.patch('/:id/guarantors/:guarantorId/national-id/approve', authorizeRoles(...HR_ADMIN_ROLES), approveGuarantorNationalId);

export default router;
