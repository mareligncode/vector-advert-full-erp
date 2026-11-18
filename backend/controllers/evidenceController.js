import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Evidence from '../models/Evidence.js';
import { MANAGEMENT_ROLES } from '../constants/roles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRootDir = path.resolve(__dirname, '../uploads');

/**
 * Check if user has management privileges
 */
const isPrivileged = (user, allowedRoles = MANAGEMENT_ROLES) => {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((r) => allowedRoles.includes(r));
};

/**
 * Helper to safely delete file from local storage
 */
const deleteLocalFile = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  try {
    // fileUrl is like /uploads/evidence/filename.jpg
    const relativePart = fileUrl.replace(/^\/uploads\//, '');
    const fullPath = path.join(uploadRootDir, relativePart);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error('Failed to delete local file:', err.message);
  }
};

/**
 * Helper to infer entity owner from parent record
 */
const inferEntityOwner = async (entityType, entityId, fallbackUserId) => {
  try {
    if (!mongoose.modelNames().includes(entityType)) {
      return fallbackUserId;
    }
    const Model = mongoose.model(entityType);
    const parentEntity = await Model.findById(entityId);
    if (!parentEntity) return fallbackUserId;

    if (parentEntity.user) return parentEntity.user;
    if (parentEntity.createdBy) return parentEntity.createdBy;
    if (parentEntity.employee) {
      if (mongoose.modelNames().includes('Employee')) {
        const Employee = mongoose.model('Employee');
        const emp = await Employee.findById(parentEntity.employee);
        if (emp && emp.user) return emp.user;
      }
    }
  } catch (e) {
    // ignore inspection error
  }
  return fallbackUserId;
};

/**
 * @desc    Get evidence document for a specific entity
 * @route   GET /api/evidence/:entityType/:entityId
 * @access  Private
 */
export const getEvidenceByEntity = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entityId format'
      });
    }

    let evidence = await Evidence.findOne({ entityType, entityId })
      .populate('entityOwner', 'email roles')
      .populate('attachments.uploadedBy', 'email roles')
      .populate('attachments.reviewedBy', 'email roles')
      .populate('notes.author', 'email roles');

    if (!evidence) {
      return res.status(200).json({
        success: true,
        data: null,
        message: `No evidence recorded yet for ${entityType} ${entityId}`
      });
    }

    // Populate the dynamic entity itself if registered
    if (mongoose.modelNames().includes(entityType)) {
      await evidence.populate('entityId');
    }

    return res.status(200).json({
      success: true,
      data: evidence
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve evidence',
      error: error.message
    });
  }
};

/**
 * @desc    Add attachment to an entity's evidence document (Upserts doc if needed)
 * @route   POST /api/evidence/:entityType/:entityId/attachments
 * @access  Private
 */
export const addAttachment = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { title, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entityId format'
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Attachment title is required'
      });
    }

    // Check if file was uploaded via multipart or passed via body
    let fileUrl = req.body.fileUrl;
    let fileName = req.body.fileName;
    let mimeType = req.body.mimeType;
    let fileSize = req.body.fileSize;

    if (req.file) {
      const category = req.uploadCategory || 'evidence';
      fileUrl = `/uploads/${category}/${req.file.filename}`;
      fileName = req.file.originalname;
      mimeType = req.file.mimetype;
      fileSize = req.file.size;
    }

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File or fileUrl is required'
      });
    }

    // Determine entityOwner
    const entityOwner = req.body.entityOwner || (await inferEntityOwner(entityType, entityId, req.user._id));

    const newAttachment = {
      title: title.trim(),
      description: description ? description.trim() : '',
      fileUrl,
      fileName,
      mimeType,
      fileSize,
      uploadedBy: req.user._id,
      status: 'pending'
    };

    const evidence = await Evidence.findOneAndUpdate(
      { entityType, entityId },
      {
        $setOnInsert: {
          entityType,
          entityId,
          entityOwner
        },
        $push: { attachments: newAttachment }
      },
      {
        upsert: true,
        returnDocument: 'after',
        runValidators: true
      }
    )
      .populate('entityOwner', 'email roles')
      .populate('attachments.uploadedBy', 'email roles')
      .populate('attachments.reviewedBy', 'email roles');

    return res.status(201).json({
      success: true,
      message: 'Attachment added successfully',
      data: evidence
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add attachment',
      error: error.message
    });
  }
};

/**
 * @desc    Review / Verify / Reject an attachment
 * @route   PATCH /api/evidence/:entityType/:entityId/attachments/:attachmentId/review
 * @access  Private (Management / HR)
 */
export const reviewAttachment = async (req, res) => {
  try {
    const { entityType, entityId, attachmentId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'verified', 'rejected', or 'pending'"
      });
    }

    if (status === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when rejecting an attachment'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attachmentId format'
      });
    }

    const evidence = await Evidence.findOne({
      entityType,
      entityId,
      'attachments._id': attachmentId
    });

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence document or attachment not found'
      });
    }

    const isPendingReset = status === 'pending';
    const updatedEvidence = await Evidence.findOneAndUpdate(
      {
        entityType,
        entityId,
        'attachments._id': attachmentId
      },
      {
        $set: {
          'attachments.$.status': status,
          'attachments.$.reviewedBy': isPendingReset ? null : req.user._id,
          'attachments.$.reviewedAt': isPendingReset ? null : new Date(),
          'attachments.$.rejectionReason': status === 'rejected' ? rejectionReason.trim() : null
        }
      },
      {
        returnDocument: 'after'
      }
    )
      .populate('entityOwner', 'email roles')
      .populate('attachments.uploadedBy', 'email roles')
      .populate('attachments.reviewedBy', 'email roles');

    return res.status(200).json({
      success: true,
      message: `Attachment status updated to ${status}`,
      data: updatedEvidence
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to review attachment',
      error: error.message
    });
  }
};

/**
 * @desc    Delete an attachment from evidence
 * @route   DELETE /api/evidence/:entityType/:entityId/attachments/:attachmentId
 * @access  Private (Uploader or Management)
 */
export const deleteAttachment = async (req, res) => {
  try {
    const { entityType, entityId, attachmentId } = req.params;

    const evidence = await Evidence.findOne({
      entityType,
      entityId,
      'attachments._id': attachmentId
    });

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    const attachment = evidence.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Permission check: only uploader or privileged management user can delete
    const isUploader = attachment.uploadedBy.toString() === req.user._id.toString();
    if (!isUploader && !isPrivileged(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this attachment'
      });
    }

    // Remove local file
    deleteLocalFile(attachment.fileUrl);

    // Pull attachment from array
    evidence.attachments.pull({ _id: attachmentId });
    await evidence.save();

    return res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
      data: evidence
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
      error: error.message
    });
  }
};

/**
 * @desc    Add note to evidence
 * @route   POST /api/evidence/:entityType/:entityId/notes
 * @access  Private
 */
export const addNote = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    // Determine entityOwner
    const entityOwner = req.body.entityOwner || (await inferEntityOwner(entityType, entityId, req.user._id));

    const newNote = {
      content: content.trim(),
      author: req.user._id
    };

    const evidence = await Evidence.findOneAndUpdate(
      { entityType, entityId },
      {
        $setOnInsert: {
          entityType,
          entityId,
          entityOwner
        },
        $push: { notes: newNote }
      },
      {
        upsert: true,
        returnDocument: 'after',
        runValidators: true
      }
    )
      .populate('entityOwner', 'email roles')
      .populate('notes.author', 'email roles');

    return res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: evidence
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
};

/**
 * @desc    Delete note from evidence
 * @route   DELETE /api/evidence/:entityType/:entityId/notes/:noteId
 * @access  Private (Author or Management)
 */
export const deleteNote = async (req, res) => {
  try {
    const { entityType, entityId, noteId } = req.params;

    const evidence = await Evidence.findOne({
      entityType,
      entityId,
      'notes._id': noteId
    });

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const note = evidence.notes.id(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Permission check: only author or privileged user can delete
    const isAuthor = note.author.toString() === req.user._id.toString();
    if (!isAuthor && !isPrivileged(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this note'
      });
    }

    evidence.notes.pull({ _id: noteId });
    await evidence.save();

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
      data: evidence
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error.message
    });
  }
};

/**
 * @desc    List all evidence with optional filters (status, entityType, entityOwner)
 * @route   GET /api/evidence
 * @access  Private (Management/HR)
 */
export const listEvidence = async (req, res) => {
  try {
    const {
      entityType,
      entityOwner,
      status, // 'pending', 'verified', 'rejected'
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (entityType) {
      query.entityType = entityType;
    }

    if (entityOwner && mongoose.Types.ObjectId.isValid(entityOwner)) {
      query.entityOwner = entityOwner;
    }

    if (status) {
      query['attachments.status'] = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Evidence.countDocuments(query);
    const evidenceList = await Evidence.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('entityOwner', 'email roles')
      .populate('attachments.uploadedBy', 'email roles')
      .populate('attachments.reviewedBy', 'email roles');

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      count: evidenceList.length,
      data: evidenceList
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to list evidence',
      error: error.message
    });
  }
};
