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
import professionalUpgradeRoutes from './routes/professionalUpgradeRoutes.js';
import trainingRoutes from './routes/trainingRoutes.js';
import planRoutes from './routes/planRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import grvRoutes from './routes/grvRoutes.js';
import storeRequestRoutes from './routes/storeRequestRoutes.js';
import procurementRoutes from './routes/procurementRoutes.js';
import supplierCreditRoutes from './routes/supplierCreditRoutes.js';
import crmRoutes, {
  leadRoutes,
  clientRoutes,
  followUpRoutes,
  siteSurveyRoutes
} from './routes/crmRoutes.js';
import orderDesignRoutes, {
  clientOrderRoutes,
  designTaskRoutes,
  designProofRoutes
} from './routes/orderDesignRoutes.js';
import billingCreditRoutes, {
  invoiceRoutes,
  paymentCollectionRoutes,
  customerCreditRoutes
} from './routes/billingCreditRoutes.js';
import productionRoutes, {
  jobOrderRoutes,
  productionMachineRoutes,
  productionRequestRoutes
} from './routes/productionRoutes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';
import swaggerUiOptions from './docs/swaggerUiOptions.js';
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
app.use('/api/professional-upgrades', professionalUpgradeRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/grv', grvRoutes);
app.use('/api/store-requests', storeRequestRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/supplier-credits', supplierCreditRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/site-surveys', siteSurveyRoutes);
app.use('/api/orders-design', orderDesignRoutes);
app.use('/api/client-orders', clientOrderRoutes);
app.use('/api/design-tasks', designTaskRoutes);
app.use('/api/design-proofs', designProofRoutes);
app.use('/api/billing-credit', billingCreditRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payment-collections', paymentCollectionRoutes);
app.use('/api/customer-credit', customerCreditRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/job-orders', jobOrderRoutes);
app.use('/api/production-machines', productionMachineRoutes);
app.use('/api/production-requests', productionRequestRoutes);

// OpenAPI JSON spec and interactive Swagger UI
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions)
);

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Vector Advert Full ERP - HR Backend API is running',
    version: '1.0.0',
    docsUrl: '/api-docs',
    openApiSpecUrl: '/api-docs.json'
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
