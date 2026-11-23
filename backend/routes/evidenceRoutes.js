import express from 'express';
import {
  getEvidenceByEntity,
  addAttachment,
  reviewAttachment,
  deleteAttachment,
  addNote,
  deleteNote,
  listEvidence
} from '../controllers/evidenceController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { upload, setUploadCategory } from '../middleware/uploadMiddleware.js';
import { MANAGEMENT_ROLES } from '../constants/roles.js';

const router = express.Router();

// All evidence routes require authentication
router.use(protect);

/**
 * @route   GET /api/evidence
 * @desc    List all evidence records with optional filtering (status, entityType, entityOwner)
 * @access  Private (Management/HR)
 */
router.get('/', authorizeRoles(...MANAGEMENT_ROLES), listEvidence);

/**
 * @route   GET /api/evidence/:entityType/:entityId
 * @desc    Get the evidence document and all attachments/notes for a specific entity
 * @access  Private
 */
router.get('/:entityType/:entityId', getEvidenceByEntity);

/**
 * @route   POST /api/evidence/:entityType/:entityId/attachments
 * @desc    Upload & add an attachment to an entity's evidence document
 * @access  Private
 */
router.post(
  '/:entityType/:entityId/attachments',
  setUploadCategory('evidence'),
  upload.any(),
  addAttachment
);

/**
 * @route   PATCH /api/evidence/:entityType/:entityId/attachments/:attachmentId/review
 * @desc    Review (verify or reject) an individual attachment
 * @access  Private (Management/HR only)
 */
router.patch(
  '/:entityType/:entityId/attachments/:attachmentId/review',
  authorizeRoles(...MANAGEMENT_ROLES),
  reviewAttachment
);

/**
 * @route   DELETE /api/evidence/:entityType/:entityId/attachments/:attachmentId
 * @desc    Delete an attachment (uploader or management)
 * @access  Private
 */
router.delete('/:entityType/:entityId/attachments/:attachmentId', deleteAttachment);

/**
 * @route   POST /api/evidence/:entityType/:entityId/notes
 * @desc    Add a note/comment to an entity's evidence document
 * @access  Private
 */
router.post('/:entityType/:entityId/notes', addNote);

/**
 * @route   DELETE /api/evidence/:entityType/:entityId/notes/:noteId
 * @desc    Delete a note (author or management)
 * @access  Private
 */
router.delete('/:entityType/:entityId/notes/:noteId', deleteNote);

export default router;
