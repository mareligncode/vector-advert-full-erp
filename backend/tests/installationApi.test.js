import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from '../routes/authRoutes.js';
import crmRoutes, { clientRoutes } from '../routes/crmRoutes.js';
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
import siteInstallationRoutes from '../routes/installationRoutes.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import ClientOrder from '../models/ClientOrder.js';
import JobOrder from '../models/JobOrder.js';
import SiteInstallation from '../models/SiteInstallation.js';
import { ROLES } from '../constants/roles.js';
import { generateToken } from '../middleware/authMiddleware.js';

dotenv.config();

const PORT = 5101;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🚀 Starting Logistics, Field Installation & Handover (Phase 6) Integration Tests...\n');

  const mongoURI =
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp_test';
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB test database');

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/crm', crmRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/orders-design', orderDesignRoutes);
  app.use('/api/client-orders', clientOrderRoutes);
  app.use('/api/billing-credit', billingCreditRoutes);
  app.use('/api/production', productionRoutes);
  app.use('/api/job-orders', jobOrderRoutes);
  app.use('/api/production-machines', productionMachineRoutes);
  app.use('/api/production-requests', productionRequestRoutes);
  app.use('/api/site-installations', siteInstallationRoutes);

  // Central error handler
  app.use((err, req, res, next) => {
    console.error('Test Server Error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  const server = app.listen(PORT);
  console.log(`Test server running on ${BASE_URL}\n`);

  let managerToken = '';
  let technicianToken = '';
  let managerUser = null;
  let technicianUser = null;
  let leadTechEmployee = null;
  let driverEmployee = null;
  let electricianEmployee = null;
  let testClient = null;
  let testOrder = null;
  let testJobOrder = null;
  let testInstallation = null;

  try {
    console.log('--- 0. Seeding Authentication, Employees & Test JobOrder ---');
    await Promise.all([
      User.deleteMany({ email: { $regex: /@p6test\.vector/ } }),
      Employee.deleteMany({ email: { $regex: /@p6test\.vector/ } }),
      Client.deleteMany({ clientCode: 'CL-P6-001' }),
      JobOrder.deleteMany({ jobOrderNumber: 'JOB-2026-P6-01' }),
      ClientOrder.deleteMany({ orderNumber: 'ORD-2026-P6-01' }),
      SiteInstallation.deleteMany({ jobOrderNumber: 'JOB-2026-P6-01' })
    ]);

    leadTechEmployee = await Employee.create({
      employeeNumber: 'EMP-P6-TECH',
      name: { first: 'Tamrat', last: 'Dagne' },
      email: 'tamrat@p6test.vector',
      primaryPhone: '+251911667788',
      department: new mongoose.Types.ObjectId(),
      position: 'Field Installation Lead Engineer',
      employmentStatus: 'active',
      hireDate: new Date()
    });

    driverEmployee = await Employee.create({
      employeeNumber: 'EMP-P6-DRV',
      name: { first: 'Getachew', last: 'Mengistu' },
      email: 'getachew@p6test.vector',
      primaryPhone: '+251911667799',
      department: new mongoose.Types.ObjectId(),
      position: 'Heavy Freight Driver',
      employmentStatus: 'active',
      hireDate: new Date()
    });

    electricianEmployee = await Employee.create({
      employeeNumber: 'EMP-P6-ELEC',
      name: { first: 'Robel', last: 'Zewdu' },
      email: 'robel@p6test.vector',
      primaryPhone: '+251911667700',
      department: new mongoose.Types.ObjectId(),
      position: 'Certified High-Voltage Electrician',
      employmentStatus: 'active',
      hireDate: new Date()
    });

    managerUser = await User.create({
      name: 'Surafel Teshome (Logistics Manager)',
      email: 'manager@p6test.vector',
      password: 'Password123!',
      roles: [ROLES.MANAGER, ROLES.COO],
      accountStatus: 'active',
      employeeId: leadTechEmployee._id
    });

    technicianUser = await User.create({
      name: 'Tamrat Dagne (Field Tech)',
      email: 'tech@p6test.vector',
      password: 'Password123!',
      roles: [ROLES.EMPLOYEE],
      accountStatus: 'active',
      employeeId: leadTechEmployee._id
    });

    managerToken = generateToken(managerUser._id);
    technicianToken = generateToken(technicianUser._id);

    console.log('✓ Users, technicians, and drivers initialized');

    // Create client
    testClient = await Client.create({
      clientCode: 'CL-P6-001',
      displayName: 'Hibret Bank S.C. (United Bank)',
      legalName: 'Hibret Bank Share Company',
      clientType: 'corporate',
      industry: 'banking_finance',
      primaryPhone: '+251911554433',
      address: {
        country: 'Ethiopia',
        city: 'Addis Ababa',
        subcity: 'Kirkos',
        landmark: 'Hibir Tower, Mexico Square'
      },
      accountManager: leadTechEmployee._id,
      createdBy: managerUser._id
    });

    // Create client order
    testOrder = await ClientOrder.create({
      orderNumber: 'ORD-2026-P6-01',
      clientId: testClient._id,
      projectTitle: 'Hibret Bank HQ Main Entrance 3D Stainless Letters & Pylon',
      orderType: '3d_metal_halo_lit',
      priority: 'urgent',
      estimatedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      salesAccountManager: leadTechEmployee._id,
      fulfillmentMethod: 'on_site_installation',
      deliveryAddress: 'Hibir Tower, Mexico Square, Addis Ababa',
      requestedItems: [
        {
          itemTitle: '3D Stainless Steel Illuminated Channel Letters "HIBRET BANK"',
          productCategory: '3d_metal_halo_lit',
          quantity: 1,
          unitPrice: 180000,
          totalPrice: 180000,
          dimensions: {
            widthCm: 450,
            heightCm: 120,
            depthReturnCm: 8,
            totalAreaSqM: 5.4
          }
        }
      ],
      commercial: {
        subtotal: 180000,
        taxableAmount: 180000,
        vatRatePercentage: 15,
        vatAmount: 27000,
        grandTotal: 207000,
        advanceDepositAmountRequired: 103500,
        advanceDepositAmountPaid: 103500
      },
      productionClearance: {
        financialClearanceStatus: 'cleared_for_production',
        isProductionAuthorized: true
      },
      createdBy: managerUser._id
    });

    // Create JobOrder in pending QC status
    testJobOrder = await JobOrder.create({
      jobOrderNumber: 'JOB-2026-P6-01',
      orderId: testOrder._id,
      clientId: testClient._id,
      approvedDesignProofId: new mongoose.Types.ObjectId(),
      projectTitle: testOrder.projectTitle,
      status: 'in_electrical_and_qc_testing',
      priority: 'urgent',
      scheduledStartDate: new Date(),
      targetCompletionDate: testOrder.estimatedCompletionDate,
      fulfillment: {
        deliveryMethod: 'on_site_installation'
      },
      workstationRouting: {
        machineFabrication: { status: 'completed' },
        assemblyAndFinishing: { status: 'completed' },
        electricalAndQC: {
          status: 'pending', // NOT passed yet!
          insulationResistanceTestPassed: false
        },
        packagingAndDispatch: {
          isPackaged: false
        }
      },
      warranty: {
        warrantyCode: 'WAR-2026-P6-01',
        status: 'pending_activation',
        coverageDurationsMonths: {
          ledModulesMonths: 24,
          powerSupplyTransformerMonths: 12,
          siliconeNeonFlexMonths: 12,
          acrylicAndStructureMonths: 36
        }
      },
      workshopSupervisor: leadTechEmployee._id,
      authorizedBy: managerUser._id
    });

    console.log(`✓ JobOrder created: ${testJobOrder.jobOrderNumber} (QC Status: pending)\n`);

    // ==========================================
    // Test 1: Verify Delivery Barrier (Pre-QC Protection)
    // ==========================================
    console.log('--- Test 1: Attempt to Schedule Installation Before Factory QC Clearance ---');
    const blockedRes = await fetch(`${BASE_URL}/api/site-installations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        jobOrderId: testJobOrder._id,
        logistics: {
          assignedDriver: driverEmployee._id
        }
      })
    });

    console.log(`✓ Delivery barrier HTTP status: ${blockedRes.status}`);
    const blockedData = await blockedRes.json();
    if (blockedRes.status !== 422) {
      throw new Error(`Expected 422 Unprocessable Entity, got ${blockedRes.status}`);
    }
    console.log(`✓ Barrier rejection message: "${blockedData.message}"`);
    console.log('✓ Factory pre-QC delivery gatekeeper passed\n');

    // ==========================================
    // Satisfy Pre-condition: Pass Factory QC
    // ==========================================
    console.log('--- Passing Factory Electrical & Burn-in QC ---');
    testJobOrder.workstationRouting.electricalAndQC.status = 'passed';
    testJobOrder.workstationRouting.electricalAndQC.insulationResistanceTestPassed = true;
    testJobOrder.workstationRouting.packagingAndDispatch.isPackaged = true;
    testJobOrder.status = 'ready_for_dispatch';
    await testJobOrder.save();
    console.log('✓ JobOrder updated: status = ready_for_dispatch, electricalAndQC = passed\n');

    // ==========================================
    // Test 2: Schedule Site Installation & Logistics
    // ==========================================
    console.log('--- Test 2: Schedule Site Installation & Field Delivery ---');
    const scheduleRes = await fetch(`${BASE_URL}/api/site-installations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        jobOrderId: testJobOrder._id,
        serviceType: 'delivery_and_installation',
        logistics: {
          vehicleType: 'flatbed_truck',
          plateNumber: 'ET-3-88221',
          assignedDriver: driverEmployee._id,
          cargoManifest: [
            {
              itemDescription: '3D Stainless Channel Letters (10 letters in crate)',
              quantity: 1,
              packagingType: 'wooden_crate',
              verifiedLoaded: true
            },
            {
              itemDescription: 'MeanWell IP67 Transformers & 1:1 Mounting Paper Stencils',
              quantity: 2,
              packagingType: 'carton_box',
              verifiedLoaded: true
            }
          ]
        },
        destination: {
          address: 'Hibir Tower, Mexico Square, Main Entrance Facade',
          gpsCoordinates: { latitude: 9.0125, longitude: 38.7456 },
          siteContactPerson: {
            name: 'Ato Daniel Girma (Corporate Facilities Manager)',
            phone: '+251911554433'
          }
        },
        leadTechnician: leadTechEmployee._id,
        electricianEmployeeId: electricianEmployee._id,
        accessEquipmentUsed: 'boom_lift_cherry_picker',
        generatorDeployed: true
      })
    });

    const scheduleData = await scheduleRes.json();
    if (!scheduleRes.ok) throw new Error(`Scheduling failed: ${JSON.stringify(scheduleData)}`);

    testInstallation = scheduleData.data;
    console.log(`✓ Installation scheduled: ${testInstallation.installationCode} (Status: ${testInstallation.status})`);
    console.log(`✓ Vehicle: ${testInstallation.logistics.vehicleType} (${testInstallation.logistics.plateNumber})`);
    console.log(`✓ Access Equipment: ${testInstallation.accessEquipmentUsed}`);

    if (!testInstallation.installationCode.startsWith('INS-')) throw new Error('Expected INS- prefix');
    if (testInstallation.logistics.cargoManifest.length !== 2) throw new Error('Expected 2 cargo items');
    console.log('✓ Site installation and cargo manifest recorded\n');

    // ==========================================
    // Test 3: Dispatch Installation Vehicle Gate Pass
    // ==========================================
    console.log('--- Test 3: Dispatch Vehicle Gate Pass (Workshop Departure) ---');
    const dispatchRes = await fetch(`${BASE_URL}/api/site-installations/${testInstallation._id}/dispatch`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        workshopGatePassNumber: 'GP-2026-0044',
        departureFromWorkshopTime: new Date().toISOString()
      })
    });

    const dispatchData = await dispatchRes.json();
    if (!dispatchRes.ok) throw new Error(`Dispatch failed: ${JSON.stringify(dispatchData)}`);

    const dispatchedInst = dispatchData.data;
    const orderAfterDispatch = await JobOrder.findById(testJobOrder._id);

    console.log(`✓ Installation status: ${dispatchedInst.status}`);
    console.log(`✓ Gate pass: ${dispatchedInst.logistics.workshopGatePassNumber}`);
    console.log(`✓ JobOrder status advanced to: ${orderAfterDispatch.status}`);

    if (dispatchedInst.status !== 'cargo_loaded_in_transit') {
      throw new Error('Expected cargo_loaded_in_transit status');
    }
    if (orderAfterDispatch.status !== 'out_for_delivery_or_installation') {
      throw new Error('Expected JobOrder out_for_delivery_or_installation');
    }
    console.log('✓ Logistics dispatch and in-transit tracking verified\n');

    // ==========================================
    // Test 4: Record On-Site Progress & Checklist
    // ==========================================
    console.log('--- Test 4: Record On-Site Arrival & Verification Checklist ---');
    const checklistRes = await fetch(`${BASE_URL}/api/site-installations/${testInstallation._id}/checklist`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${technicianToken}`
      },
      body: JSON.stringify({
        status: 'mounting_and_wiring_in_progress',
        arrivalAtSiteTime: new Date().toISOString(),
        checklist: {
          templateAlignedLevel: true,
          anchorsSecureTorqued: true,
          wiringConcealedProtected: true,
          transformersGroundedIP67: true,
          siliconeSealingComplete: true,
          polarityAndVoltageVerified: true,
          timerPhotocellCalibrated: true,
          siteCleanedDebrisRemoved: true
        }
      })
    });

    const checklistData = await checklistRes.json();
    if (!checklistRes.ok) throw new Error('Checklist update failed');
    const updatedInst = checklistData.data;

    console.log(`✓ Site arrival recorded: ${updatedInst.logistics.arrivalAtSiteTime}`);
    console.log(`✓ Anchors torqued: ${updatedInst.checklist.anchorsSecureTorqued}`);
    console.log(`✓ Transformers grounded IP67: ${updatedInst.checklist.transformersGroundedIP67}`);
    if (!updatedInst.checklist.timerPhotocellCalibrated) throw new Error('Checklist item missing');
    console.log('✓ On-site mounting and electrical checklist completed\n');

    // ==========================================
    // Test 5: Nighttime Illumination Test
    // ==========================================
    console.log('--- Test 5: Submit Nighttime Illumination & Electrical Test ---');
    const nightTestRes = await fetch(`${BASE_URL}/api/site-installations/${testInstallation._id}/night-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${technicianToken}`
      },
      body: JSON.stringify({
        illuminationUniformity: 'perfect_no_hotspots',
        voltageMeasuredAtEndLetter: 12.15,
        currentDrawAmperes: 14.8,
        totalPowerWatts: 180
      })
    });

    const nightTestData = await nightTestRes.json();
    if (!nightTestRes.ok) throw new Error('Night test submission failed');
    const nightInst = nightTestData.data;

    console.log(`✓ Night test recorded: ${nightInst.illuminationTest.illuminationUniformity} (${nightInst.illuminationTest.voltageMeasuredAtEndLetter}V DC, ${nightInst.illuminationTest.totalPowerWatts}W)`);
    console.log(`✓ Installation status: ${nightInst.status}`);
    if (nightInst.status !== 'testing_illumination') throw new Error('Expected testing_illumination');
    console.log('✓ Nighttime illumination verified\n');

    // ==========================================
    // Test 6: Sign Handover Certificate -> Automated Warranty Activation (Rule 1)
    // ==========================================
    console.log('--- Test 6: Client Handover Sign-Off & Automated Warranty Activation ---');
    // Test validation: missing client signature
    const invalidHandoverRes = await fetch(`${BASE_URL}/api/site-installations/${testInstallation._id}/handover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${technicianToken}`
      },
      body: JSON.stringify({
        clientRepresentativeName: 'Ato Daniel Girma',
        clientRepresentativePhone: '+251911554433'
        // Missing signature URL!
      })
    });

    console.log(`✓ Missing signature rejection status: ${invalidHandoverRes.status}`);
    if (invalidHandoverRes.status !== 400) {
      throw new Error(`Expected 400 for missing signature, got ${invalidHandoverRes.status}`);
    }

    // Submit valid handover sign-off
    const acceptanceDate = new Date();
    const validHandoverRes = await fetch(`${BASE_URL}/api/site-installations/${testInstallation._id}/handover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${technicianToken}`
      },
      body: JSON.stringify({
        clientRepresentativeName: 'Ato Daniel Girma',
        clientRepresentativeTitle: 'VP of Corporate Brand & Facilities',
        clientRepresentativePhone: '+251911554433',
        acceptanceDate: acceptanceDate.toISOString(),
        condition: 'accepted_flawless',
        clientComments: 'Flawless halo illumination, premium stainless finish, and clean concealed wiring. Accepted with high commendation.',
        clientDigitalSignatureUrl: 'https://cdn.vector.et/signatures/hibret-vp-daniel.png',
        leadTechnicianSignatureUrl: 'https://cdn.vector.et/signatures/tamrat-tech.png'
      })
    });

    const handoverData = await validHandoverRes.json();
    if (!validHandoverRes.ok) throw new Error(`Handover failed: ${JSON.stringify(handoverData)}`);

    const finalInst = handoverData.data.installation;
    const activatedJobOrder = handoverData.data.jobOrder;
    const finalClientOrder = await ClientOrder.findById(testOrder._id);

    console.log(`✓ Handover Certificate condition: ${finalInst.handoverCertificate.condition}`);
    console.log(`✓ JobOrder warranty status: ${activatedJobOrder.warranty.status}`);
    console.log(`✓ Warranty Start Date: ${activatedJobOrder.warranty.warrantyStartDate}`);
    console.log(`✓ Transformers Expiration: ${activatedJobOrder.warranty.expirationDeadlines.transformerExpiry}`);
    console.log(`✓ LEDs Expiration (+24 months): ${activatedJobOrder.warranty.expirationDeadlines.ledModulesExpiry}`);
    console.log(`✓ Structural Expiration (+36 months): ${activatedJobOrder.warranty.expirationDeadlines.structuralExpiry}`);
    console.log(`✓ QR Code Deep Link: ${activatedJobOrder.warranty.scannableQrCodeUrl}`);
    console.log(`✓ JobOrder status: ${activatedJobOrder.status}`);
    console.log(`✓ ClientOrder final status: ${finalClientOrder.status}`);

    if (finalInst.status !== 'handover_signed') throw new Error('Expected handover_signed');
    if (activatedJobOrder.warranty.status !== 'active_under_warranty') {
      throw new Error('Expected active_under_warranty status');
    }
    if (!activatedJobOrder.warranty.expirationDeadlines.structuralExpiry) {
      throw new Error('Structural expiry date was not computed');
    }
    if (activatedJobOrder.status !== 'installation_completed') {
      throw new Error('Expected installation_completed JobOrder status');
    }
    if (finalClientOrder.status !== 'completed') {
      throw new Error('Expected completed ClientOrder status');
    }
    console.log('✓ Rule 1 verified: Handover sign-off automatically activated contractual warranty & closed commercial order\n');

    console.log('🎉 ALL PHASE 6 INTEGRATION TESTS PASSED 100% CLEANLY! 🎉\n');
  } catch (error) {
    console.error('❌ Phase 6 Integration Test Failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('MongoDB disconnected and test server stopped');
  }
}

runTests();
