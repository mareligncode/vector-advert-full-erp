import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root uploads directory: backend/uploads
export const uploadRootDir = path.resolve(__dirname, '../uploads');

/**
 * Safely delete a locally stored file given its URL (e.g. /uploads/employees/avatar.png)
 * @param {string} fileUrl
 */
export const deleteLocalFile = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  try {
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
 * Helper to generate relative static URL for an uploaded file
 * @param {string} category 
 * @param {string} filename 
 * @returns {string} e.g. /uploads/employees/filename.png
 */
export const formatFileUrl = (category, filename) => {
  return `/uploads/${category || 'attachments'}/${filename}`;
};
