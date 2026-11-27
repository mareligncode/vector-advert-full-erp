import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from '../routes/authRoutes.js';
import feedbackRouter, { complaintRouter, warrantyRouter } from '../routes/postSalesRoutes.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import JobOrder from '../models/JobOrder.js';
import StockItem from '../models/StockItem.js';
import CustomerFeedback from '../models/CustomerFeedback.js';
import CustomerComplaint from '../models/CustomerComplaint.js';
import WarrantyClaim from '../models/WarrantyClaim.js';
import StaffRequest from '../models/StaffRequest.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

dotenv.config();

const PORT = 5103;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🚀 Starting Customer Post-Sales Care & Warranty (Phase 8) Integration Tests...\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp_test';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB test database');

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/customer-feedback', feedbackRouter);
  app.use('/api/customer-complaints', complaintRouter);
  app.use('/api/warranty-claims', warrantyRouter);

  app.use((err, req, res, next) => {
    console.error('Test Server Error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  const server = app.listen(PORT, () => {
    console.log(`Test server running on ${BASE_URL}\n`);
  });

  let managerToken = '';
  let repToken = '';
  let managerUser = null;
  let repUser = null;
  let managerEmployee = null;
  let repEmployee = null;
  let testClient = null;
  let testJobOrder = null;
  let testStockItem = null;
  let approvedClaim = null;

  try {
    console.log('--- 0. Seeding Authentication, Employees, Client & JobOrder with Active Warranty ---');
    await Promise.all([
      User.deleteMany({ email: { $regex: /@p8test\.vector/ } }),
      Employee.deleteMany({ email: { $regex: /@p8test\.vector/ } }),
      Client.deleteMany({ clientCode: 'CL-P8-001' }),
      JobOrder.deleteMany({ jobOrderNumber: 'JOB-2026-P8-01' }),
      StockItem.deleteMany({ code: 'PART-P8-TRF' }),
      CustomerFeedback.deleteMany({ feedbackCode: { $regex: /FDB-.*P8/ } }),
      CustomerComplaint.deleteMany({ complaintCode: { $regex: /CMP-.*P8/ } }),
      WarrantyClaim.deleteMany({ claimCode: { $regex: /CLM-.*P8/ } }),
      StaffRequest.deleteMany({ requestCode: { $regex: /WREQ-/ } })
    ]);

    managerEmployee = await Employee.create({
      employeeNumber: 'EMP-P8-MGR',
      name: { first: 'Hanna', last: 'Kebede' },
      email: 'hanna@p8test.vector',
      primaryPhone: '+251911889900',
      department: new mongoose.Types.ObjectId(),
      position: 'Customer Success & Warranty Director',
      employmentStatus: 'active',
      hireDate: new Date()
    });

    repEmployee = await Employee.create({
      employeeNumber: 'EMP-P8-REP',
      name: { first: 'Binyam', last: 'Tadesse' },
      email: 'binyam@p8test.vector',
      primaryPhone: '+251911889911',
      department: new mongoose.Types.ObjectId(),
      position: 'Post-Sales Field Service Technician',
      employmentStatus: 'active',
      hireDate: new Date()
    });

    managerUser = await User.create({
      name: 'Hanna Kebede (CS Director)',
      email: 'hanna@p8test.vector',
      password: 'Password123!',
      roles: [ROLES.MANAGER, ROLES.COO],
      accountStatus: 'active',
      employeeId: managerEmployee._id
    });

    repUser = await User.create({
      name: 'Binyam Tadesse (Field Rep)',
      email: 'binyam@p8test.vector',
      password: 'Password123!',
      roles: [ROLES.EMPLOYEE],
      accountStatus: 'active',
      employeeId: repEmployee._id
    });

    managerToken = generateToken(managerUser._id);
    repToken = generateToken(repUser._id);

    // Create client
    testClient = await Client.create({
      clientCode: 'CL-P8-001',
      displayName: 'Dashen Bank S.C. (HQ)',
      legalName: 'Dashen Bank Share Company',
      clientType: 'corporate',
      industry: 'banking_finance',
      primaryPhone: '+251911332211',
      address: {
        country: 'Ethiopia',
        city: 'Addis Ababa',
        subcity: 'Kirkos',
        landmark: 'Dashen Bank HQ, Sudan Street'
      },
      accountManager: repEmployee._id,
      createdBy: managerUser._id
    });

    // Create active warranty dates
    const startDate = new Date();
    const transformerExpiry = new Date(startDate);
    transformerExpiry.setMonth(transformerExpiry.getMonth() + 12);
    const neonFlexExpiry = new Date(startDate);
    neonFlexExpiry.setMonth(neonFlexExpiry.getMonth() + 12);
    const ledModulesExpiry = new Date(startDate);
    ledModulesExpiry.setMonth(ledModulesExpiry.getMonth() + 24);
    const structuralExpiry = new Date(startDate);
    structuralExpiry.setMonth(structuralExpiry.getMonth() + 36);

    testJobOrder = await JobOrder.create({
      jobOrderNumber: 'JOB-2026-P8-01',
      orderId: new mongoose.Types.ObjectId(),
      clientId: testClient._id,
      approvedDesignProofId: new mongoose.Types.ObjectId(),
      projectTitle: 'Dashen Bank Sudan St. Illuminated 3D Lettering',
      signageType: '3d_metal_halo_lit',
      dimensions: { widthMeters: 8.5, heightMeters: 1.8 },
      status: 'installation_completed',
      priority: 'urgent',
      scheduledStartDate: startDate,
      targetCompletionDate: transformerExpiry,
      fulfillment: {
        deliveryMethod: 'on_site_installation'
      },
      workshopSupervisor: managerEmployee._id,
      authorizedBy: managerUser._id,
      warranty: {
        warrantyCertificateCode: 'WAR-2026-P8-01',
        status: 'active_under_warranty',
        warrantyStartDate: startDate,
        coverageDurationsMonths: {
          ledModulesMonths: 24,
          powerSupplyTransformerMonths: 12,
          siliconeNeonFlexMonths: 12,
          acrylicAndStructureMonths: 36
        },
        expirationDeadlines: {
          transformerExpiry,
          neonFlexExpiry,
          ledModulesExpiry,
          structuralExpiry
        },
        scannableQrCodeUrl: 'https://warranty.vector.et/verify/WAR-2026-P8-01',
        isVoided: false
      }
    });

    testStockItem = await StockItem.create({
      code: 'PART-P8-TRF',
      name: 'MeanWell 12V 200W IP67 Waterproof Power Supply',
      category: 'Electrical Components',
      unit: 'pcs',
      baseUnit: 'pcs',
      averageUnitCost: 1800,
      sellingPrice: 2200,
      stockStatus: 'in_stock'
    });

    console.log('✓ Users, employees, client, and jobOrder initialized with ACTIVE WARRANTY');
    console.log(`✓ JobOrder: ${testJobOrder.jobOrderNumber} (Warranty status: ${testJobOrder.warranty.status})`);
    console.log(`✓ Transformer Expiry: ${testJobOrder.warranty.expirationDeadlines.transformerExpiry.toISOString()}\n`);

    // --- Test 1: Submit 5-Star Customer Feedback (Promoter) ---
    console.log('--- Test 1: Submit 5-Star Customer Feedback (Promoter) ---');
    const promoterRes = await fetch(`${BASE_URL}/api/customer-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${repToken}`
      },
      body: JSON.stringify({
        feedbackCode: 'FDB-2026-P8-01',
        clientId: testClient._id,
        jobOrderId: testJobOrder._id,
        channel: 'in_person_handover',
        clientRepresentativeName: 'Tewodros Kassahun',
        clientRepresentativeTitle: 'General Services Director',
        ratings: {
          overallSatisfactionScore: 5,
          designFidelityRating: 5,
          illuminationBrightnessRating: 5,
          installationWorkmanshipRating: 5,
          timelinessDeliveryRating: 4,
          communicationStaffRating: 5
        },
        npsScore: 10,
        clientComments: 'The precision engineering on the stainless steel returns and uniform 3000K warm halo glow exceeded all executive board expectations.',
        highlightQuoteForWebsite: 'Vector Advert delivered exceptional architectural signage with flawless illumination.',
        allowPublicMarketingShowcase: true
      })
    });

    const promoterData = await promoterRes.json();
    console.log(`✓ 5-Star feedback status: ${promoterRes.status}`);
    if (promoterRes.status !== 201) throw new Error(promoterData.message);
    const feedback1 = promoterData.data.feedback;
    console.log(`✓ Feedback Code: ${feedback1.feedbackCode}`);
    console.log(`✓ NPS Category: ${feedback1.npsCategory}`);
    console.log(`✓ Requires Management Follow-Up: ${feedback1.requiresManagementFollowUp}`);
    if (feedback1.npsCategory !== 'promoter' || feedback1.requiresManagementFollowUp) {
      throw new Error('Expected promoter without management follow-up');
    }
    console.log('✓ 5-Star promoter feedback verified\n');

    // --- Test 2: Rating Validation Middleware ---
    console.log('--- Test 2: Rating Validation Middleware ---');
    const invalidRatingRes = await fetch(`${BASE_URL}/api/customer-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${repToken}`
      },
      body: JSON.stringify({
        clientId: testClient._id,
        jobOrderId: testJobOrder._id,
        ratings: {
          overallSatisfactionScore: 9 // Invalid: max is 5
        }
      })
    });

    const invalidRatingData = await invalidRatingRes.json();
    console.log(`✓ Invalid rating rejected with HTTP status: ${invalidRatingRes.status}`);
    console.log(`✓ Validation message: "${invalidRatingData.message}"`);
    if (invalidRatingRes.status !== 400) throw new Error('Expected 400 Bad Request');
    console.log('✓ Validation middleware verified\n');

    // --- Test 3: Submit 1-Star Detractor Feedback (Rule 3 Escalation) ---
    console.log('--- Test 3: Submit 1-Star Detractor Feedback & Automated Complaint (Rule 3) ---');
    const detractorRes = await fetch(`${BASE_URL}/api/customer-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${repToken}`
      },
      body: JSON.stringify({
        feedbackCode: 'FDB-2026-P8-02',
        clientId: testClient._id,
        jobOrderId: testJobOrder._id,
        channel: 'phone_interview',
        clientRepresentativeName: 'Tewodros Kassahun',
        clientRepresentativeTitle: 'General Services Director',
        ratings: {
          overallSatisfactionScore: 1,
          designFidelityRating: 2,
          illuminationBrightnessRating: 1,
          installationWorkmanshipRating: 2
        },
        npsScore: 1,
        clientComments: 'Critical issue: Main entrance letters 3 and 4 are flickering intermittently, and power supply emits burning odor.'
      })
    });

    const detractorData = await detractorRes.json();
    console.log(`✓ Detractor feedback status: ${detractorRes.status}`);
    if (detractorRes.status !== 201) throw new Error(detractorData.message);
    const feedback2 = detractorData.data.feedback;
    const autoComplaint = detractorData.data.autoGeneratedComplaint;

    console.log(`✓ Feedback Code: ${feedback2.feedbackCode}`);
    console.log(`✓ NPS Category: ${feedback2.npsCategory}`);
    console.log(`✓ Requires Management Follow-Up: ${feedback2.requiresManagementFollowUp}`);
    console.log(`✓ Auto-generated Complaint Code: ${autoComplaint?.complaintCode}`);
    console.log(`✓ Complaint Subject: "${autoComplaint?.complaintSubject}"`);
    console.log(`✓ Complaint Severity: ${autoComplaint?.severity}`);

    if (!feedback2.requiresManagementFollowUp) {
      throw new Error('Expected requiresManagementFollowUp to be true for detractor');
    }
    if (!autoComplaint || autoComplaint.severity !== 'high_safety_or_electrical') {
      throw new Error('Expected auto-generated high-priority complaint ticket');
    }
    console.log('✓ Rule 3 verified: Detractor feedback automatically spawned high-priority Complaint ticket\n');

    // --- Test 4: File Valid Warranty Claim (Within 12-Month Coverage) ---
    console.log('--- Test 4: File Valid Warranty Claim (Within Active Coverage Window) ---');
    const claimRes = await fetch(`${BASE_URL}/api/warranty-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        claimCode: 'CLM-2026-P8-01',
        jobOrderId: testJobOrder._id,
        failedComponent: 'power_supply_transformer',
        defectDescription: 'Transformer #2 failed due to internal primary winding short; no signs of external physical damage or water ingress.',
        componentsNeeded: [
          {
            stockItemId: testStockItem._id,
            itemName: 'MeanWell 12V 200W IP67 Waterproof Power Supply',
            quantity: 1
          }
        ]
      })
    });

    const claimData = await claimRes.json();
    console.log(`✓ Warranty claim status: ${claimRes.status}`);
    if (claimRes.status !== 201) throw new Error(claimData.message);
    approvedClaim = claimData.data.warrantyClaim;
    const staffReq = claimData.data.storeStaffRequest;

    console.log(`✓ Claim Code: ${approvedClaim.claimCode}`);
    console.log(`✓ Covered Under Warranty: ${approvedClaim.isCoveredUnderActiveWarranty}`);
    console.log(`✓ Determination: ${approvedClaim.determination}`);
    console.log(`✓ Claim Status: ${approvedClaim.status}`);
    console.log(`✓ Store StaffRequest Auto-Drafted: ${staffReq?.requestCode}`);

    if (!approvedClaim.isCoveredUnderActiveWarranty) {
      throw new Error('Expected claim to be covered under active warranty');
    }
    if (approvedClaim.determination !== 'approved_full_parts_and_labor') {
      throw new Error('Expected approved_full_parts_and_labor determination');
    }
    if (!staffReq) {
      throw new Error('Expected auto-drafted Store StaffRequest for replacement parts');
    }
    console.log('✓ Active contractual warranty coverage verification & zero-cost store request passed\n');

    // --- Test 5: File Expired Warranty Claim (Past Component Expiration) ---
    console.log('--- Test 5: File Expired Warranty Claim (Past Component Coverage Window) ---');
    // Simulate claim submitted 15 months after installation (transformer warranty is 12 months)
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 15);

    const expiredClaimRes = await fetch(`${BASE_URL}/api/warranty-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        claimCode: 'CLM-2026-P8-02',
        jobOrderId: testJobOrder._id,
        claimDate: futureDate,
        failedComponent: 'power_supply_transformer',
        defectDescription: 'Transformer burnt out after 15 months of 24/7 service.'
      })
    });

    const expiredClaimData = await expiredClaimRes.json();
    console.log(`✓ Expired claim status: ${expiredClaimRes.status}`);
    if (expiredClaimRes.status !== 201) throw new Error(expiredClaimData.message);
    const rejectedClaim = expiredClaimData.data.warrantyClaim;

    console.log(`✓ Claim Code: ${rejectedClaim.claimCode}`);
    console.log(`✓ Covered Under Warranty: ${rejectedClaim.isCoveredUnderActiveWarranty}`);
    console.log(`✓ Determination: ${rejectedClaim.determination}`);
    console.log(`✓ Claim Status: ${rejectedClaim.status}`);
    console.log(`✓ Rejection Notes: "${rejectedClaim.rejectionReasonNotes}"`);

    if (rejectedClaim.isCoveredUnderActiveWarranty) {
      throw new Error('Expected expired claim to be rejected');
    }
    if (rejectedClaim.determination !== 'rejected_out_of_warranty') {
      throw new Error('Expected rejected_out_of_warranty determination');
    }
    console.log('✓ Expired warranty claim correctly rejected\n');

    // --- Test 6: Fulfill Approved Warranty Claim & Client Sign-Off ---
    console.log('--- Test 6: Fulfill Approved Warranty Claim & Client Sign-Off ---');
    const fulfillRes = await fetch(`${BASE_URL}/api/warranty-claims/${approvedClaim._id}/fulfill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        dispatchedTechnician: repEmployee._id,
        repairExecutionDate: new Date(),
        componentsReplaced: [
          {
            stockItemId: testStockItem._id,
            itemName: 'MeanWell 12V 200W IP67 Waterproof Power Supply',
            quantity: 1,
            serialNumber: 'MW-2026-09941'
          }
        ],
        claimResolutionCostETB: 1800,
        clientHandoverSignOff: {
          isSatisfactorilyRepaired: true,
          clientWitnessName: 'Tewodros Kassahun',
          clientSignatureUrl: 'https://storage.vector.et/signatures/dashen_warranty_satisfaction.png'
        }
      })
    });

    const fulfillData = await fulfillRes.json();
    console.log(`✓ Fulfill status: ${fulfillRes.status}`);
    if (fulfillRes.status !== 200) throw new Error(fulfillData.message);
    const closedClaim = fulfillData.data;

    console.log(`✓ Warranty Claim final status: ${closedClaim.status}`);
    console.log(`✓ Client Witness: ${closedClaim.clientHandoverSignOff.clientWitnessName}`);
    console.log(`✓ Satisfactorily Repaired: ${closedClaim.clientHandoverSignOff.isSatisfactorilyRepaired}`);
    if (closedClaim.status !== 'closed') {
      throw new Error('Expected warranty claim to be closed after client sign-off');
    }
    console.log('✓ Warranty claim fulfillment and client sign-off verified\n');

    // --- Test 7: Feedback & Post-Sales Quality Metrics ---
    console.log('--- Test 7: Feedback & Post-Sales Quality Metrics Dashboard ---');
    const metricsRes = await fetch(`${BASE_URL}/api/customer-feedback/metrics`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${managerToken}`
      }
    });

    const metricsData = await metricsRes.json();
    console.log(`✓ Metrics response status: ${metricsRes.status}`);
    if (metricsRes.status !== 200) throw new Error(metricsData.message);
    const m = metricsData.data;

    console.log(`✓ Total Feedbacks: ${m.totalFeedbacks}`);
    console.log(`✓ Average Satisfaction: ${m.averageSatisfactionScore} / 5.0`);
    console.log(`✓ Net Promoter Score: ${m.netPromoterScore}`);
    console.log(`✓ Total Complaints: ${m.complaintMetrics.totalComplaints}`);
    console.log(`✓ Total Warranty Claims: ${m.warrantyMetrics.totalClaims}`);
    console.log(`✓ Warranty Approval Rate: ${m.warrantyMetrics.approvalRate}%`);

    if (m.totalFeedbacks < 2) throw new Error('Expected at least 2 feedbacks');
    if (m.complaintMetrics.totalComplaints < 1) throw new Error('Expected at least 1 complaint');
    if (m.warrantyMetrics.totalClaims < 2) throw new Error('Expected at least 2 warranty claims');
    console.log('✓ Feedback & warranty quality metrics verified\n');

    console.log('🎉 ALL PHASE 8 INTEGRATION TESTS PASSED 100% CLEANLY! 🎉\n');
  } catch (error) {
    console.error('❌ Phase 8 Integration Test Failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('MongoDB disconnected and test server stopped');
  }
}

runTests();
