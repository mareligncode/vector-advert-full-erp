import express from 'express';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateUserRoles
} from '../controllers/authController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);

// Role management route (CEO, CAO, COO, Super Admin, HR Manager)
router.patch(
  '/users/:id/roles',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.CAO,
    ROLES.COO,
    ROLES.HR_MANAGER
  ),
  updateUserRoles
);

export default router;

