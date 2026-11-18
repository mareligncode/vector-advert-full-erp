import express from 'express';
import {
  getAttendanceConfig,
  updateAttendanceConfig,
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getAllAttendance,
  getAttendanceSummary,
  manualAttendanceUpdate
} from '../controllers/attendanceController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { HR_ADMIN_ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';
import { upload, setUploadCategory } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All attendance routes are protected
router.use(protect);

// Attendance Configuration & Shifts
router
  .route('/config')
  .get(getAttendanceConfig)
  .put(authorizeRoles(...HR_ADMIN_ROLES), updateAttendanceConfig);

// Employee Check-In / Check-Out
router.post('/check-in', setUploadCategory('attendance'), upload.single('selfie'), checkIn);
router.post('/check-out', setUploadCategory('attendance'), upload.single('selfie'), checkOut);

// Self-Service Queries
router.get('/today', getTodayAttendance);
router.get('/me', getMyAttendance);
router.get('/summary', getAttendanceSummary);

// Management / HR Operations
router.get('/', authorizeRoles(...MANAGEMENT_ROLES), getAllAttendance);
router.put('/:id', authorizeRoles(...HR_ADMIN_ROLES), manualAttendanceUpdate);

export default router;
