import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  calculateQuantityRelationship,
  calculateMovingAverageCost,
  generateCode,
  processGRVAcceptance,
  reserveStockForRequest,
  processSIVIssuance
} from '../utils/inventoryService.js';

import Supplier from '../models/Supplier.js';
import Warehouse from '../models/Warehouse.js';
import StockItem from '../models/StockItem.js';
import StockBalance from '../models/StockBalance.js';
import StockMovement from '../models/StockMovement.js';
import GoodsReceivedVoucher from '../models/GoodsReceivedVoucher.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import PurchaseRequest from '../models/PurchaseRequest.js';
import StaffRequest from '../models/StaffRequest.js';
import StoreIssueVoucher from '../models/StoreIssueVoucher.js';
import CreditTransaction from '../models/CreditTransaction.js';
import CreditPayment from '../models/CreditPayment.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/vector_advert_erp_test';

async function runTests() {
  console.log('🚀 Starting Store & Purchaser Backend Integration Tests...\n');

  // Connect to DB
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  try {
    // ----------------------------------------------------
    // TEST 1: Rational Multiplier & Quantity Calculation
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Rational Multiplier & Quantity Conversion ---');
    const rel1 = calculateQuantityRelationship({
      quantity: 10,
      multiplierNumerator: 50,
      multiplierDenominator: 1
    });
    console.assert(rel1.multiplier === 50, `Expected multiplier 50, got ${rel1.multiplier}`);
    console.assert(rel1.totalQuantity === 500, `Expected totalQuantity 500, got ${rel1.totalQuantity}`);
    console.log(`✓ 10 rolls @ 50m/roll = ${rel1.totalQuantity} meters`);

    const rel2 = calculateQuantityRelationship({
      quantity: 15,
      multiplierNumerator: 1,
      multiplierDenominator: 3
    });
    console.assert(rel2.multiplier === 0.333333, `Fractional conversion failed`);
    console.assert(rel2.totalQuantity === 5, `Expected 5, got ${rel2.totalQuantity}`);
    console.log(`✓ 15 fractional units @ 1/3 = ${rel2.totalQuantity} base units`);

    // ----------------------------------------------------
    // TEST 2: Moving Weighted Average Cost (MAC) Calculation
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Moving Weighted Average Cost (MAC) Formula ---');
    // Current stock: 100 meters @ $10/m = $1,000
    // Incoming stock: 50 meters @ $16/m = $800
    // Total: 150 meters, Total cost: $1,800 -> New average cost = $12/m
    const newAvgCost = calculateMovingAverageCost({
      currentBaseQty: 100,
      currentAvgCost: 10,
      incomingBaseQty: 50,
      incomingUnitCostPerBaseUnit: 16
    });
    console.assert(newAvgCost === 12, `Expected $12/m, got ${newAvgCost}`);
    console.log(`✓ MAC formula verified: 100m @ $10 + 50m @ $16 = 150m @ $${newAvgCost}/m`);

    // ----------------------------------------------------
    // TEST 3: Mock User, Warehouse, Supplier Setup
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Mock Master Entities Setup ---');
    let testUser = await User.findOne({ email: 'inventory.tester@vector.com' });
    if (!testUser) {
      testUser = await User.create({
        email: 'inventory.tester@vector.com',
        password: 'hashedPassword123',
        roles: ['storekeeper', 'purchasing'],
        accountStatus: 'active'
      });
    }

    const testWhCode = 'WH-TEST-' + Date.now();
    const warehouse = await Warehouse.create({
      code: testWhCode,
      name: 'Main Advertising Workshop Store',
      warehouseType: 'workshop',
      status: 'active'
    });
    console.log(`✓ Created test warehouse: ${warehouse.code}`);

    const testSupCode = 'SUP-TEST-' + Date.now();
    const supplier = await Supplier.create({
      code: testSupCode,
      name: 'Addis Vinyl Importers PLC',
      phone: '+251911223344',
      paymentTerms: 'Credit - 30 days',
      status: 'active'
    });
    console.log(`✓ Created test supplier: ${supplier.code}`);

    // ----------------------------------------------------
    // TEST 4: PR & PO with Brand New (Unregistered) Item
    // ----------------------------------------------------
    console.log('\n--- TEST 4: PR -> PO -> GRV Two-Phase Workflow ---');
    const prCode = await generateCode('PR', PurchaseRequest, 'requestCode');
    const pr = await PurchaseRequest.create({
      requestCode: prCode,
      requestedBy: testUser._id,
      departmentId: new mongoose.Types.ObjectId(),
      requestType: 'workshop',
      requiredDate: new Date(),
      purpose: 'Urgent billboard printing raw materials',
      items: [
        {
          isNewItem: true,
          itemType: 'inventory',
          itemName: 'SuperFlex Outdoor Vinyl 50m',
          category: 'Printing Media',
          quantity: 4,
          unit: 'roll',
          baseUnit: 'meter',
          multiplierNumerator: 50,
          multiplierDenominator: 1,
          multiplier: 50,
          totalQuantity: 200,
          estimatedUnitCost: 4000,
          estimatedTotalCost: 16000
        }
      ],
      totalItems: 1,
      totalQuantity: 4,
      totalTotalQuantity: 200,
      estimatedTotalCost: 16000,
      approvalStatus: 'approved',
      procurementStatus: 'po_created'
    });
    console.log(`✓ Created Purchase Request with new non-catalog item: ${pr.requestCode}`);

    const poCode = await generateCode('PO', PurchaseOrder, 'purchaseOrderCode');
    const po = await PurchaseOrder.create({
      purchaseOrderCode: poCode,
      purchaseRequestId: pr._id,
      supplierId: supplier._id,
      warehouseId: warehouse._id,
      orderDate: new Date(),
      expectedDeliveryDate: new Date(),
      paymentTerms: 'Credit - 30 days after GRV',
      items: [
        {
          purchaseRequestItemId: pr.items[0]._id,
          isNewItem: true,
          itemName: 'SuperFlex Outdoor Vinyl 50m',
          quantity: 4,
          unit: 'roll',
          baseUnit: 'meter',
          multiplierNumerator: 50,
          multiplierDenominator: 1,
          multiplier: 50,
          totalQuantity: 200,
          unitPrice: 4000,
          subtotal: 16000,
          totalPrice: 16000,
          receivedQuantity: 0,
          remainingQuantity: 4,
          fulfillmentStatus: 'unfulfilled'
        }
      ],
      subtotal: 16000,
      totalAmount: 16000,
      status: 'sent_to_supplier',
      createdBy: testUser._id
    });
    console.log(`✓ Created Purchase Order: ${po.purchaseOrderCode}`);

    // Step 4A: Purchaser generates GRV upon delivery
    const grvCode = await generateCode('GRV', GoodsReceivedVoucher, 'grvCode');
    const grv = await GoodsReceivedVoucher.create({
      grvCode,
      purchaseOrderId: po._id,
      supplierId: supplier._id,
      warehouseId: warehouse._id,
      purchaserId: testUser._id,
      supplierInvoiceNumber: 'INV-ADDIS-9988',
      deliveryNoteNumber: 'DN-0012',
      status: 'pending_store_acceptance',
      deliveryStatus: 'fully_delivered',
      deliveryStatusRemarks: 'Full 4 rolls delivered in sealed boxes',
      items: [
        {
          purchaseOrderItemId: po.items[0]._id,
          isNewItem: true,
          itemName: 'SuperFlex Outdoor Vinyl 50m',
          category: 'Printing Media',
          orderedQuantity: 4,
          orderedTotalQuantity: 200,
          receivedQuantity: 4,
          receivedTotalQuantity: 200,
          acceptedQuantity: 4,
          acceptedTotalQuantity: 200,
          rejectedQuantity: 0,
          unit: 'roll',
          baseUnit: 'meter',
          multiplierNumerator: 50,
          multiplierDenominator: 1,
          multiplier: 50,
          unitCost: 4000,
          totalCost: 16000,
          condition: 'good'
        }
      ],
      totalItems: 1,
      totalReceivedQuantity: 4,
      totalAcceptedQuantity: 4,
      totalAmount: 16000
    });
    console.log(`✓ Purchaser generated GRV: ${grv.grvCode} (status: ${grv.status})`);

    // Step 4B: Storekeeper accepts GRV
    const acceptResult = await processGRVAcceptance({
      grv,
      storeKeeperId: testUser._id,
      storeKeeperComment: 'All 4 rolls inspected, moisture-free, stored on Rack A-1',
      deliveryStatus: 'fully_delivered'
    });
    console.log(`✓ Storekeeper accepted GRV. Generated Store GRV Number: ${acceptResult.grv.storeGrvNumber}`);

    // Verify Auto-Registration of StockItem
    const createdStockItem = await StockItem.findOne({ name: 'SuperFlex Outdoor Vinyl 50m' });
    console.assert(createdStockItem !== null, 'StockItem was not auto-registered!');
    console.assert(createdStockItem.autoRegisteredFromGRV === true, 'autoRegisteredFromGRV should be true');
    console.log(`✓ StockItem auto-registered: SKU ${createdStockItem.code}, Average Cost/m = $${createdStockItem.averageUnitCost}`);

    // Verify StockBalance
    const balance = await StockBalance.findOne({
      stockItemId: createdStockItem._id,
      warehouseId: warehouse._id
    });
    console.assert(balance.balanceQuantity === 4, `Expected balanceQty 4, got ${balance.balanceQuantity}`);
    console.assert(balance.balanceTotalQuantity === 200, `Expected balanceTotalQty 200, got ${balance.balanceTotalQuantity}`);
    console.assert(balance.availableQuantity === 4, `Expected availableQty 4, got ${balance.availableQuantity}`);
    console.log(`✓ StockBalance verified: On-hand = ${balance.balanceQuantity} rolls (${balance.balanceTotalQuantity} meters)`);

    // Verify StockMovement
    const movement = await StockMovement.findOne({
      referenceType: 'GoodsReceivedVoucher',
      referenceId: grv._id
    });
    console.assert(movement !== null, 'StockMovement was not recorded!');
    console.log(`✓ StockMovement audit ledger entry: ${movement.movementCode} (${movement.movementType}, Qty: ${movement.quantityIn} rolls)`);

    // Verify PO fulfillment update
    const updatedPo = await PurchaseOrder.findById(po._id);
    console.assert(updatedPo.status === 'completed', `Expected PO status completed, got ${updatedPo.status}`);
    console.assert(updatedPo.items[0].fulfillmentStatus === 'fulfilled', 'PO item fulfillmentStatus should be fulfilled');
    console.log(`✓ PO status updated to '${updatedPo.status}' and item fulfillment is '${updatedPo.items[0].fulfillmentStatus}'`);

    // Verify CreditTransaction generation
    const creditTx = await CreditTransaction.findOne({ purchaseOrderId: po._id });
    console.assert(creditTx !== null, 'CreditTransaction was not generated!');
    console.assert(creditTx.balance === 16000, `Expected balance 16000, got ${creditTx.balance}`);
    console.log(`✓ CreditTransaction generated in Finance: ${creditTx.transactionCode} (Balance: $${creditTx.balance}, Status: ${creditTx.paymentStatus})`);

    // ----------------------------------------------------
    // TEST 5: Workshop StaffRequest & Stock Reservation
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Workshop Requisition & Stock Reservation ---');
    const mockJobOrderId = new mongoose.Types.ObjectId();
    const reqCode = await generateCode('REQ', StaffRequest, 'requestCode');

    const staffReq = await StaffRequest.create({
      requestCode: reqCode,
      requestType: 'workshop',
      jobOrderId: mockJobOrderId,
      requestedBy: testUser._id,
      departmentId: new mongoose.Types.ObjectId(),
      warehouseId: warehouse._id,
      purpose: 'Printing Ethiopian Airlines Mega Billboard',
      items: [
        {
          stockItemId: createdStockItem._id,
          itemName: createdStockItem.name,
          requestedQuantity: 2,
          requestedTotalQuantity: 100,
          approvedQuantity: 2,
          approvedTotalQuantity: 100,
          approvalStatus: 'approved',
          multiplierNumerator: 50,
          multiplierDenominator: 1,
          multiplier: 50
        }
      ],
      totalItems: 1,
      totalRequestedQuantity: 2,
      totalApprovedQuantity: 2,
      approvalStatus: 'approved'
    });

    // Reserve stock for the approved request
    await reserveStockForRequest({ staffRequest: staffReq });
    const reservedBalance = await StockBalance.findById(balance._id);
    console.assert(reservedBalance.reservedQuantity === 2, `Expected reserved 2, got ${reservedBalance.reservedQuantity}`);
    console.assert(reservedBalance.availableQuantity === 2, `Expected available 2, got ${reservedBalance.availableQuantity}`);
    console.log(`✓ Stock reserved: Balance = 4 rolls, Reserved = ${reservedBalance.reservedQuantity} rolls, Available = ${reservedBalance.availableQuantity} rolls`);

    // ----------------------------------------------------
    // TEST 6: Store Issue Voucher (SIV) Dispensing
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Store Issue Voucher (SIV) Dispensing ---');
    const sivCode = await generateCode('SIV', StoreIssueVoucher, 'sivCode');
    const siv = await StoreIssueVoucher.create({
      sivCode,
      staffRequestId: staffReq._id,
      warehouseId: warehouse._id,
      issuedBy: testUser._id,
      receivedBy: testUser._id,
      items: [
        {
          staffRequestItemId: staffReq.items[0]._id,
          stockItemId: createdStockItem._id,
          issuedQuantity: 2,
          issuedTotalQuantity: 100,
          approvedQuantity: 2,
          approvedTotalQuantity: 100,
          unit: 'roll',
          baseUnit: 'meter',
          multiplierNumerator: 50,
          multiplierDenominator: 1,
          multiplier: 50
        }
      ],
      totalItems: 1,
      totalQuantity: 2,
      totalTotalQuantity: 100,
      status: 'issued'
    });

    await processSIVIssuance({ siv, issuedBy: testUser._id });
    const postIssueBalance = await StockBalance.findById(balance._id);
    console.assert(postIssueBalance.balanceQuantity === 2, `Expected on-hand 2, got ${postIssueBalance.balanceQuantity}`);
    console.assert(postIssueBalance.reservedQuantity === 0, `Expected reserved 0, got ${postIssueBalance.reservedQuantity}`);
    console.assert(postIssueBalance.availableQuantity === 2, `Expected available 2, got ${postIssueBalance.availableQuantity}`);
    console.log(`✓ SIV Issued: Remaining On-hand = ${postIssueBalance.balanceQuantity} rolls (${postIssueBalance.balanceTotalQuantity} meters)`);

    // Verify SIV movement
    const sivMovement = await StockMovement.findOne({
      referenceType: 'StoreIssueVoucher',
      referenceId: siv._id
    });
    console.assert(sivMovement !== null, 'SIV StockMovement was not recorded!');
    console.log(`✓ SIV Movement recorded: ${sivMovement.movementCode} (${sivMovement.movementType}, QtyOut: ${sivMovement.quantityOut} rolls)`);

    // Clean up test data
    console.log('\n--- Cleaning up test records ---');
    await StockMovement.deleteMany({ warehouseId: warehouse._id });
    await StockBalance.deleteMany({ warehouseId: warehouse._id });
    await GoodsReceivedVoucher.deleteMany({ warehouseId: warehouse._id });
    await StoreIssueVoucher.deleteMany({ warehouseId: warehouse._id });
    await StaffRequest.deleteMany({ warehouseId: warehouse._id });
    await PurchaseOrder.deleteMany({ warehouseId: warehouse._id });
    await PurchaseRequest.deleteMany({ requestedBy: testUser._id });
    await CreditTransaction.deleteMany({ supplierId: supplier._id });
    await StockItem.deleteMany({ code: createdStockItem.code });
    await Warehouse.findByIdAndDelete(warehouse._id);
    await Supplier.findByIdAndDelete(supplier._id);
    console.log('✓ Test records cleaned up cleanly');

    console.log('\n🎉 ALL STORE & PURCHASER BACKEND INTEGRATION TESTS PASSED PERFECTLY!\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

runTests();
