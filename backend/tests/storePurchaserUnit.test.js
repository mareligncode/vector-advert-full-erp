import assert from 'assert';
import {
  calculateQuantityRelationship,
  calculateMovingAverageCost
} from '../utils/inventoryService.js';
import {
  UNIT_ENUM,
  REQUEST_TYPE_ENUM,
  ITEM_TYPE_ENUM,
  GRV_STATUS_ENUM,
  DELIVERY_STATUS_ENUM,
  STOCK_MOVEMENT_TYPE_ENUM
} from '../constants/inventoryEnums.js';
import StockItem from '../models/StockItem.js';
import GoodsReceivedVoucher from '../models/GoodsReceivedVoucher.js';
import StaffRequest from '../models/StaffRequest.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import CreditTransaction from '../models/CreditTransaction.js';

console.log('🧪 Running Store & Purchaser Core Logic & Schema Unit Tests...\n');

// 1. Test Rational Multiplier & Quantity Calculations
console.log('1. Testing Rational Multiplier & Dual-Quantity Calculations...');

// Whole number conversion (e.g. 1 roll = 50 meters, quantity: 12 rolls)
const wholeConv = calculateQuantityRelationship({
  quantity: 12,
  multiplierNumerator: 50,
  multiplierDenominator: 1
});
assert.strictEqual(wholeConv.multiplier, 50);
assert.strictEqual(wholeConv.totalQuantity, 600);
console.log('  ✅ Whole multiplier: 12 rolls @ 50m/roll = 600 meters');

// Fractional conversion (e.g. 1/3 pack, quantity: 9 packs = 3 pcs)
const fracConv = calculateQuantityRelationship({
  quantity: 9,
  multiplierNumerator: 1,
  multiplierDenominator: 3
});
assert.strictEqual(fracConv.multiplier, 0.333333);
assert.strictEqual(fracConv.totalQuantity, 3);
console.log('  ✅ Fractional multiplier: 9 packs @ 1/3 = 3 units');

// Decimal conversion with zero check
assert.throws(() => {
  calculateQuantityRelationship({
    quantity: 5,
    multiplierNumerator: 1,
    multiplierDenominator: 0
  });
}, /multiplierDenominator cannot be zero/);
console.log('  ✅ Zero-denominator validation throws expected error');

// 2. Test Moving Weighted Average Cost (MAC) Formula
console.log('\n2. Testing Moving Weighted Average Cost (MAC) Formula...');

// Case A: Initial receipt on empty warehouse (0 existing)
const initialCost = calculateMovingAverageCost({
  currentBaseQty: 0,
  currentAvgCost: 0,
  incomingBaseQty: 100,
  incomingUnitCostPerBaseUnit: 15.5
});
assert.strictEqual(initialCost, 15.5);
console.log('  ✅ Initial inventory receipt sets base cost correctly to $15.50');

// Case B: Secondary receipt at different price
// Current: 100 units @ $15.50 = $1,550
// Incoming: 50 units @ $20.00 = $1,000
// Total: 150 units, Total value: $2,550 -> New MAC = $17.00
const updatedCost = calculateMovingAverageCost({
  currentBaseQty: 100,
  currentAvgCost: 15.5,
  incomingBaseQty: 50,
  incomingUnitCostPerBaseUnit: 20
});
assert.strictEqual(updatedCost, 17);
console.log('  ✅ Blended weighted average correctly computed: 150 units @ $17.00');

// Case C: Third receipt at lower price
// Current: 150 units @ $17.00 = $2,550
// Incoming: 100 units @ $12.00 = $1,200
// Total: 250 units, Total value: $3,750 -> New MAC = $15.00
const thirdCost = calculateMovingAverageCost({
  currentBaseQty: 150,
  currentAvgCost: 17,
  incomingBaseQty: 100,
  incomingUnitCostPerBaseUnit: 12
});
assert.strictEqual(thirdCost, 15);
console.log('  ✅ Downward price fluctuation correctly computed: 250 units @ $15.00');

// 3. Test Shared Constants & Enums Integrity
console.log('\n3. Testing Shared Constants & Enums...');
assert.ok(UNIT_ENUM.includes('pcs') && UNIT_ENUM.includes('roll') && UNIT_ENUM.includes('meter_square'));
assert.ok(REQUEST_TYPE_ENUM.includes('office') && REQUEST_TYPE_ENUM.includes('workshop'));
assert.ok(ITEM_TYPE_ENUM.includes('inventory') && ITEM_TYPE_ENUM.includes('non_inventory') && ITEM_TYPE_ENUM.includes('service'));
assert.ok(GRV_STATUS_ENUM.includes('pending_store_acceptance') && GRV_STATUS_ENUM.includes('accepted'));
assert.ok(DELIVERY_STATUS_ENUM.includes('fully_delivered') && DELIVERY_STATUS_ENUM.includes('partially_delivered'));
assert.ok(STOCK_MOVEMENT_TYPE_ENUM.includes('grv_receipt') && STOCK_MOVEMENT_TYPE_ENUM.includes('siv_issue'));
console.log('  ✅ All shared inventory and procurement enums validated');

// 4. Test Mongoose Model Document Construction & Defaults
console.log('\n4. Testing Mongoose Model Document Instantiation...');

// StockItem Master Schema validation
const testStockItem = new StockItem({
  code: 'STK-UNIT-001',
  name: 'Reflective Vinyl Yellow 50m',
  category: 'Printing Media',
  itemType: 'inventory',
  unit: 'roll',
  baseUnit: 'meter',
  multiplierNumerator: 50,
  multiplierDenominator: 1,
  multiplier: 50,
  unitCost: 3500
});
assert.strictEqual(testStockItem.stockStatus, 'out_of_stock');
assert.strictEqual(testStockItem.autoRegisteredFromGRV, false);
console.log('  ✅ StockItem model instantiates with correct defaults');

// GoodsReceivedVoucher Schema validation (Requirement 1A)
const testGrv = new GoodsReceivedVoucher({
  grvCode: 'GRV-UNIT-001',
  supplierId: '507f1f77bcf86cd799439011',
  warehouseId: '507f1f77bcf86cd799439012',
  purchaserId: '507f1f77bcf86cd799439013',
  supplierInvoiceNumber: 'INV-12345',
  deliveryStatus: 'partially_delivered',
  deliveryStatusRemarks: 'Delivered 8 of 10 rolls; remaining expected Thursday',
  storeKeeperComment: 'Inspection completed: sealed boxes, good quality',
  items: [
    {
      itemName: 'Banner Matte 50m',
      receivedQuantity: 8,
      acceptedQuantity: 8,
      rejectedQuantity: 0,
      unit: 'roll',
      baseUnit: 'meter',
      unitCost: 2000
    }
  ]
});
assert.strictEqual(testGrv.status, 'pending_store_acceptance');
assert.strictEqual(testGrv.deliveryStatus, 'partially_delivered');
assert.ok(testGrv.storeKeeperComment.length > 0);
console.log('  ✅ GoodsReceivedVoucher model satisfies Purchaser generation & Storekeeper inspection schema');

// StaffRequest Schema validation
const testStaffReq = new StaffRequest({
  requestCode: 'REQ-UNIT-001',
  requestType: 'workshop',
  jobOrderId: '507f1f77bcf86cd799439014',
  requestedBy: '507f1f77bcf86cd799439013',
  departmentId: '507f1f77bcf86cd799439015',
  purpose: 'Vehicle Wrap Job',
  items: [
    {
      stockItemId: '507f1f77bcf86cd799439016',
      requestedQuantity: 2
    }
  ]
});
assert.strictEqual(testStaffReq.requestType, 'workshop');
assert.strictEqual(testStaffReq.approvalStatus, 'pending');
assert.strictEqual(testStaffReq.issuedStatus, 'unissued');
console.log('  ✅ StaffRequest model instantiates with correct workshop workflow constraints');

// PurchaseOrder Schema validation
const testPo = new PurchaseOrder({
  purchaseOrderCode: 'PO-UNIT-001',
  purchaseRequestId: '507f1f77bcf86cd799439017',
  supplierId: '507f1f77bcf86cd799439011',
  warehouseId: '507f1f77bcf86cd799439012',
  expectedDeliveryDate: new Date(),
  createdBy: '507f1f77bcf86cd799439013',
  items: [
    {
      purchaseRequestItemId: '507f1f77bcf86cd799439018',
      itemName: 'Acrylic Sheet 3mm',
      quantity: 10,
      unit: 'sheet',
      baseUnit: 'pcs',
      unitPrice: 1500,
      subtotal: 15000,
      totalPrice: 15000
    }
  ],
  subtotal: 15000,
  totalAmount: 15000
});
assert.strictEqual(testPo.items[0].fulfillmentStatus, 'unfulfilled');
assert.strictEqual(testPo.status, 'draft');
console.log('  ✅ PurchaseOrder model instantiates with item PR link and fulfillment status tracking');

console.log('\n🎉 ALL STORE & PURCHASER UNIT TESTS PASSED SUCCESSFULLY!\n');
