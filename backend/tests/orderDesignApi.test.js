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
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import ClientOrder from '../models/ClientOrder.js';
import DesignTask from '../models/DesignTask.js';
import DesignProof from '../models/DesignProof.js';
import { ROLES } from '../constants/roles.js';
import { generateToken } from '../middleware/authMiddleware.js';

dotenv.config();

const PORT = 5097;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🚀 Starting Commercial Orders & Design Pre-Press (Phase 2) Integration Tests...\n');

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

  // Central error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled Test Error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  const server = app.listen(PORT);
  console.log(`Test server running on ${BASE_URL}\n`);

  let salesToken = '';
  let designerToken = '';
  let managerToken = '';
  let salesUser = null;
  let designerUser = null;
  let managerUser = null;
  let designerEmployee = null;
  let salesEmployee = null;
  let testClient = null;

  let createdOrderId = '';
  let createdTaskId = '';
  let proofV1Id = '';
  let proofV2Id = '';

  try {
    // 0. Clean DB test records
    await Promise.all([
      User.deleteMany({ email: { $regex: /@ordertest\.vector/ } }),
      Employee.deleteMany({ email: { $regex: /@ordertest\.vector/ } }),
      Client.deleteMany({ clientCode: { $regex: /^CL-ORDTEST/ } }),
      ClientOrder.deleteMany({ projectTitle: { $regex: /Test 3D Pylon/ } }),
      DesignTask.deleteMany({ briefTitle: { $regex: /Test 3D Pylon/ } }),
      DesignProof.deleteMany({ 'presentationMedia.daylightMockupImageUrl': { $regex: /test-proof/ } })
    ]);

    // Seed test users & employees
    salesUser = await User.create({
      name: 'Sales Agent Order Test',
      email: 'sales@ordertest.vector',
      password: 'Password123!',
      roles: [ROLES.FRONTDESK, ROLES.EMPLOYEE],
      accountStatus: 'active'
    });
    salesToken = generateToken(salesUser._id);

    designerUser = await User.create({
      name: 'Lead Designer Test',
      email: 'designer@ordertest.vector',
      password: 'Password123!',
      roles: [ROLES.DESIGNER, ROLES.EMPLOYEE],
      accountStatus: 'active'
    });
    designerToken = generateToken(designerUser._id);

    managerUser = await User.create({
      name: 'Art Director & Manager Test',
      email: 'manager@ordertest.vector',
      password: 'Password123!',
      roles: [ROLES.MANAGER, ROLES.COO],
      accountStatus: 'active'
    });
    managerToken = generateToken(managerUser._id);

    salesEmployee = await Employee.create({
      employeeNumber: 'EMP-SALES-02',
      name: { first: 'Sara', last: 'Kebede' },
      email: 'sara@ordertest.vector',
      primaryPhone: '+251911770001',
      department: new mongoose.Types.ObjectId(),
      position: 'Senior Account Manager',
      hireDate: new Date(),
      employmentStatus: 'active'
    });

    designerEmployee = await Employee.create({
      employeeNumber: 'EMP-DSN-02',
      name: { first: 'Dawit', last: 'Bekele' },
      email: 'dawit@ordertest.vector',
      primaryPhone: '+251911770002',
      department: new mongoose.Types.ObjectId(),
      position: '3D Signage Visualizer & CAM Programmer',
      hireDate: new Date(),
      employmentStatus: 'active'
    });

    testClient = await Client.create({
      clientCode: 'CL-ORDTEST-01',
      displayName: 'Wegagen Bank HQ',
      legalName: 'Wegagen Bank Share Company',
      clientType: 'corporate',
      industry: 'banking_finance',
      primaryPhone: '+251911770099',
      address: {
        subcity: 'Kirkos',
        landmark: 'Wegagen Tower, Stadium'
      },
      createdBy: salesUser._id
    });

    console.log('✓ Seeded test credentials, employees, and test client\n');

    // ==========================================
    // 1. Client Order Configuration Tests
    // ==========================================
    console.log('--- Testing Client Order Configuration ---');

    // 1.1 Validation error on invalid payload
    const invalidOrderRes = await fetch(`${BASE_URL}/api/client-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        clientId: testClient._id,
        projectTitle: 'Missing items'
        // Missing orderType, requestedItems, salesAccountManager
      })
    });
    const invalidOrderData = await invalidOrderRes.json();
    if (invalidOrderRes.status !== 400 || !invalidOrderData.errors) {
      throw new Error(`Expected 400 for incomplete order, got ${invalidOrderRes.status}`);
    }
    console.log('✓ Incomplete client order rejected with 400 validation errors');

    // 1.2 Create valid commercial client order
    const orderPayload = {
      clientId: testClient._id,
      projectTitle: 'Wegagen Test 3D Pylon & Channel Letters',
      orderType: '3d_channel_letters_acrylic',
      priority: 'urgent',
      estimatedCompletionDate: new Date(Date.now() + 14 * 86400000),
      salesAccountManager: salesEmployee._id,
      requestedItems: [
        {
          itemCode: 'ITEM-01',
          productCategory: '3d_channel_letters_acrylic',
          itemTitle: 'Wegagen 3D Illuminated Channel Letters',
          detailedDescription: 'Front-lit cast acrylic faces with 0.8mm brushed gold titanium metal returns',
          quantity: 1,
          dimensions: {
            widthCm: 500,
            heightCm: 100,
            depthReturnCm: 10
          },
          initialMaterialSpecifications: {
            faceMaterial: '3mm Cast Opal Acrylic #433',
            returnSideMaterial: '0.8mm Brushed Gold Titanium Coil',
            backerMaterial: '10mm PVC Foam Board CNC routed',
            ledModuleSpecs: 'Samsung 1.2W 6500K IP67 with MeanWell LPV-150-12'
          },
          unitPrice: 150000,
          totalPrice: 150000
        },
        {
          itemCode: 'ITEM-02',
          productCategory: 'pylon_totem_signage',
          itemTitle: 'Entrance Directional Pylon Totem',
          quantity: 2,
          dimensions: {
            widthCm: 120,
            heightCm: 250,
            depthReturnCm: 20
          },
          unitPrice: 40000,
          totalPrice: 80000
        }
      ],
      commercial: {
        discountAmount: 10000,
        vatRatePercentage: 15,
        advanceDepositRequiredPercentage: 50
      },
      fulfillmentMethod: 'on_site_installation',
      deliveryAddress: 'Wegagen Tower, Stadium Square, Addis Ababa'
    };

    const createOrderRes = await fetch(`${BASE_URL}/api/client-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify(orderPayload)
    });
    const createOrderData = await createOrderRes.json();
    if (createOrderRes.status !== 201 || !createOrderData.data?.orderNumber) {
      throw new Error(`Failed to create client order: ${JSON.stringify(createOrderData)}`);
    }
    createdOrderId = createOrderData.data._id;
    const commercial = createOrderData.data.commercial;

    // Commercial calculation checks:
    // Subtotal: 150,000 + 80,000 = 230,000
    // Discount: 10,000
    // Taxable: 220,000
    // VAT 15%: 33,000
    // Grand Total: 253,000
    // Advance Deposit 50%: 126,500
    if (commercial.subtotal !== 230000) throw new Error(`Expected subtotal 230,000, got ${commercial.subtotal}`);
    if (commercial.taxableAmount !== 220000) throw new Error(`Expected taxable 220,000, got ${commercial.taxableAmount}`);
    if (commercial.vatAmount !== 33000) throw new Error(`Expected VAT 33,000, got ${commercial.vatAmount}`);
    if (commercial.grandTotal !== 253000) throw new Error(`Expected grandTotal 253,000, got ${commercial.grandTotal}`);
    if (commercial.advanceDepositAmountRequired !== 126500) {
      throw new Error(`Expected deposit 126,500, got ${commercial.advanceDepositAmountRequired}`);
    }
    console.log(`✓ Created client order: ${createOrderData.data.orderNumber} (Grand Total: 253,000 ETB, Deposit Required: 126,500 ETB)`);

    // 1.3 Query client orders list with search
    const getOrdersRes = await fetch(`${BASE_URL}/api/client-orders?search=Wegagen&priority=urgent`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const getOrdersData = await getOrdersRes.json();
    if (getOrdersRes.status !== 200 || getOrdersData.data.length === 0) {
      throw new Error('Failed to query orders by search filter');
    }
    console.log(`✓ Queried client orders with search filter (Found: ${getOrdersData.meta.total})`);

    // 1.4 Get order by ID
    const getOrderByIdRes = await fetch(`${BASE_URL}/api/client-orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const getOrderByIdData = await getOrderByIdRes.json();
    if (getOrderByIdRes.status !== 200 || getOrderByIdData.data.orderNumber !== createOrderData.data.orderNumber) {
      throw new Error('Failed to retrieve order by ID');
    }
    console.log('✓ Retrieved order by ID with populated client & sales manager');

    // ==========================================
    // 2. Design Task Assignment & Progress Tests
    // ==========================================
    console.log('\n--- Testing Design Task Assignment & Progress ---');

    // 2.1 Assign design task
    const taskPayload = {
      assignedDesigner: designerEmployee._id,
      artDirector: managerUser._id,
      briefTitle: 'Wegagen Test 3D Pylon & Facade Letters 3D CAD Mockup',
      clientBrandAssets: {
        brandLogoVectorUrl: '/uploads/assets/wegagen-logo.svg',
        brandFonts: ['Helvetica Neue Bold', 'Century Gothic'],
        brandColorCodes: ['#FFC20E', '#002B49'],
        clientNotes: 'Strict adherence to 3D halo glow color temperature (6500K Pure White)'
      },
      technicalDeliverablesRequired: {
        requires3dDaylightRender: true,
        requires3dNightIlluminatedRender: true,
        requiresCncVectorCutPaths: true,
        requires1to1MountingPaperStencil: true,
        requiresWiringDiagram: true
      },
      targetCompletionDate: new Date(Date.now() + 3 * 86400000)
    };

    const assignTaskRes = await fetch(`${BASE_URL}/api/client-orders/${createdOrderId}/assign-design`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify(taskPayload)
    });
    const assignTaskData = await assignTaskRes.json();
    if (assignTaskRes.status !== 201 || !assignTaskData.data.taskCode) {
      throw new Error(`Failed to assign design task: ${JSON.stringify(assignTaskData)}`);
    }
    createdTaskId = assignTaskData.data._id;
    console.log(`✓ Assigned design task: ${assignTaskData.data.taskCode} (Designer assigned: Dawit Bekele)`);

    // Verify order status updated to in_design
    const orderAfterDesign = await ClientOrder.findById(createdOrderId);
    if (orderAfterDesign.status !== 'in_design' || !orderAfterDesign.designTask.designTaskId) {
      throw new Error(`Client order status was not updated to in_design (Current: ${orderAfterDesign.status})`);
    }
    console.log('✓ Client order automatically updated to "in_design" state');

    // 2.2 Update design task status
    const updateTaskRes = await fetch(`${BASE_URL}/api/design-tasks/${createdTaskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${designerToken}`
      },
      body: JSON.stringify({
        status: 'in_progress',
        startedAt: new Date(),
        totalDesignHours: 4.5
      })
    });
    const updateTaskData = await updateTaskRes.json();
    if (updateTaskRes.status !== 200 || updateTaskData.data.status !== 'in_progress') {
      throw new Error('Failed to update design task status');
    }
    console.log('✓ Designer updated task status to "in_progress" (Logged 4.5 hours)');

    // ==========================================
    // 3. Design Proof Versioning & Approval Tests
    // ==========================================
    console.log('\n--- Testing Design Proof Versioning ($V_1 \\rightarrow V_2$) ---');

    // 3.1 Submit initial proof V1
    const proofV1Payload = {
      presentationMedia: {
        daylightMockupImageUrl: '/uploads/test-proof/wegagen-daylight-v1.jpg',
        nightIlluminatedMockupImageUrl: '/uploads/test-proof/wegagen-night-v1.jpg',
        technicalDrawingPdfUrl: '/uploads/test-proof/wegagen-drawing-v1.pdf'
      },
      productionFiles: {
        cncLaserVectorCutUrl: '/uploads/cut-files/wegagen-face-cut-v1.dxf',
        letterFaceCutPath: '/uploads/cut-files/face-v1.dxf',
        letterBackerCutPath: '/uploads/cut-files/backer-v1.dxf'
      },
      engineeringSpecs: {
        overallWidthCm: 500,
        overallHeightCm: 100,
        strokeWidthMm: 22,
        returnDepthCm: 10,
        acrylicThicknessMm: 3,
        backerThicknessMm: 10,
        calculatedTotalLedModules: 140,
        calculatedTotalWattage: 168,
        recommendedPowerSupplyCapacityWatts: 240,
        transformerCount: 2
      }
    };

    const submitProofV1Res = await fetch(`${BASE_URL}/api/design-tasks/${createdTaskId}/proofs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${designerToken}`
      },
      body: JSON.stringify(proofV1Payload)
    });
    const submitProofV1Data = await submitProofV1Res.json();
    if (submitProofV1Res.status !== 201 || submitProofV1Data.data.versionNumber !== 1) {
      throw new Error(`Failed to submit proof V1: ${JSON.stringify(submitProofV1Data)}`);
    }
    proofV1Id = submitProofV1Data.data._id;
    console.log(`✓ Submitted initial proof: ${submitProofV1Data.data.proofCode} (Version: ${submitProofV1Data.data.versionNumber}, Current: ${submitProofV1Data.data.isCurrentVersion})`);

    // Verify order status moved to proof_under_client_review
    const orderUnderReview = await ClientOrder.findById(createdOrderId);
    if (orderUnderReview.status !== 'proof_under_client_review') {
      throw new Error(`Expected order status proof_under_client_review, got ${orderUnderReview.status}`);
    }
    console.log('✓ Order status automatically moved to "proof_under_client_review"');

    // 3.2 Client requests revision on V1
    const revisionRes = await fetch(`${BASE_URL}/api/design-proofs/${proofV1Id}/client-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        isApproved: false,
        reviewedByClientContactName: 'Mulugeta Assefa (Brand Director)',
        revisionCategory: 'dimension_scaling',
        feedbackNotes: 'Please increase height by 15cm so letter ratio matches the new corporate visual guide.'
      })
    });
    const revisionData = await revisionRes.json();
    if (revisionRes.status !== 200 || revisionData.data.status !== 'revision_requested') {
      throw new Error(`Failed to process client revision request: ${JSON.stringify(revisionData)}`);
    }
    console.log('✓ Processed client revision request: status set to "revision_requested"');

    // 3.3 Submit revised proof V2
    const proofV2Payload = {
      presentationMedia: {
        daylightMockupImageUrl: '/uploads/test-proof/wegagen-daylight-v2.jpg',
        nightIlluminatedMockupImageUrl: '/uploads/test-proof/wegagen-night-v2.jpg',
        technicalDrawingPdfUrl: '/uploads/test-proof/wegagen-drawing-v2.pdf'
      },
      productionFiles: {
        cncLaserVectorCutUrl: '/uploads/cut-files/wegagen-face-cut-v2.dxf',
        letterFaceCutPath: '/uploads/cut-files/face-v2.dxf',
        letterBackerCutPath: '/uploads/cut-files/backer-v2.dxf',
        fullScalePaperStencilPdfUrl: '/uploads/stencils/stencil-1to1-v2.pdf',
        ledLayoutWiringPdfUrl: '/uploads/wiring/led-schematic-v2.pdf'
      },
      engineeringSpecs: {
        overallWidthCm: 500,
        overallHeightCm: 115, // Adjusted per client revision
        strokeWidthMm: 24,
        returnDepthCm: 10,
        acrylicThicknessMm: 3,
        backerThicknessMm: 10,
        calculatedTotalLedModules: 160,
        calculatedTotalWattage: 192,
        recommendedPowerSupplyCapacityWatts: 240,
        transformerCount: 2
      }
    };

    const submitProofV2Res = await fetch(`${BASE_URL}/api/design-tasks/${createdTaskId}/proofs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${designerToken}`
      },
      body: JSON.stringify(proofV2Payload)
    });
    const submitProofV2Data = await submitProofV2Res.json();
    if (submitProofV2Res.status !== 201 || submitProofV2Data.data.versionNumber !== 2) {
      throw new Error(`Failed to submit proof V2: ${JSON.stringify(submitProofV2Data)}`);
    }
    proofV2Id = submitProofV2Data.data._id;
    console.log(`✓ Submitted revised proof: ${submitProofV2Data.data.proofCode} (Version: 2, Height updated: 115cm)`);

    // Verify V1 is now superseded / not current version
    const updatedV1 = await DesignProof.findById(proofV1Id);
    if (updatedV1.isCurrentVersion !== false) {
      throw new Error(`Expected proof V1 isCurrentVersion to be false, got ${updatedV1.isCurrentVersion}`);
    }
    console.log('✓ Proof V1 isCurrentVersion successfully archived to false');

    // 3.4 Client formally approves proof V2
    const approveProofRes = await fetch(`${BASE_URL}/api/design-proofs/${proofV2Id}/client-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        isApproved: true,
        approverFullName: 'Mulugeta Assefa',
        approverJobTitle: 'Marketing & Brand Director',
        approvalMethod: 'signed_proof_sheet_pdf',
        signatureImageUrl: '/uploads/signatures/mulugeta-sign.png',
        signedProofDocumentUrl: '/uploads/signed-proofs/signed-proof-wegagen-v2.pdf'
      })
    });
    const approveProofData = await approveProofRes.json();
    if (approveProofRes.status !== 200 || !approveProofData.data.clientApproval.isApproved) {
      throw new Error(`Failed to record client proof approval: ${JSON.stringify(approveProofData)}`);
    }
    console.log('✓ Recorded client formal approval on Proof V2 (Signed PDF & signature stored)');

    // 3.5 Lock approved proof V2 for production release
    const lockProofRes = await fetch(`${BASE_URL}/api/design-proofs/${proofV2Id}/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      }
    });
    const lockProofData = await lockProofRes.json();
    if (lockProofRes.status !== 200 || !lockProofData.data.isLockedForProduction) {
      throw new Error(`Failed to lock proof for production: ${JSON.stringify(lockProofData)}`);
    }
    console.log(`✓ Proof V2 locked for factory production (${lockProofData.data.proofCode})`);

    // Verify ClientOrder agreedDesignProofId is set to V2 and status is design_agreed
    const finalOrder = await ClientOrder.findById(createdOrderId);
    if (!finalOrder.designTask.agreedDesignProofId.equals(proofV2Id) || finalOrder.status !== 'design_agreed') {
      throw new Error(`Client order was not linked to locked proof V2 (Order status: ${finalOrder.status})`);
    }
    console.log('✓ Client order linked to locked proof V2 and status set to "design_agreed"');

    // 3.6 Attempt to modify a locked proof (Should be blocked with 400)
    const lockedMutationRes = await fetch(`${BASE_URL}/api/design-proofs/${proofV2Id}/client-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        isApproved: false,
        feedbackNotes: 'Trying to modify after lock'
      })
    });
    if (lockedMutationRes.status !== 400) {
      throw new Error(`Expected 400 when attempting to mutate locked proof, got ${lockedMutationRes.status}`);
    }
    console.log('✓ Mutation of production-locked proof blocked with 400 error');

    console.log('\n🎉 ALL PHASE 2 COMMERCIAL ORDERS & DESIGN TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (error) {
    console.error('\n❌ Test run failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('Closed server and disconnected test MongoDB connection');
  }
}

runTests();
