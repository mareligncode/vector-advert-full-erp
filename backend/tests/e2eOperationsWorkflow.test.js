import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import all operational routes
import authRoutes from '../routes/authRoutes.js';
import crmRoutes, { leadRoutes, clientRoutes, siteSurveyRoutes } from '../routes/crmRoutes.js';
import orderDesignRoutes, {
  clientOrderRoutes,
  designTaskRoutes,
  designProofRoutes
} from '../routes/orderDesignRoutes.js';
import billingCreditRoutes, {
  invoiceRoutes,
  paymentCollectionRoutes,
  customerCreditRoutes
} from '../routes/billingCreditRoutes.js';
import productionRoutes, {
  jobOrderRoutes,
  productionMachineRoutes,
  productionRequestRoutes
} from '../routes/productionRoutes.js';
import productionWastageRoutes from '../routes/productionWastageRoutes.js';
import siteInstallationRoutes from '../routes/installationRoutes.js';
import machineMaintenanceRoutes, { repairRouter as machineRepairRoutes } from '../routes/machineMaintenanceRoutes.js';
import feedbackRouter, { complaintRouter, warrantyRouter } from '../routes/postSalesRoutes.js';

// Import models
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import SiteSurvey from '../models/SiteSurvey.js';
import ClientOrder from '../models/ClientOrder.js';
import DesignTask from '../models/DesignTask.js';
import DesignProof from '../models/DesignProof.js';
import Invoice from '../models/Invoice.js';
import PaymentCollection from '../models/PaymentCollection.js';
import JobOrder from '../models/JobOrder.js';
import ProductionMachine from '../models/ProductionMachine.js';
import StockItem from '../models/StockItem.js';
import SiteInstallation from '../models/SiteInstallation.js';
import CustomerFeedback from '../models/CustomerFeedback.js';
import CustomerComplaint from '../models/CustomerComplaint.js';
import WarrantyClaim from '../models/WarrantyClaim.js';
import StaffRequest from '../models/StaffRequest.js';

import { generateToken } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { runAllOperationsCrons } from '../scripts/operationsCron.js';

dotenv.config();

const PORT = 5104;
const BASE_URL = `http://localhost:${PORT}`;

async function runE2EWorkflow() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  VECTOR ADVERT ERP — FULL LIFECYCLE E2E OPERATIONS WORKFLOW TEST');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp_test';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB test database');

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Mount identical to server.js
  app.use('/api/auth', authRoutes);
  app.use('/api/crm', crmRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/clients', clientRoutes);
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
  app.use('/api/production-wastage', productionWastageRoutes);

  app.use('/api/site-installations', siteInstallationRoutes);
  app.use('/api/machine-maintenance', machineMaintenanceRoutes);
  app.use('/api/machine-repairs', machineRepairRoutes);

  app.use('/api/customer-feedback', feedbackRouter);
  app.use('/api/customer-complaints', complaintRouter);
  app.use('/api/warranty-claims', warrantyRouter);

  app.use((err, req, res, next) => {
    console.error('Test Server Error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  const server = app.listen(PORT, () => {
    console.log(`E2E Test Server listening on ${BASE_URL}\n`);
  });

  try {
    // -------------------------------------------------------------
    // Step 0: Clean Seeding & Multi-Role User Setup
    // -------------------------------------------------------------
    console.log('--- Step 0: Seeding Clean Multi-Department Actors ---');
    await Promise.all([
      User.deleteMany({ email: { $regex: /@e2etest\.vector/ } }),
      Employee.deleteMany({ email: { $regex: /@e2etest\.vector/ } }),
      Lead.deleteMany({ 'phone.primary': '+251911990011' }),
      Client.deleteMany({ clientCode: 'CL-E2E-001' }),
      ClientOrder.deleteMany({ orderNumber: 'ORD-2026-E2E-01' }),
      JobOrder.deleteMany({ jobOrderNumber: 'JOB-2026-E2E-01' }),
      ProductionMachine.deleteMany({ machineCode: 'CNC-2026-E2E-01' }),
      StockItem.deleteMany({ code: { $in: ['STK-E2E-ACR', 'STK-E2E-TRF'] } }),
      SiteInstallation.deleteMany({ jobOrderNumber: 'JOB-2026-E2E-01' }),
      CustomerFeedback.deleteMany({ feedbackCode: { $regex: /FDB-.*E2E/ } }),
      WarrantyClaim.deleteMany({ claimCode: { $regex: /CLM-.*E2E/ } }),
      StaffRequest.deleteMany({ requestCode: { $regex: /WREQ-/ } })
    ]);

    const salesEmp = await Employee.create({
      employeeNumber: 'EMP-E2E-SALES',
      name: { first: 'Almaz', last: 'Ayana' },
      email: 'almaz@e2etest.vector',
      primaryPhone: '+251911990001',
      position: 'Senior Enterprise Sales Representative',
      department: new mongoose.Types.ObjectId(),
      employmentStatus: 'active',
      hireDate: new Date()
    });

    const designerEmp = await Employee.create({
      employeeNumber: 'EMP-E2E-DES',
      name: { first: 'Dawit', last: 'Girma' },
      email: 'dawit@e2etest.vector',
      primaryPhone: '+251911990002',
      position: 'Senior 3D Signage CAD/CAM Engineer',
      department: new mongoose.Types.ObjectId(),
      employmentStatus: 'active',
      hireDate: new Date()
    });

    const financeEmp = await Employee.create({
      employeeNumber: 'EMP-E2E-FIN',
      name: { first: 'Selam', last: 'Tilahun' },
      email: 'selam@e2etest.vector',
      primaryPhone: '+251911990003',
      position: 'Chief Financial Officer & Credit Controller',
      department: new mongoose.Types.ObjectId(),
      employmentStatus: 'active',
      hireDate: new Date()
    });

    const plantDirectorEmp = await Employee.create({
      employeeNumber: 'EMP-E2E-DIR',
      name: { first: 'Kassahun', last: 'Belay' },
      email: 'kassahun@e2etest.vector',
      primaryPhone: '+251911990004',
      position: 'Plant Operations Director & COO',
      department: new mongoose.Types.ObjectId(),
      employmentStatus: 'active',
      hireDate: new Date()
    });

    const salesUser = await User.create({
      name: 'Almaz Ayana (Sales)',
      email: 'sales@e2etest.vector',
      password: 'Password123!',
      roles: [ROLES.FRONTDESK, ROLES.EMPLOYEE],
      accountStatus: 'active',
      employeeId: salesEmp._id
    });

    const designerUser = await User.create({
      name: 'Dawit Girma (Designer)',
      email: 'designer@e2etest.vector',
      password: 'Password123!',
      roles: [ROLES.DESIGNER],
      accountStatus: 'active',
      employeeId: designerEmp._id
    });

    const financeUser = await User.create({
      name: 'Selam Tilahun (Finance)',
      email: 'finance@e2etest.vector',
      password: 'Password123!',
      roles: [ROLES.FINANCE, ROLES.MANAGER],
      accountStatus: 'active',
      employeeId: financeEmp._id
    });

    const managerUser = await User.create({
      name: 'Kassahun Belay (Plant Director)',
      email: 'kassahun@e2etest.vector',
      password: 'Password123!',
      roles: [ROLES.MANAGER, ROLES.COO, ROLES.SUPER_ADMIN],
      accountStatus: 'active',
      employeeId: plantDirectorEmp._id
    });

    const salesToken = generateToken(salesUser._id);
    const designerToken = generateToken(designerUser._id);
    const financeToken = generateToken(financeUser._id);
    const managerToken = generateToken(managerUser._id);

    console.log('✓ Enterprise actors authenticated (Sales, Design, Finance, Plant Director)\n');

    // -------------------------------------------------------------
    // Step 1: Pre-Sales CRM — Lead Capture & Technical Survey
    // -------------------------------------------------------------
    console.log('--- Step 1: Capture Lead, Schedule Survey & Convert to Client ---');
    const leadRes = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        name: 'Awash Bank HQ Facade Project',
        companyName: 'Awash International Bank SC',
        pointOfContact: {
          name: 'Mulugeta Assefa',
          jobTitle: 'VP Facility Management',
          isDecisionMaker: true
        },
        phone: {
          primary: '+251911990011'
        },
        email: 'facilities@awashbank.test',
        address: {
          city: 'Addis Ababa',
          subcity: 'Kirkos',
          specificLocation: 'Ras Abebe Aregay Street, Addis Ababa'
        },
        source: 'referral',
        manufacturingInterests: [
          {
            productCategory: '3d_channel_letters_acrylic',
            estimatedDimensions: { width: 10.0, height: 1.5, depth: 0.15, unit: 'meter' },
            illuminationType: 'front_and_back_lit',
            specificationsSummary: '3D Stainless Steel Warm Halo Channel Letters'
          }
        ],
        estimatedValue: {
          amount: 207000,
          currency: 'ETB',
          isFlexibleBudget: false
        },
        qualificationRating: 'hot'
      })
    });
    const leadData = await leadRes.json();
    if (leadRes.status !== 201) throw new Error(JSON.stringify(leadData));
    const leadId = leadData.data._id;
    console.log(`✓ Lead captured: ${leadData.data.leadNumber} (${leadData.data.companyName})`);

    // Technical Site Survey
    const surveyRes = await fetch(`${BASE_URL}/api/site-surveys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        targetEntity: {
          entityType: 'Lead',
          entityId: leadId,
          clientName: 'Awash International Bank'
        },
        surveyTitle: 'Awash Bank HQ Facade Feasibility Survey',
        assignedSurveyor: plantDirectorEmp._id,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        siteAddress: {
          city: 'Addis Ababa',
          subcity: 'Kirkos',
          specificLocation: 'Awash Towers Main Entrance Facade',
          gpsCoordinates: {
            latitude: 9.0105,
            longitude: 38.7495
          }
        },
        siteContactPerson: {
          name: 'Mulugeta Assefa',
          phone: '+251911990011'
        }
      })
    });
    const surveyData = await surveyRes.json();
    if (surveyRes.status !== 201) throw new Error(JSON.stringify(surveyData));
    const surveyId = surveyData.data._id;
    console.log(`✓ Technical survey scheduled: ${surveyData.data.surveyCode}`);

    // Complete Site Survey
    const completeSurveyRes = await fetch(`${BASE_URL}/api/site-surveys/${surveyId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        measurements: {
          facadeWidthMeters: 12.0,
          facadeHeightMeters: 3.5,
          installationHeightFromGround: 6.0,
          fasciaDepthCm: 30,
          viewingDistanceMeters: 40
        },
        wallSurfaceType: 'reinforced_concrete',
        wallConditionRating: 'sound_solid',
        electricalInspection: {
          powerSourceAvailable: true,
          powerSourceDistanceMeters: 8,
          supplyVoltage: '220V_single_phase',
          cableRoutingPath: 'surface_mounted_pvc_conduit',
          breakerDedicated: true,
          transformerMountingLocation: 'Plenum above entrance'
        },
        accessEquipmentRequired: 'scaffolding_tower',
        sketchesAndNotes: 'Reinforced concrete facade with standard 240V supply within 8m.'
      })
    });
    const completeSurveyData = await completeSurveyRes.json();
    if (completeSurveyRes.status !== 200) throw new Error(JSON.stringify(completeSurveyData));
    console.log('✓ On-site measurements and specs submitted');

    // Convert Lead to Verified Client
    const convertRes = await fetch(`${BASE_URL}/api/leads/${leadId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        clientCode: 'CL-E2E-001',
        legalName: 'Awash International Bank Share Company',
        displayName: 'Awash Bank S.C.',
        clientType: 'corporate',
        industry: 'banking_finance',
        primaryPhone: '+251911990011',
        taxIdentificationNumber: '0019283746'
      })
    });
    const convertData = await convertRes.json();
    if (convertRes.status !== 201) throw new Error(JSON.stringify(convertData));
    const client = convertData.data;
    console.log(`✓ Converted to Client: ${client.clientCode} (${client.displayName})\n`);

    // -------------------------------------------------------------
    // Step 2: Commercial Order & Design Pre-Press File Locking
    // -------------------------------------------------------------
    console.log('--- Step 2: Commercial Order & Design Pre-Press File Locking ---');
    const orderRes = await fetch(`${BASE_URL}/api/client-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        clientId: client._id,
        projectTitle: 'Awash Bank HQ Architectural 3D Stainless Letters & Logo',
        orderType: '3d_channel_letters_acrylic',
        priority: 'urgent',
        estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        salesAccountManager: salesEmp._id,
        fulfillmentMethod: 'on_site_installation',
        deliveryAddress: 'Ras Abebe Aregay Street, Addis Ababa',
        requestedItems: [
          {
            itemCode: 'ITEM-01',
            productCategory: '3d_channel_letters_acrylic',
            itemTitle: '3D Stainless Steel Warm Halo Channel Letters "AWASH BANK"',
            quantity: 1,
            unitPrice: 180000,
            totalPrice: 180000,
            dimensions: { widthCm: 1000, heightCm: 150, depthReturnCm: 15 }
          }
        ],
        commercial: {
          vatRatePercentage: 15,
          advanceDepositRequiredPercentage: 50
        }
      })
    });
    const orderData = await orderRes.json();
    if (orderRes.status !== 201) throw new Error(JSON.stringify(orderData));
    const order = orderData.data;
    console.log(`✓ Commercial Order created: ${order.orderNumber} (Contract: ${order.commercial.grandTotal} ETB)`);

    // Create Design Task via ClientOrder endpoint
    const taskRes = await fetch(`${BASE_URL}/api/client-orders/${order._id}/assign-design`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        assignedDesigner: designerEmp._id,
        briefTitle: 'Awash Bank HQ 3D Architectural Letters Pre-Press CAD',
        priority: 'urgent',
        targetCompletionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      })
    });
    const taskData = await taskRes.json();
    if (taskRes.status !== 201) throw new Error(JSON.stringify(taskData));
    const taskId = taskData.data._id;

    // Submit Design Proof V1
    const proofRes = await fetch(`${BASE_URL}/api/design-tasks/${taskId}/proofs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${designerToken}` },
      body: JSON.stringify({
        presentationMedia: {
          daylightMockupImageUrl: 'https://cdn.vector.et/proofs/awash_day.png',
          nightIlluminatedMockupImageUrl: 'https://cdn.vector.et/proofs/awash_night.png',
          technicalDrawingPdfUrl: 'https://cdn.vector.et/proofs/awash_drawing.pdf'
        },
        productionFiles: {
          cncLaserVectorCutUrl: 'https://cdn.vector.et/cad/awash_letters_1to1.dxf'
        },
        engineeringSpecs: {
          overallWidthCm: 1000,
          overallHeightCm: 150,
          returnDepthCm: 15,
          calculatedTotalLedModules: 220,
          calculatedTotalWattage: 264,
          recommendedPowerSupplyCapacityWatts: 350,
          transformerCount: 3
        }
      })
    });
    const proofData = await proofRes.json();
    if (proofRes.status !== 201) throw new Error(JSON.stringify(proofData));
    const proofId = proofData.data._id;

    // Record Client Formal Approval on Proof V1
    const approveProofRes = await fetch(`${BASE_URL}/api/design-proofs/${proofId}/client-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        isApproved: true,
        approverFullName: 'Mulugeta Assefa',
        approverJobTitle: 'VP Facility Management',
        approvalMethod: 'signed_proof_sheet_pdf',
        signatureImageUrl: 'https://cdn.vector.et/signatures/mulugeta_sig.png'
      })
    });
    const approveProofData = await approveProofRes.json();
    if (approveProofRes.status !== 200) throw new Error(JSON.stringify(approveProofData));

    // Lock Proof for Production Release
    const lockProofRes = await fetch(`${BASE_URL}/api/design-proofs/${proofId}/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` }
    });
    const lockProofData = await lockProofRes.json();
    if (lockProofRes.status !== 200) throw new Error(JSON.stringify(lockProofData));
    console.log('✓ Design Proof V1 client-approved & CAD locked for production cutting\n');

    // -------------------------------------------------------------
    // Step 3: Billing, Advance Payment & Financial Clearance
    // -------------------------------------------------------------
    console.log('--- Step 3: Billing, Advance Payment & Financial Clearance ---');
    const invRes = await fetch(`${BASE_URL}/api/invoices/from-order/${order._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${financeToken}` },
      body: JSON.stringify({
        invoiceType: 'proforma'
      })
    });
    const invData = await invRes.json();
    if (invRes.status !== 201) throw new Error(JSON.stringify(invData));
    const invoice = invData.data;
    console.log(`✓ Proforma Invoice generated: ${invoice.invoiceNumber}`);

    // Client transfers 50% deposit (103,500 ETB)
    const payRes = await fetch(`${BASE_URL}/api/payment-collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${financeToken}` },
      body: JSON.stringify({
        clientOrderId: order._id,
        invoiceId: invoice._id,
        receiptType: 'advance_deposit_upfront',
        paymentMethod: 'bank_transfer_cbe',
        amountPaidETB: 103500,
        destinationBankAccount: '1000123456789 (CBE Main)',
        electronicTransfer: {
          bankTransactionReference: 'TRX-AWASH-998877',
          mobileMoneyPayerPhone: '+251911990011'
        },
        collectedBy: financeEmp._id,
        notes: '50% advance deposit for Awash HQ 3D Letters'
      })
    });
    const payData = await payRes.json();
    if (payRes.status !== 201) throw new Error(JSON.stringify(payData));
    console.log(`✓ CRV Receipt issued: ${payData.data.receiptNumber} (Amount: 103,500 ETB)`);
    console.log('✓ Commercial Order financial clearance unlocked\n');

    // -------------------------------------------------------------
    // Step 4: Factory Production Release & Electrical QC Sign-Off
    // -------------------------------------------------------------
    console.log('--- Step 4: Factory Production Release & Electrical QC Sign-Off ---');
    const releaseRes = await fetch(`${BASE_URL}/api/job-orders/release/${order._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        workshopSupervisor: plantDirectorEmp._id,
        assignedCrew: [salesEmp._id, designerEmp._id],
        packagingType: 'wooden_crate'
      })
    });
    const releaseData = await releaseRes.json();
    if (!releaseRes.ok) throw new Error(`Release failed: ${JSON.stringify(releaseData)}`);
    const jobOrder = releaseData.data.jobOrder;
    console.log(`✓ JobOrder traveler released: ${jobOrder.jobOrderNumber}`);

    // Mark electrical and burn-in QC passed for delivery readiness
    await JobOrder.findByIdAndUpdate(jobOrder._id, {
      'workstationRouting.machineFabrication.status': 'completed',
      'workstationRouting.assemblyAndFinishing.status': 'completed',
      'workstationRouting.electricalAndQC.status': 'passed',
      'workstationRouting.electricalAndQC.insulationResistanceTestPassed': true,
      'workstationRouting.packagingAndDispatch.isPackaged': true,
      status: 'ready_for_dispatch'
    });
    console.log('✓ Factory electrical & 4-hour burn-in QC cleared (Status: ready_for_dispatch)\n');

    // -------------------------------------------------------------
    // Step 5: Field Logistics, Illumination Test & Digital Handover
    // -------------------------------------------------------------
    console.log('--- Step 5: Field Installation, Nighttime Illumination & Handover ---');
    const instRes = await fetch(`${BASE_URL}/api/site-installations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        jobOrderId: jobOrder._id,
        siteAddress: 'Ras Abebe Aregay Street, Addis Ababa',
        logistics: {
          transportVehicleType: 'flatbed_truck',
          vehicleLicensePlate: 'ET-3-99112',
          assignedDriver: plantDirectorEmp._id
        },
        accessEquipment: 'scaffolding_tower'
      })
    });
    const instData = await instRes.json();
    if (instRes.status !== 201) throw new Error(JSON.stringify(instData));
    const installation = instData.data;
    console.log(`✓ Installation scheduled: ${installation.installationCode}`);

    // Dispatch vehicle gate pass
    await fetch(`${BASE_URL}/api/site-installations/${installation._id}/dispatch`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ gatePassNumber: 'GP-2026-E2E-01' })
    });

    // Nighttime illumination test
    await fetch(`${BASE_URL}/api/site-installations/${installation._id}/night-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        illuminationUniformity: 'perfect_no_hotspots',
        luxReadingAverage: 380,
        measuredVoltageDropAtEndLetters: 0.12,
        totalPowerDrawWatts: 180
      })
    });

    // Client Digital Handover Sign-off
    const handoverRes = await fetch(`${BASE_URL}/api/site-installations/${installation._id}/handover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        condition: 'accepted_flawless',
        clientRepresentativeName: 'Mulugeta Assefa',
        clientRepresentativePhone: '+251911990011',
        clientDigitalSignatureUrl: 'https://cdn.vector.et/signatures/awash_handover.png'
      })
    });
    const handoverData = await handoverRes.json();
    if (handoverRes.status !== 200) throw new Error(JSON.stringify(handoverData));

    const activatedJob = handoverData.data.jobOrder;
    console.log(`✓ Client Handover Signed: condition = ${handoverData.data.installation.handoverCertificate.condition}`);
    console.log(`✓ Warranty activated: status = ${activatedJob.warranty.status}`);
    console.log(`✓ QR Code Deep Link: ${activatedJob.warranty.scannableQrCodeUrl}`);
    console.log(`✓ Transformers Expiration: ${activatedJob.warranty.expirationDeadlines.transformerExpiry}`);
    console.log(`✓ LEDs Expiration: ${activatedJob.warranty.expirationDeadlines.ledModulesExpiry}`);
    console.log(`✓ Structure Expiration: ${activatedJob.warranty.expirationDeadlines.structuralExpiry}\n`);

    // -------------------------------------------------------------
    // Step 6: Post-Sales Care — Feedback & Warranty Claim
    // -------------------------------------------------------------
    console.log('--- Step 6: Post-Sales Care — 5-Star Feedback & Warranty Claim ---');
    const feedbackRes = await fetch(`${BASE_URL}/api/customer-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        feedbackCode: 'FDB-2026-E2E-01',
        clientId: client._id,
        jobOrderId: jobOrder._id,
        ratings: { overallSatisfactionScore: 5 },
        npsScore: 10,
        clientRepresentativeName: 'Mulugeta Assefa',
        highlightQuoteForWebsite: 'World-class signage delivered flawlessly.'
      })
    });
    const feedbackData = await feedbackRes.json();
    if (feedbackRes.status !== 201) throw new Error(JSON.stringify(feedbackData));
    console.log(`✓ Feedback logged: NPS = ${feedbackData.data.feedback.npsCategory}`);

    // Verify valid warranty claim
    const claimRes = await fetch(`${BASE_URL}/api/warranty-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        claimCode: 'CLM-2026-E2E-01',
        jobOrderId: jobOrder._id,
        failedComponent: 'led_modules',
        defectDescription: 'Minor LED module flickering on letter B after heavy thunderstorm.'
      })
    });
    const claimData = await claimRes.json();
    if (claimRes.status !== 201) throw new Error(JSON.stringify(claimData));
    console.log(`✓ Warranty claim evaluated: ${claimData.data.warrantyClaim.determination} (Covered: ${claimData.data.warrantyClaim.isCoveredUnderActiveWarranty})\n`);

    // -------------------------------------------------------------
    // Step 7: Automation Crons Execution
    // -------------------------------------------------------------
    console.log('--- Step 7: Automation Crons Execution ---');
    const cronResults = await runAllOperationsCrons();
    console.log(`✓ Credit Aging: ${cronResults.creditAging.totalChecked} clients checked`);
    console.log(`✓ Machinery Interlock: ${cronResults.maintenanceInterlock.setOnHold} machines set to maintenance_hold`);
    console.log(`✓ Post-Install Survey Check: ${cronResults.feedbackSurvey.totalChecked} checked\n`);

    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('  🎉 ENTIRE END-TO-END OPERATIONAL LIFECYCLE PASSED 100% CLEANLY! 🎉');
    console.log('═══════════════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ E2E Operations Workflow Test Failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('MongoDB disconnected and E2E test server stopped');
  }
}

runE2EWorkflow();
