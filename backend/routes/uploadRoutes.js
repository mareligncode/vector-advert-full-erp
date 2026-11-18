import express from 'express';
import { upload, setUploadCategory } from '../middleware/uploadMiddleware.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @desc    Upload single file (used when user selects a file)
 * @route   POST /api/upload/single
 * @access  Public or Protected depending on context
 */
router.post(
  '/single',
  (req, res, next) => {
    // Determine category from query or default to general attachments
    req.uploadCategory = req.query.category || 'attachments';
    next();
  },
  upload.single('file'),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      // Convert path relative for URL serving
      const relativePath = `/uploads/${req.uploadCategory}/${req.file.filename}`;

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileUrl: relativePath,
          fileType: req.file.mimetype,
          fileSize: req.file.size
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: error.message
      });
    }
  }
);

/**
 * @desc    Upload multiple files at once
 * @route   POST /api/upload/multiple
 * @access  Public or Protected
 */
router.post(
  '/multiple',
  (req, res, next) => {
    req.uploadCategory = req.query.category || 'attachments';
    next();
  },
  upload.array('files', 10), // Up to 10 files per batch
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      const uploadedList = req.files.map((file) => ({
        fileName: file.filename,
        originalName: file.originalname,
        fileUrl: `/uploads/${req.uploadCategory}/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size
      }));

      res.status(200).json({
        success: true,
        message: `${uploadedList.length} files uploaded successfully`,
        data: uploadedList
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Multiple files upload failed',
        error: error.message
      });
    }
  }
);

export default router;
