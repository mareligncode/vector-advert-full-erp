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
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import ClientOrder from '../models/ClientOrder.js';
import DesignTask from '../models/DesignTask.js';
import DesignProof from '../models/DesignProof.js';
import Invoice from '../models/Invoice.js';
import PaymentCollection from '../models/PaymentCollection.js';
import JobOrder from '../models/JobOrder.js';
import ProductionMachine from '../models/ProductionMachine.js';
import ProductionRequest from '../models/ProductionRequest.js';
import { ROLES } from '../constants/roles.js';
import { generateToken } from '../middleware/authMiddleware.js';

dotenv.config();

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🚀 Starting Production Release & Shop-Floor Execution (Phase 4) Integration Tests...\n');

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

  // Central error handler
  app.use((err, req, res, next) => {
    console.error('Test Server Error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  const server = app.listen(PORT);
  console.log(`Test server running on ${BASE_URL}\n`);

  let managerToken = '';
  let salesToken = '';
  let operatorEmployee = null;
  let craftsmanEmployee = null;
  let supervisorEmployee = null;
  let managerUser = null;
  let testClient = null;
  let testOrder = null;
  let testProof = null;
  let testMachine = null;
  let testJobOrder = null;
  let testProductionRequest = null;

  try {
    console.log('--- 0. Seeding Authentication & Test Entities ---');
    await Promise.all([
      User.deleteMany({ email: { $regex: /@p4test\.vector/ } }),
      Employee.deleteMany({ email: { $regex: /@p4test\.vector/ } }),
      Client.deleteMany({ clientCode: 'CL-P4-001' }),
      ClientOrder.deleteMany({ projectTitle: { $regex: /Telebirr/ } }),
      DesignTask.deleteMany({ briefTitle: { $regex: /Telebirr/ } }),
      DesignProof.deleteMany({ proofTitle: { $regex: /Telebirr/ } }),
      JobOrder.deleteMany({ projectTitle: { $regex: /Telebirr/ } }),
      ProductionMachine.deleteMany({ machineCode: { $regex: /^MCH-CNC-HEAVY/ } }),
      ProductionRequest.deleteMany({ requestTitle: { $regex: /Telebirr/ } })
    ]);

    supervisorEmployee = await Employee.create({
      employeeNumber: 'EMP-P4-SUP',
      name: { first: 'Tewodros', last: 'Kassahun' },
      email: 'tewodros@p4test.vector',
      primaryPhone: '+251911880011',
      department: new mongoose.Types.ObjectId(),
      position: 'Workshop Production Supervisor',
      employmentStatus: 'active',
      hireDate: new Date()
    });

    operatorEmployee = await Employee.create({
      employeeNumber: 'EMP-P4-OP1',
      name: { first: 'Biniyam', last: 'Alemu' },
      email: 'biniyam@p4test.vector',
      primaryPhone: '+251911880022',
      department: new mongoose.Types.ObjectId(),
      position: 'Senior CNC / Laser Operator',
      employmentStatus: 'active',
      hireDate: new Date()
    });

    craftsmanEmployee = await Employee.create({
      employeeNumber: 'EMP-P4-CRF',
      name: { first: 'Fikadu', last: 'Tadesse' },
      email: 'fikadu@p4test.vector',
      primaryPhone: '+251911880033',
      department: new mongoose.Types.ObjectId(),
      position: 'Master Letter Craftsman & Assembler',
      employmentStatus: 'active',
      hireDate: new Date()
    });

    managerUser = await User.create({
      name: 'Yared Lemma (COO & Production Manager)',
      email: 'manager@p4test.vector',
      password: 'Password123!',
      roles: [ROLES.MANAGER, ROLES.COO],
      accountStatus: 'active',
      employeeId: supervisorEmployee._id
    });

    const salesUser = await User.create({
      name: 'Selamawit Desta (Sales)',
      email: 'sales@p4test.vector',
      password: 'Password123!',
      roles: [ROLES.FRONTDESK, ROLES.EMPLOYEE],
      accountStatus: 'active',
      employeeId: supervisorEmployee._id
    });

    managerToken = generateToken(managerUser._id);
    salesToken = generateToken(salesUser._id);

    console.log('✓ Employees, manager, and sales auth tokens seeded');

    // Create client
    testClient = await Client.create({
      clientCode: 'CL-P4-001',
      displayName: 'Ethio Telecom (Telebirr Headquarters)',
      legalName: 'Ethio Telecom Corporation',
      clientType: 'corporate',
      industry: 'telecommunications',
      primaryPhone: '+251911002233',
      address: {
        country: 'Ethiopia',
        city: 'Addis Ababa',
        subcity: 'Kirkos',
        landmark: 'Churchill Road, Head Office'
      },
      businessCompliance: {
        tin: '0033445566',
        vatRegistrationNumber: 'VAT-ET-1122',
        isVatRegistered: true
      },
      creditTerms: {
        allowCredit: true,
        creditLimit: 1000000,
        creditPeriodDays: 30,
        creditStatus: 'active_good_standing',
        isCreditHold: false
      },
      accountManager: supervisorEmployee._id,
      createdBy: salesUser._id
    });

    // Create sales order (Draft, without financial clearance yet)
    const createOrderRes = await fetch(`${BASE_URL}/api/client-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        clientId: testClient._id,
        projectTitle: 'Telebirr Experience Center 3D Halo Letters & Neon Signage',
        orderType: '3d_metal_halo_lit',
        priority: 'urgent',
        estimatedCompletionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        salesAccountManager: supervisorEmployee._id,
        fulfillmentMethod: 'on_site_installation',
        requestedItems: [
          {
            itemTitle: 'Stainless Steel 3D Backlit Letters "telebirr"',
            productCategory: '3d_metal_halo_lit',
            quantity: 1,
            unitPrice: 120000,
            dimensions: { widthCm: 450, heightCm: 120, depthReturnCm: 8 }
          }
        ],
        commercial: {
          vatRatePercentage: 15,
          advanceDepositRequiredPercentage: 50
        }
      })
    });
    const createOrderData = await createOrderRes.json();
    testOrder = createOrderData.data;
    console.log(`✓ ClientOrder created: ${testOrder.orderNumber} (Grand Total: ${testOrder.commercial.grandTotal} ETB)\n`);

    // ==========================================
    // Test 1: Release Gate Barrier Enforcement
    // ==========================================
    console.log('--- Test 1: Attempt JobOrder Release Without Design Proof or Financial Clearance ---');
    const blockedReleaseRes = await fetch(`${BASE_URL}/api/job-orders/release/${testOrder._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      }
    });

    console.log(`✓ Gate rejection HTTP status: ${blockedReleaseRes.status}`);
    const blockedData = await blockedReleaseRes.json();
    if (blockedReleaseRes.status !== 422) {
      throw new Error(`Expected 422 Unprocessable Entity, got ${blockedReleaseRes.status}`);
    }
    console.log(`✓ Release barrier message: "${blockedData.message}"`);
    console.log('✓ Release gate strictly blocked unverified manufacturing release\n');

    // ==========================================
    // Satisfy Pre-conditions: Advance Payment & Design Proof Lock
    // ==========================================
    console.log('--- Progressing Pre-Conditions: 50% Advance Deposit & Design Proof Lock ---');
    // Generate proforma invoice
    const invoiceRes = await fetch(`${BASE_URL}/api/invoices/from-order/${testOrder._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({ invoiceType: 'proforma' })
    });
    const invoiceData = await invoiceRes.json();
    const invoice = invoiceData.data;

    // Collect 50% deposit via bank transfer
    await fetch(`${BASE_URL}/api/payment-collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        clientOrderId: testOrder._id,
        invoiceId: invoice._id,
        receiptType: 'advance_deposit_upfront',
        paymentMethod: 'bank_transfer_cbe',
        amountPaidETB: testOrder.commercial.advanceDepositAmountRequired,
        destinationBankAccount: '1000123456789',
        electronicTransfer: { bankTransactionReference: 'TX-CBE-P4-001' },
        collectedBy: supervisorEmployee._id
      })
    });

    // Assign design task
    const assignTaskRes = await fetch(`${BASE_URL}/api/client-orders/${testOrder._id}/assign-design`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        assignedDesigner: supervisorEmployee._id,
        briefTitle: 'Telebirr 3D Stainless Letters CAD Toolpaths'
      })
    });
    const taskData = await assignTaskRes.json();
    const taskId = taskData.data.task?._id || taskData.data._id;

    // Submit proof
    const submitProofRes = await fetch(`${BASE_URL}/api/design-tasks/${taskId}/proofs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        proofTitle: 'Telebirr Final 1:1 DXF & Render Proof V1',
        presentationMedia: {
          daylightMockupImageUrl: 'https://cdn.vector.et/telebirr-mockup.jpg',
          nightIlluminatedMockupImageUrl: 'https://cdn.vector.et/telebirr-night.jpg',
          technicalDrawingPdfUrl: 'https://cdn.vector.et/telebirr-drawing.pdf'
        },
        productionFiles: {
          cncLaserVectorCutUrl: 'https://cdn.vector.et/cut-files/telebirr-metal-face-1to1.dxf',
          letterFaceCutPath: 'https://cdn.vector.et/cut-files/telebirr-face.dxf',
          letterBackerCutPath: 'https://cdn.vector.et/cut-files/telebirr-acrylic-backer.dxf'
        },
        engineeringSpecs: {
          overallWidthCm: 450,
          overallHeightCm: 120,
          returnDepthCm: 8,
          acrylicThicknessMm: 10,
          backerThicknessMm: 10
        }
      })
    });
    const proofData = await submitProofRes.json();
    testProof = proofData.data;

    // Approve proof
    await fetch(`${BASE_URL}/api/design-proofs/${testProof._id}/client-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        isApproved: true,
        approvalMethod: 'signed_proof_sheet_pdf',
        approvedByClientContactName: 'Ato Solomon (Ethio Telecom Brand Director)'
      })
    });

    // Lock proof for factory production
    await fetch(`${BASE_URL}/api/design-proofs/${testProof._id}/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      }
    });

    console.log('✓ Advance deposit paid (cleared_for_production) & design proof locked\n');

    // ==========================================
    // Test 2: Release Manufacturing JobOrder
    // ==========================================
    console.log('--- Test 2: Release Shop-Floor JobOrder Traveler ---');
    const releaseRes = await fetch(`${BASE_URL}/api/job-orders/release/${testOrder._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        workshopSupervisor: supervisorEmployee._id,
        assignedCrew: [operatorEmployee._id, craftsmanEmployee._id],
        packagingType: 'wooden_crate'
      })
    });

    const releaseData = await releaseRes.json();
    if (!releaseRes.ok) throw new Error(`Release failed: ${JSON.stringify(releaseData)}`);

    testJobOrder = releaseData.data.jobOrder;
    console.log(`✓ JobOrder released: ${testJobOrder.jobOrderNumber}`);
    console.log(`✓ Warranty pre-initialized: ${testJobOrder.warranty.warrantyCode} (Status: ${testJobOrder.warranty.status})`);

    if (!testJobOrder.jobOrderNumber.startsWith('JOB-')) throw new Error('Expected JOB- prefix');
    if (!testJobOrder.warranty?.warrantyCode.startsWith('WAR-')) throw new Error('Expected WAR- prefix');
    if (testJobOrder.status !== 'queued_for_materials') throw new Error('Expected status queued_for_materials');
    if (testJobOrder.warranty.coverageDurationsMonths.acrylicAndStructureMonths !== 36) {
      throw new Error('Warranty coverage duration mismatch');
    }

    // Verify client order status updated
    const updatedOrder = await ClientOrder.findById(testOrder._id);
    if (updatedOrder.status !== 'in_production') throw new Error('ClientOrder status not in_production');
    console.log('✓ JobOrder traveler released and ClientOrder moved to in_production\n');

    // ==========================================
    // Test 3: Register Heavy CNC Machine Asset
    // ==========================================
    console.log('--- Test 3: Enroll Heavy CNC Router Machine Asset ---');
    const machineRes = await fetch(`${BASE_URL}/api/production-machines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        machineCode: 'MCH-CNC-HEAVY-01',
        machineName: 'AccuCut Heavy 3-Axis CNC Router 1325',
        machineType: 'cnc_router_heavy',
        bedDimensions: {
          bedWidthCm: 130,
          bedLengthCm: 250,
          zAxisClearanceMm: 200
        },
        technicalCapabilities: {
          supportedMaterials: ['Acrylic', 'Alucobond ACP', 'Solid Brass', 'MDF'],
          maxCuttingThicknessMm: 30,
          spindleMaxRpm: 24000,
          vacuumBedEquipped: true
        },
        workshopLocationBay: 'Bay-01 Heavy Fabrication',
        assignedLeadOperator: operatorEmployee._id,
        hourlyCostRateETB: 450
      })
    });

    const machineData = await machineRes.json();
    if (!machineRes.ok) throw new Error(`Machine registration failed: ${JSON.stringify(machineData)}`);

    testMachine = machineData.data;
    console.log(`✓ Machine registered: ${testMachine.machineCode} - ${testMachine.machineName} (Hourly Rate: ${testMachine.hourlyCostRateETB} ETB)`);
    if (testMachine.bedDimensions.bedWidthCm !== 130) throw new Error('Bed width mismatch');
    console.log('✓ ProductionMachine asset registry verified\n');

    // ==========================================
    // Test 4: Dispatch ProductionRequest Traveler
    // ==========================================
    console.log('--- Test 4: Dispatch Itemized ProductionRequest Traveler ---');
    const reqRes = await fetch(`${BASE_URL}/api/production-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        jobOrderId: testJobOrder._id,
        requestTitle: 'Telebirr 3D Letter Face & Backer CNC Routing',
        priority: 'urgent',
        submittedDimensions: {
          finishedDimensions: {
            widthCm: 450,
            heightCm: 120,
            depthReturnCm: 8,
            totalFabricatedAreaSqM: 5.4
          },
          thicknessSpecifications: {
            faceThicknessMm: 10,
            backerThicknessMm: 10
          },
          quantityUnits: 1
        },
        submittedMaterials: [
          {
            materialCategory: 'substrate_sheet',
            materialName: 'Cast Clear Acrylic Sheet 10mm (122x244cm)',
            quantitySubmitted: 2,
            unitOfMeasure: 'sheet'
          },
          {
            materialCategory: 'lighting_led_neon',
            materialName: 'Warm White 3000K Samsung LED Modules IP68',
            quantitySubmitted: 150,
            unitOfMeasure: 'piece'
          }
        ],
        machineSelection: {
          machineId: testMachine._id,
          machineType: 'cnc_router_heavy',
          assignedOperator: operatorEmployee._id,
          toolpathCutFileUrl: 'https://cdn.vector.et/cut-files/telebirr-metal-face-1to1.dxf'
        },
        finishingTasks: [
          {
            taskNumber: 'FT-01',
            operationType: 'led_module_injection_and_wiring',
            description: 'Inject 150 LED modules and solder waterproof harness',
            assignedCraftsman: craftsmanEmployee._id
          },
          {
            taskNumber: 'FT-02',
            operationType: 'acrylic_face_chemical_bonding',
            description: 'Solvent weld 10mm acrylic backer into stainless return',
            assignedCraftsman: craftsmanEmployee._id
          }
        ],
        workshopSupervisor: supervisorEmployee._id
      })
    });

    const reqData = await reqRes.json();
    if (!reqRes.ok) throw new Error(`Production request dispatch failed: ${JSON.stringify(reqData)}`);

    testProductionRequest = reqData.data;
    console.log(`✓ ProductionRequest traveler created: ${testProductionRequest.productionRequestCode}`);
    console.log(`✓ 1:1 Cut Toolpath URL: ${testProductionRequest.machineSelection.toolpathCutFileUrl}`);
    console.log(`✓ Fabricated Area: ${testProductionRequest.submittedDimensions.finishedDimensions.totalFabricatedAreaSqM} sq.m`);

    if (!testProductionRequest.productionRequestCode.startsWith('PRQ-')) throw new Error('Expected PRQ- prefix');
    if (testProductionRequest.submittedMaterials.length !== 2) throw new Error('Expected 2 materials in BOM');
    if (testProductionRequest.finishingTasks.length !== 2) throw new Error('Expected 2 finishing tasks');
    console.log('✓ ProductionRequest traveler with BOM, nesting, and cut files validated\n');

    // ==========================================
    // Test 5: Record Machine Execution & Log Operating Hours
    // ==========================================
    console.log('--- Test 5: Record Machining Execution (Run Hours & Status Progression) ---');
    const machineExecRes = await fetch(`${BASE_URL}/api/production-requests/${testProductionRequest._id}/machine-execution`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        operationStatus: 'completed',
        toolingSpecs: '4mm Down-cut 2-flute solid carbide endmill @ 18,000 RPM, feed 3500mm/min',
        machineRunMinutes: 120,
        linearCutMeters: 45.8,
        scrapAndWaste: {
          scrapAreaSqM: 0.35,
          damagedSheetCount: 0,
          scrapReasonNotes: 'Offcut perimeter retained on workshop salvage rack'
        },
        operatorNotes: 'Clean, burr-free edge finish on 10mm acrylic. Tooling in perfect condition.'
      })
    });

    const machineExecData = await machineExecRes.json();
    if (!machineExecRes.ok) throw new Error(`Machine execution failed: ${JSON.stringify(machineExecData)}`);

    const updatedMachine = await ProductionMachine.findById(testMachine._id);
    const updatedJobOrder = await JobOrder.findById(testJobOrder._id);

    console.log(`✓ Machine total operating hours incremented: ${updatedMachine.totalOperatingHours} hours`);
    console.log(`✓ JobOrder machining routing status: ${updatedJobOrder.workstationRouting.machineFabrication.status} (${updatedJobOrder.workstationRouting.machineFabrication.machineRunHours} hrs)`);
    console.log(`✓ JobOrder status advanced to: ${updatedJobOrder.status}`);

    if (updatedMachine.totalOperatingHours !== 2) throw new Error(`Expected 2 machine hours, got ${updatedMachine.totalOperatingHours}`);
    if (updatedJobOrder.workstationRouting.machineFabrication.status !== 'completed') {
      throw new Error('Expected machineFabrication completed');
    }
    if (updatedJobOrder.status !== 'in_assembly_and_wiring') {
      throw new Error('Expected JobOrder in_assembly_and_wiring status');
    }
    console.log('✓ Machining execution logged and machine runtime accumulated\n');

    // ==========================================
    // Test 6: Complete Bench Craftsman Finishing Tasks & DC Voltage Checks
    // ==========================================
    console.log('--- Test 6: Complete Bench Craftsman Finishing & Bench Electrical Checks ---');
    // Task 1: LED wiring
    const task1Res = await fetch(`${BASE_URL}/api/production-requests/${testProductionRequest._id}/finishing-tasks/FT-01`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        status: 'completed',
        durationMinutes: 90,
        benchElectricalCheck: {
          measuredVoltageDC: 12.15,
          measuredAmperage: 8.4,
          zeroShortCircuitConfirmed: true,
          powerSupplySerialOrCode: 'PSU-MEANWELL-150W-009'
        },
        craftsmanNotes: 'All 150 LED modules wired with solder + heat-shrink tubing. Zero voltage drop observed.'
      })
    });
    if (!task1Res.ok) throw new Error('Failed to complete FT-01');

    // Task 2: Acrylic chemical bonding
    const task2Res = await fetch(`${BASE_URL}/api/production-requests/${testProductionRequest._id}/finishing-tasks/FT-02`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        status: 'completed',
        durationMinutes: 60,
        craftsmanNotes: 'Acrifix chemical bonding cured. Optical clarity 100%.'
      })
    });
    if (!task2Res.ok) throw new Error('Failed to complete FT-02');

    const finishedReq = await ProductionRequest.findById(testProductionRequest._id);
    const orderAfterBench = await JobOrder.findById(testJobOrder._id);

    console.log(`✓ ProductionRequest status: ${finishedReq.status}`);
    console.log(`✓ JobOrder routing status: ${orderAfterBench.workstationRouting.assemblyAndFinishing.status}`);
    console.log(`✓ JobOrder status advanced to: ${orderAfterBench.status}`);

    if (finishedReq.status !== 'finishing_completed') throw new Error('Expected finishing_completed');
    if (orderAfterBench.workstationRouting.assemblyAndFinishing.status !== 'completed') {
      throw new Error('Expected assemblyAndFinishing completed');
    }
    if (orderAfterBench.status !== 'in_electrical_and_qc_testing') {
      throw new Error('Expected in_electrical_and_qc_testing status');
    }
    console.log('✓ Bench finishing tasks and DC electrical checks verified\n');

    // ==========================================
    // Test 7: 4-Hour Electrical Burn-in & Megger Insulation QC Clearance
    // ==========================================
    console.log('--- Test 7: Submit 4-Hour Burn-in QC Clearance Sign-Off ---');
    // Test rejection if burn in < 4 hours
    const rejectedQcRes = await fetch(`${BASE_URL}/api/production-requests/${testProductionRequest._id}/qc-clearance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        illuminationBurnInTestHours: 2, // Less than mandatory 4 hours!
        insulationResistanceTestMegaOhms: 50,
        illuminationUniformityVerified: true
      })
    });

    console.log(`✓ Insufficient burn-in rejection status: ${rejectedQcRes.status}`);
    if (rejectedQcRes.status !== 400) {
      throw new Error(`Expected 400 for < 4 hours burn in, got ${rejectedQcRes.status}`);
    }

    // Submit valid QC clearance
    const validQcRes = await fetch(`${BASE_URL}/api/production-requests/${testProductionRequest._id}/qc-clearance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        illuminationBurnInTestHours: 4,
        insulationResistanceTestMegaOhms: 100, // Megger test > 2.0 MegaOhms
        illuminationUniformityVerified: true,
        weatherproofSiliconeSealed: true,
        acrylicSurfaceFreeOfScratches: true,
        qcInspectorNotes: '4-hour continuous burn-in completed with 0 LED dropouts. Insulation resistance 100 MΩ. Flawless optical uniformity.'
      })
    });

    const qcData = await validQcRes.json();
    if (!validQcRes.ok) throw new Error(`QC clearance failed: ${JSON.stringify(qcData)}`);

    const finalReq = qcData.data.productionRequest;
    const finalJobOrder = qcData.data.jobOrder;

    console.log(`✓ ProductionRequest status: ${finalReq.status} (QC Passed: ${finalReq.qualityClearance.isQcPassed})`);
    console.log(`✓ JobOrder electrical & QC routing: ${finalJobOrder.workstationRouting.electricalAndQC.status}`);
    console.log(`✓ JobOrder packaged & ready for dispatch: isPackaged = ${finalJobOrder.workstationRouting.packagingAndDispatch.isPackaged}`);
    console.log(`✓ JobOrder final status: ${finalJobOrder.status}`);

    if (finalReq.status !== 'qc_cleared') throw new Error('Expected qc_cleared status');
    if (finalJobOrder.workstationRouting.electricalAndQC.status !== 'passed') {
      throw new Error('Expected QC passed');
    }
    if (finalJobOrder.status !== 'ready_for_dispatch') {
      throw new Error('Expected JobOrder status ready_for_dispatch');
    }
    console.log('✓ 4-Hour burn-in QC sign-off verified and traveler marked ready for dispatch\n');

    console.log('🎉 ALL PHASE 4 INTEGRATION TESTS PASSED 100% CLEANLY! 🎉\n');
  } catch (error) {
    console.error('❌ Phase 4 Integration Test Failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('MongoDB disconnected and test server stopped');
  }
}

runTests();
