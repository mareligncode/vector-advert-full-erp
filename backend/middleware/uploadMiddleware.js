import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure base upload directory exists relative to backend
const uploadRootDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadRootDir)) {
  fs.mkdirSync(uploadRootDir, { recursive: true });
}

// Storage configuration with dynamic folder categorization
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Dynamic subfolder based on route or fieldname (e.g. 'recruitment', 'internships', 'employees', 'resumes')
    const category = req.uploadCategory || 'attachments';
    const targetDir = path.join(uploadRootDir, category);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // Sanitize and append timestamp + random suffix to prevent collisions
    const ext = path.extname(file.originalname);
    const basename = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// File filter (documents, images, pdfs, sheets, archives)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} is not supported for upload`), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max file size per file
  },
  fileFilter
});

// Helper middleware generator for setting category before upload
export const setUploadCategory = (category) => (req, res, next) => {
  req.uploadCategory = category;
  next();
};
export default upload;