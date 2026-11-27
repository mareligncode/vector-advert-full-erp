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
import productionWastageRoutes, {
  staffReturnJobRoutes,
  workshopRequisitionRoutes
} from '../routes/productionWastageRoutes.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import ClientOrder from '../models/ClientOrder.js';
import JobOrder from '../models/JobOrder.js';
import StockItem from '../models/StockItem.js';
import StockBalance from '../models/StockBalance.js';
import StockMovement from '../models/StockMovement.js';
import Warehouse from '../models/Warehouse.js';
import StaffRequest from '../models/StaffRequest.js';
import StaffReturn from '../models/StaffReturn.js';
import ProductionWastage from '../models/ProductionWastage.js';
import { ROLES } from '../constants/roles.js';
import { generateToken } from '../middleware/authMiddleware.js';

dotenv.config();

const PORT = 5100;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🚀 Starting Closed-Loop Production Materials & Wastage (Phase 5) Integration Tests...\n');

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
  app.use('/api/production-wastage', productionWastageRoutes);
  app.use('/api/staff-returns', staffReturnJobRoutes);
  app.use('/api/store-requests', workshopRequisitionRoutes);

  // Central error handler
  app.use((err, req, res, next) => {
    console.error('Test Server Error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  const server = app.listen(PORT);
  console.log(`Test server running on ${BASE_URL}\n`);

  let supervisorToken = '';
  let storekeeperToken = '';
  let financeToken = '';
  let supervisorUser = null;
  let storekeeperUser = null;
  let financeUser = null;
  let supervisorEmployee = null;
  let testWarehouse = null;
  let acrylicStockItem = null;
  let ledStockItem = null;
  let testClient = null;
  let testOrder = null;
  let testJobOrder = null;
  let testRequisition = null;
  let testWastage = null;

  try {
    console.log('--- 0. Seeding Authentication, Warehouse & Catalog Entities ---');
    await Promise.all([
      User.deleteMany({ email: { $regex: /@p5test\.vector/ } }),
      Employee.deleteMany({ email: { $regex: /@p5test\.vector/ } }),
      Client.deleteMany({ clientCode: 'CL-P5-001' }),
      Warehouse.deleteMany({ code: 'WH-MAIN-P5' }),
      StockItem.deleteMany({ code: { $in: ['STK-ACR-10MM', 'STK-LED-3000K'] } }),
      JobOrder.deleteMany({ projectTitle: { $regex: /CBE ATM/ } }),
      ClientOrder.deleteMany({ projectTitle: { $regex: /CBE ATM/ } }),
      ProductionWastage.deleteMany({ incidentSummary: { $regex: /broken endmill bit/ } })
    ]);

    supervisorEmployee = await Employee.create({
      employeeNumber: 'EMP-P5-SUP',
      name: { first: 'Haile', last: 'Girma' },
      email: 'haile@p5test.vector',
      primaryPhone: '+251911334455',
      department: new mongoose.Types.ObjectId(),
      position: 'Senior Workshop Production Engineer',
      employmentStatus: 'active',
      hireDate: new Date()
    });

    supervisorUser = await User.create({
      name: 'Haile Girma (Workshop Supervisor)',
      email: 'supervisor@p5test.vector',
      password: 'Password123!',
      roles: [ROLES.MANAGER, ROLES.EMPLOYEE],
      accountStatus: 'active',
      employeeId: supervisorEmployee._id
    });

    storekeeperUser = await User.create({
      name: 'Abel Tesfaye (Storekeeper)',
      email: 'storekeeper@p5test.vector',
      password: 'Password123!',
      roles: [ROLES.STOREKEEPER, ROLES.EMPLOYEE],
      accountStatus: 'active',
      employeeId: supervisorEmployee._id
    });

    financeUser = await User.create({
      name: 'Meron Belay (Cost Accountant)',
      email: 'finance@p5test.vector',
      password: 'Password123!',
      roles: [ROLES.FINANCE, ROLES.EMPLOYEE],
      accountStatus: 'active',
      employeeId: supervisorEmployee._id
    });

    supervisorToken = generateToken(supervisorUser._id);
    storekeeperToken = generateToken(storekeeperUser._id);
    financeToken = generateToken(financeUser._id);

    console.log('✓ Users, employees, and tokens initialized');

    // Create warehouse
    testWarehouse = await Warehouse.create({
      name: 'Central Raw Materials Warehouse',
      code: 'WH-MAIN-P5',
      type: 'raw_materials',
      status: 'active'
    });

    // Create catalog stock items
    acrylicStockItem = await StockItem.create({
      code: 'STK-ACR-10MM',
      name: 'Cast Clear Acrylic Sheet 10mm (122x244cm)',
      unit: 'sheet',
      baseUnit: 'sheet',
      category: 'Sheet Materials',
      averageUnitCost: 5000,
      stockStatus: 'in_stock'
    });

    ledStockItem = await StockItem.create({
      code: 'STK-LED-3000K',
      name: 'Samsung 3-LED Module 3000K Warm White IP68',
      unit: 'pcs',
      baseUnit: 'pcs',
      category: 'Lighting & LEDs',
      averageUnitCost: 45,
      stockStatus: 'in_stock'
    });

    // Seed stock balances
    await StockBalance.create({
      stockItemId: acrylicStockItem._id,
      warehouseId: testWarehouse._id,
      balanceQuantity: 50,
      balanceTotalQuantity: 50,
      availableQuantity: 50,
      availableTotalQuantity: 50
    });

    await StockBalance.create({
      stockItemId: ledStockItem._id,
      warehouseId: testWarehouse._id,
      balanceQuantity: 1000,
      balanceTotalQuantity: 1000,
      availableQuantity: 1000,
      availableTotalQuantity: 1000
    });

    console.log('✓ Warehouse and stock balances initialized');

    // Create client & client order
    testClient = await Client.create({
      clientCode: 'CL-P5-001',
      displayName: 'Commercial Bank of Ethiopia (Retail Banking)',
      legalName: 'Commercial Bank of Ethiopia',
      clientType: 'corporate',
      industry: 'banking_finance',
      primaryPhone: '+251911223344',
      address: {
        country: 'Ethiopia',
        city: 'Addis Ababa',
        subcity: 'Kirkos',
        landmark: 'CBE Head Office Tower'
      },
      accountManager: supervisorEmployee._id,
      createdBy: supervisorUser._id
    });

    testOrder = await ClientOrder.create({
      orderNumber: 'ORD-2026-P5-01',
      clientId: testClient._id,
      projectTitle: 'CBE ATM Kiosk Illuminated Canopy Signage',
      orderType: 'backlit_lightbox',
      priority: 'normal',
      estimatedCompletionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      salesAccountManager: supervisorEmployee._id,
      commercial: {
        subtotal: 100000,
        taxableAmount: 100000,
        vatRatePercentage: 15,
        vatAmount: 15000,
        grandTotal: 115000,
        advanceDepositAmountRequired: 57500,
        advanceDepositAmountPaid: 57500
      },
      productionClearance: {
        financialClearanceStatus: 'cleared_for_production',
        isProductionAuthorized: true
      },
      createdBy: supervisorUser._id
    });

    // Create JobOrder with initial material cost 50,000 ETB
    testJobOrder = await JobOrder.create({
      jobOrderNumber: 'JOB-2026-P5-01',
      orderId: testOrder._id,
      clientId: testClient._id,
      approvedDesignProofId: new mongoose.Types.ObjectId(),
      projectTitle: testOrder.projectTitle,
      status: 'queued_for_materials',
      priority: 'normal',
      scheduledStartDate: new Date(),
      targetCompletionDate: testOrder.estimatedCompletionDate,
      fulfillment: { deliveryMethod: 'on_site_installation' },
      materialRequisition: {
        materialsAllocated: false,
        actualMaterialCostETB: 50000 // Initial material issuance baseline
      },
      workshopSupervisor: supervisorEmployee._id,
      authorizedBy: supervisorUser._id
    });

    console.log(`✓ JobOrder seeded: ${testJobOrder.jobOrderNumber} (Baseline Material Cost: ${testJobOrder.materialRequisition.actualMaterialCostETB} ETB)\n`);

    // ==========================================
    // Test 1: Submit Workshop Material Requisition
    // ==========================================
    console.log('--- Test 1: Submit Workshop Material Requisition (StaffRequest) ---');
    const reqRes = await fetch(`${BASE_URL}/api/store-requests/workshop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supervisorToken}`
      },
      body: JSON.stringify({
        jobOrderId: testJobOrder._id,
        warehouseId: testWarehouse._id,
        purpose: 'Raw materials for CBE ATM Canopy face and backer routing',
        items: [
          {
            stockItemId: acrylicStockItem._id,
            itemName: acrylicStockItem.name,
            requestedQuantity: 5,
            unit: 'sheet'
          },
          {
            stockItemId: ledStockItem._id,
            itemName: ledStockItem.name,
            requestedQuantity: 200,
            unit: 'pcs'
          }
        ]
      })
    });

    const reqData = await reqRes.json();
    if (!reqRes.ok) throw new Error(`Workshop requisition failed: ${JSON.stringify(reqData)}`);

    testRequisition = reqData.data.staffRequest;
    console.log(`✓ Workshop requisition created: ${testRequisition.requestCode} (Type: ${testRequisition.requestType})`);
    console.log(`✓ Linked JobOrder: ${testRequisition.jobOrderNumber}`);

    if (!testRequisition.requestCode.startsWith('REQ-')) throw new Error('Expected REQ- prefix');
    if (testRequisition.requestType !== 'workshop') throw new Error('Expected workshop requestType');
    if (testRequisition.items.length !== 2) throw new Error('Expected 2 items in requisition');

    const updatedJobOrder = await JobOrder.findById(testJobOrder._id);
    if (!updatedJobOrder.materialRequisition.materialsAllocated) {
      throw new Error('Expected JobOrder materialsAllocated to be true');
    }
    console.log('✓ Workshop StaffRequest created and linked to JobOrder traveler\n');

    // ==========================================
    // Test 2: Return 1 Unused Acrylic Sheet (StaffReturn) & Direct Cost Crediting
    // ==========================================
    console.log('--- Test 2: Return 1 Unused Sheet to Store & Direct Cost Crediting ---');
    const returnRes = await fetch(`${BASE_URL}/api/staff-returns/job-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storekeeperToken}`
      },
      body: JSON.stringify({
        jobOrderId: testJobOrder._id,
        warehouseId: testWarehouse._id,
        staffRequestId: testRequisition._id,
        items: [
          {
            stockItemId: acrylicStockItem._id,
            returnedQuantity: 1,
            unit: 'sheet',
            unitCost: 5000,
            reason: 'Excess sheet not needed after high-yield nesting'
          }
        ],
        notes: '1 full intact 10mm acrylic sheet accepted back into main warehouse rack'
      })
    });

    const returnData = await returnRes.json();
    if (!returnRes.ok) throw new Error(`Staff return failed: ${JSON.stringify(returnData)}`);

    const staffReturn = returnData.data.staffReturn;
    const creditAmount = returnData.data.totalCreditETB;
    const creditedJobOrder = returnData.data.updatedJobOrder;

    console.log(`✓ StaffReturn processed: ${staffReturn.returnCode}`);
    console.log(`✓ Credited Amount: ${creditAmount} ETB`);
    console.log(`✓ JobOrder actual material cost updated: ${creditedJobOrder.materialRequisition.actualMaterialCostETB} ETB (from 50,000 ETB)`);

    if (creditAmount !== 5000) throw new Error(`Expected 5,000 ETB credit, got ${creditAmount}`);
    if (creditedJobOrder.materialRequisition.actualMaterialCostETB !== 45000) {
      throw new Error(`Expected actual material cost 45,000 ETB, got ${creditedJobOrder.materialRequisition.actualMaterialCostETB}`);
    }

    // Verify stock balance restored
    const balanceAfterReturn = await StockBalance.findOne({
      stockItemId: acrylicStockItem._id,
      warehouseId: testWarehouse._id
    });
    console.log(`✓ Warehouse acrylic stock balance restored: ${balanceAfterReturn.availableQuantity} sheets (was 50)`);
    if (balanceAfterReturn.availableQuantity !== 51) {
      throw new Error(`Expected balance 51, got ${balanceAfterReturn.availableQuantity}`);
    }

    // Verify StockMovement logged
    const movement = await StockMovement.findOne({ referenceType: 'StaffReturn' }).sort({ createdAt: -1 });
    if (!movement || movement.movementType !== 'staff_return') {
      throw new Error('Expected staff_return StockMovement to be recorded');
    }
    console.log(`✓ Immutable StockMovement recorded: ${movement.movementCode} (+${movement.quantityIn} ${movement.unit})\n`);

    // ==========================================
    // Test 3: Log Production Scrap Incident & Auto-Draft Supplemental Requisition (Rule 2)
    // ==========================================
    console.log('--- Test 3: Log Production Scrap & Auto-Draft Supplemental Requisition (Rule 2) ---');
    const wastageRes = await fetch(`${BASE_URL}/api/production-wastage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supervisorToken}`
      },
      body: JSON.stringify({
        jobOrderId: testJobOrder._id,
        warehouseId: testWarehouse._id,
        manufacturingStage: 'cnc_router_cutting',
        scrapCategory: 'machine_malfunction_ruin',
        incidentSummary: 'Spindle tool bit broke during 10mm acrylic pass, gouging the workpiece',
        rootCauseDescription: 'Aggressive feed rate combined with worn 4mm endmill collet caused tool chatter and bit snapped',
        correctiveActionTaken: 'Replaced collet, reduced feed rate by 20%, and recalibrated vacuum table hold-down pressure',
        costAllocation: 'absorb_in_job_order_cost',
        requiresMaterialReplenishment: true,
        items: [
          {
            stockItemId: acrylicStockItem._id,
            itemName: acrylicStockItem.name,
            quantityScrapped: 1,
            unit: 'sheet',
            unitCostETB: 5000,
            isReusableOffcut: true,
            salvageableDimensions: { widthCm: 60, heightCm: 120 },
            offcutStorageLocation: 'Workshop Scrap Rack Bay-A'
          }
        ]
      })
    });

    const wastageData = await wastageRes.json();
    if (!wastageRes.ok) throw new Error(`Wastage recording failed: ${JSON.stringify(wastageData)}`);

    testWastage = wastageData.data.productionWastage;
    const supplementalReq = wastageData.data.supplementalRequest;
    const orderAfterScrap = wastageData.data.jobOrder;

    console.log(`✓ Scrap incident recorded: ${testWastage.wastageCode} (Scrap Cost: ${testWastage.totalWastageCostETB} ETB)`);
    console.log(`✓ Cost absorbed into JobOrder: actual material cost = ${orderAfterScrap.materialRequisition.actualMaterialCostETB} ETB`);
    console.log(`✓ Auto-drafted supplemental requisition: ${supplementalReq?.requestCode} (isSupplemental: ${supplementalReq?.isSupplemental})`);

    if (!testWastage.wastageCode.startsWith('PST-')) throw new Error('Expected PST- prefix');
    if (testWastage.totalWastageCostETB !== 5000) throw new Error('Expected scrap cost 5,000 ETB');
    if (orderAfterScrap.materialRequisition.actualMaterialCostETB !== 50000) {
      throw new Error(`Expected actual material cost 50,000 ETB (45,000 + 5,000 scrap), got ${orderAfterScrap.materialRequisition.actualMaterialCostETB}`);
    }
    if (!supplementalReq || supplementalReq.isSupplemental !== true) {
      throw new Error('Expected auto-drafted supplemental StaffRequest with isSupplemental === true');
    }
    console.log('✓ Rule 2 verified: Scrap incident logged, cost absorbed, and supplemental requisition auto-drafted\n');

    // ==========================================
    // Test 4: Financial Write-off Verification
    // ==========================================
    console.log('--- Test 4: Financial Write-Off Sign-Off by Finance ---');
    const verifyRes = await fetch(`${BASE_URL}/api/production-wastage/${testWastage._id}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({
        status: 'financial_writeoff_approved'
      })
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) throw new Error('Failed to verify wastage');
    const verifiedWastage = verifyData.data;
    console.log(`✓ Wastage verified by Finance: status = ${verifiedWastage.status}`);
    if (verifiedWastage.status !== 'financial_writeoff_approved') {
      throw new Error('Expected status financial_writeoff_approved');
    }
    console.log('✓ Financial write-off sign-off verified\n');

    // ==========================================
    // Test 5: Closed-Loop Cost & Margin Analysis Report
    // ==========================================
    console.log('--- Test 5: Closed-Loop Cost & Margin Analysis Report ---');
    const costRes = await fetch(`${BASE_URL}/api/job-orders/${testJobOrder._id}/cost-summary`, {
      headers: { Authorization: `Bearer ${financeToken}` }
    });

    const costData = await costRes.json();
    if (!costRes.ok) throw new Error(`Cost summary failed: ${JSON.stringify(costData)}`);

    const summary = costData.data.closedLoopMaterialsSummary;
    const profitability = costData.data.commercialProfitability;

    console.log(`✓ Gross Material Issued: ${summary.grossIssuedCostETB} ETB`);
    console.log(`✓ Unused Materials Returned (Credited): ${summary.totalReturnedCostCreditETB} ETB`);
    console.log(`✓ Scrap & Wastage Incurred: ${summary.totalScrapCostETB} ETB`);
    console.log(`✓ Net Material Cost: ${summary.netMaterialCostETB} ETB`);
    console.log(`✓ Contract Revenue: ${profitability.contractRevenueETB} ETB`);
    console.log(`✓ Gross Profit Margin: ${profitability.grossProfitMarginETB} ETB (${profitability.grossProfitMarginPercentage}%)`);

    if (summary.totalReturnedCostCreditETB !== 5000) throw new Error('Expected 5,000 ETB returned credit');
    if (summary.totalScrapCostETB !== 5000) throw new Error('Expected 5,000 ETB scrap cost');
    if (profitability.contractRevenueETB !== 115000) throw new Error('Expected 115,000 ETB revenue');
    if (profitability.grossProfitMarginETB <= 0) throw new Error('Expected positive gross profit margin');
    console.log('✓ Closed-loop material balancing and profitability reporting verified\n');

    console.log('🎉 ALL PHASE 5 INTEGRATION TESTS PASSED 100% CLEANLY! 🎉\n');
  } catch (error) {
    console.error('❌ Phase 5 Integration Test Failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('MongoDB disconnected and test server stopped');
  }
}

runTests();
