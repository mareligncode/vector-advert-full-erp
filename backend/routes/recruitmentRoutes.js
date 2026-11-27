import express from 'express';
import {
  getJobPostings,
  getJobPostingById,
  createJobPosting,
  updateJobPosting,
  updateJobPostingStatus,
  deleteJobPosting
} from '../controllers/jobPostingController.js';
import {
  submitJobApplication,
  getJobApplications,
  getJobApplicationById,
  updateApplicationStatus,
  convertApplicantToEmployee,
  deleteJobApplication,
  addApplicationAttachment,
  removeApplicationAttachment
} from '../controllers/jobApplicationController.js';
import {
  scheduleInterview,
  getAllInterviews,
  updateInterview,
  submitInterviewFeedback,
  deleteInterview,
  addInterviewAttachment
} from '../controllers/interviewController.js';
import { protect, optionalProtect, authorizeRoles } from '../middleware/authMiddleware.js';
import { HR_ADMIN_ROLES, MANAGEMENT_ROLES, EXECUTIVE_ROLES } from '../constants/roles.js';
import { upload, setUploadCategory } from '../middleware/uploadMiddleware.js';

const router = express.Router();

/* ==========================================================================
   1. JOB POSTINGS ROUTES
   ========================================================================== */
router
  .route('/jobs')
  .get(optionalProtect, getJobPostings)
  .post(protect, authorizeRoles(...HR_ADMIN_ROLES), createJobPosting);

router
  .route('/jobs/:id')
  .get(optionalProtect, getJobPostingById)
  .put(protect, authorizeRoles(...HR_ADMIN_ROLES), updateJobPosting)
  .delete(protect, authorizeRoles(...HR_ADMIN_ROLES), deleteJobPosting);

router.patch(
  '/jobs/:id/status',
  protect,
  authorizeRoles(...HR_ADMIN_ROLES),
  updateJobPostingStatus
);

/* ==========================================================================
   2. INTERVIEWS (Across Candidates - Calendar / Dashboard)
   ========================================================================== */
router.get(
  '/interviews',
  protect,
  authorizeRoles(...HR_ADMIN_ROLES),
  getAllInterviews
);

/* ==========================================================================
   3. JOB APPLICATIONS & TRACKING ROUTES
   ========================================================================== */
router
  .route('/applications')
  .post(
    setUploadCategory('recruitment'),
    upload.any(),
    submitJobApplication
  ) // Public job application portal (supports multiple documents)
  .get(protect, authorizeRoles(...HR_ADMIN_ROLES), getJobApplications);

router
  .route('/applications/:id')
  .get(protect, authorizeRoles(...HR_ADMIN_ROLES), getJobApplicationById)
  .delete(protect, authorizeRoles(...HR_ADMIN_ROLES), deleteJobApplication);

router.patch(
  '/applications/:id/status',
  protect,
  authorizeRoles(...HR_ADMIN_ROLES),
  updateApplicationStatus
);

// Multiple attachments endpoints (Add one file after another via Add button)
router
  .route('/applications/:id/attachments')
  .post(
    optionalProtect,
    setUploadCategory('recruitment'),
    upload.single('file'),
    addApplicationAttachment
  );

router
  .route('/applications/:id/attachments/:attachmentId')
  .delete(protect, authorizeRoles(...MANAGEMENT_ROLES), removeApplicationAttachment);

router.post(
  '/applications/:id/convert-to-employee',
  protect,
  authorizeRoles(...HR_ADMIN_ROLES),
  convertApplicantToEmployee
);

/* ==========================================================================
   4. APPLICANT INTERVIEW SCHEDULE & EVALUATION
   ========================================================================== */
router.post(
  '/applications/:id/interviews',
  protect,
  authorizeRoles(...MANAGEMENT_ROLES),
  scheduleInterview
);

router
  .route('/applications/:applicationId/interviews/:interviewId')
  .put(protect, authorizeRoles(...MANAGEMENT_ROLES), updateInterview)
  .delete(protect, authorizeRoles(...HR_ADMIN_ROLES), deleteInterview);

router.patch(
  '/applications/:applicationId/interviews/:interviewId/feedback',
  protect,
  authorizeRoles(...MANAGEMENT_ROLES),
  submitInterviewFeedback
);

router.post(
  '/applications/:applicationId/interviews/:interviewId/attachments',
  protect,
  authorizeRoles(...MANAGEMENT_ROLES),
  setUploadCategory('interviews'),
  upload.single('file'),
  addInterviewAttachment
);

export default router;
