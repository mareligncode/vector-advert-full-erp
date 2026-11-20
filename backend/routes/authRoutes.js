import express from 'express';
import {
  register,
  login,
  getMe,
  changePassword,
  getRegistrationPermissions,
  forgotPassword,
  resetPassword,
  updateUserRoles,
  getTelegramLinkCode,
  unlinkTelegram
} from '../controllers/authController.js';
import { protect, optionalProtect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Public / Semi-protected routes
// /register supports bootstrap (when 0 users exist) or authorized user registration (Bearer token required)
router.post('/register', optionalProtect, register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.get('/registration-permissions', protect, getRegistrationPermissions);
router.post('/telegram/link-code', protect, getTelegramLinkCode);
router.post('/telegram/unlink', protect, unlinkTelegram);

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

