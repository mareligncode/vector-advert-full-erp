import mongoose from 'mongoose';
import { UNIT_ENUM, STOCK_MOVEMENT_TYPE_ENUM } from '../constants/inventoryEnums.js';

const stockMovementSchema = new mongoose.Schema(
  {
    movementCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
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
    movementType: {
      type: String,
      enum: STOCK_MOVEMENT_TYPE_ENUM,
      required: true,
      index: true
    },
    referenceType: {
      type: String,
      enum: [
        'GoodsReceivedVoucher',
        'StoreIssueVoucher',
        'StaffReturn',
        'GRVReturn',
        'StockTransfer',
        'StockAdjustment',
        'SIVWaste'
      ],
      required: true,
      index: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referenceType',
      required: true,
      index: true
    },
    quantityIn: {
      type: Number,
      default: 0
    },
    quantityOut: {
      type: Number,
      default: 0
    },
    totalQuantityIn: {
      type: Number,
      default: 0
    },
    totalQuantityOut: {
      type: Number,
      default: 0
    },
    balanceQuantityAfter: {
      type: Number,
      default: 0
    },
    balanceTotalQuantityAfter: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: UNIT_ENUM,
      required: true
    },
    baseUnit: {
      type: String,
      enum: UNIT_ENUM,
      required: true
    },
    multiplierNumerator: {
      type: Number,
      default: 1
    },
    multiplierDenominator: {
      type: Number,
      default: 1
    },
    multiplier: {
      type: Number,
      default: 1
    },
    unitCost: {
      type: Number,
      default: 0
    },
    totalCost: {
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
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    movementDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

stockMovementSchema.index({ stockItemId: 1, warehouseId: 1, movementDate: -1 });
stockMovementSchema.index({ referenceType: 1, referenceId: 1 });

export default mongoose.models.StockMovement ||
  mongoose.model('StockMovement', stockMovementSchema);
