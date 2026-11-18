import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import overtimeRoutes from './routes/overtimeRoutes.js';
import fieldVisitRoutes from './routes/fieldVisitRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import recruitmentRoutes from './routes/recruitmentRoutes.js';
import internshipRoutes from './routes/internshipRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import evidenceRoutes from './routes/evidenceRoutes.js';
import clearanceRoutes from './routes/clearanceRoutes.js';
import { initTelegramBot } from './utils/telegramService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);

// Serve static uploaded files from backend/uploads
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/field-visits', fieldVisitRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/clearances', clearanceRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Vector Advert Full ERP - HR Backend API is running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // Initialize Telegram Bot if configured
  initTelegramBot();
});
