import mongoose from 'mongoose';

const stockBalanceSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true,
      index: true
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarehouseLocation',
      index: true
    },
    binLocation: {
      type: String,
      trim: true
    },
    balanceQuantity: {
      type: Number,
      default: 0
    },
    balanceTotalQuantity: {
      type: Number,
      default: 0
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    reservedTotalQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    availableQuantity: {
      type: Number,
      default: 0
    },
    availableTotalQuantity: {
      type: Number,
      default: 0
    },
    batchNumber: {
      type: String,
      trim: true
    },
    lotNumber: {
      type: String,
      trim: true
    },
    expiryDate: {
      type: Date
    },
    lastMovementDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

stockBalanceSchema.index(
  { stockItemId: 1, warehouseId: 1, locationId: 1, batchNumber: 1 },
  { unique: true }
);

stockBalanceSchema.index({ warehouseId: 1, availableQuantity: 1 });

export default mongoose.models.StockBalance || mongoose.model('StockBalance', stockBalanceSchema);
