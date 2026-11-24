import mongoose from 'mongoose';
import Evidence from '../models/Evidence.js';
import { formatFileUrl } from './fileUtils.js';

/**
 * Attach one or more files to the universal Evidence table for any entity
 * Supports both multer req.files array and plain attachment objects
 *
 * @param {Object} params
 * @param {string} params.entityType - e.g. 'GoodsReceivedVoucher', 'PurchaseOrder', 'StockItem', etc.
 * @param {ObjectId|string} params.entityId - ID of the target record
 * @param {Array} params.files - Express multer files array OR array of { fileUrl, fileName, title, mimeType, fileSize }
 * @param {Object} params.user - Current authenticated user (req.user)
 * @param {string} [params.title] - Default title for the attachments
 * @param {string} [params.description] - Description of the attachment
 * @param {string} [params.note] - Optional audit commentary note
 * @param {ClientSession} [params.session] - Optional Mongoose session for transactions
 * @returns {Promise<Evidence>} Updated or newly created Evidence document
 */
export async function attachFilesToEvidence({
  entityType,
  entityId,
  files = [],
  user,
  title = 'Document Attachment',
  description = '',
  note = '',
  session = null
}) {
  if (!entityType || !entityId || !files || files.length === 0) {
    return null;
  }

  const opts = session ? { session } : {};

  let evidence = await Evidence.findOne({ entityType, entityId }).session(session);

  if (!evidence) {
    evidence = new Evidence({
      entityType,
      entityId,
      entityOwner: user?._id,
      attachments: [],
      notes: []
    });
  }

  for (const file of files) {
    let fileUrl = file.fileUrl;
    let fileName = file.fileName || file.originalname || 'attachment';
    let mimeType = file.mimeType || file.mimetype || 'application/octet-stream';
    let fileSize = file.fileSize || file.size || 0;
    let itemTitle = file.title || title || fileName;

    if (!fileUrl && file.filename) {
      fileUrl = formatFileUrl(file.filename);
    }

    if (!fileUrl) continue;

    evidence.attachments.push({
      title: itemTitle,
      description: file.description || description || '',
      fileUrl,
      fileName,
      mimeType,
      fileSize,
      uploadedBy: user?._id,
      status: 'verified',
      reviewedBy: user?._id,
      reviewedAt: new Date()
    });
  }

  if (note && note.trim()) {
    evidence.notes.push({
      content: note.trim(),
      author: user?._id
    });
  }

  await evidence.save(opts);
  return evidence;
}

/**
 * Helper to fetch the Evidence document (and its attachments) for any entity
 */
export async function getEvidenceForEntity(entityType, entityId) {
  if (!entityType || !entityId) return null;
  return await Evidence.findOne({ entityType, entityId })
    .populate('attachments.uploadedBy', 'email')
    .populate('attachments.reviewedBy', 'email')
    .populate('notes.author', 'email')
    .lean();
}
