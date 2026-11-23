import mongoose from 'mongoose';

const models = [
  'Supplier.js',
  'UnitOfMeasure.js',
  'Warehouse.js',
  'WarehouseLocation.js',
  'ApprovalHistory.js',
  'StockItem.js',
  'StockBalance.js',
  'GoodsReceivedVoucher.js',
  'StoreIssueVoucher.js',
  'StaffRequest.js',
  'StaffReturn.js',
  'GRVReturn.js',
  'SIVWaste.js',
  'StockMovement.js',
  'StockTransfer.js',
  'StockAdjustment.js',
  'StockCount.js',
  'AssetRegister.js',
  'AssetMaintenance.js',
  'EndOfDayReport.js',
  'PurchaseRequest.js',
  'ProcurementAssignment.js',
  'VendorPriceComparison.js',
  'PurchaseOrder.js',
  'PurchaserAuction.js',
  'CreditTransaction.js',
  'CreditPayment.js',
  'TaxConfiguration.js'
];

async function checkModels() {
  console.log('Testing compilation of all generated models...');
  for (const file of models) {
    const mod = await import(`../models/${file}`);
    const model = mod.default;
    if (!model || !model.modelName) {
      throw new Error(`Failed to load valid model from ${file}`);
    }
    console.log(`✓ ${model.modelName} loaded successfully`);
  }
  console.log(`\nAll ${models.length} Store & Purchaser models compiled and validated with Mongoose successfully!`);
}

checkModels().catch((err) => {
  console.error('Validation error:', err);
  process.exit(1);
});
