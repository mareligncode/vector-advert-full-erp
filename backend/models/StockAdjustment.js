import mongoose from 'mongoose';
import { ADJUSTMENT_TYPE_ENUM } from '../constants/inventoryEnums.js';

const stockAdjustmentItemSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true
    },
    previousQuantity: {
      type: Number,
      default: 0
    },
    previousTotalQuantity: {
      type: Number,
      default: 0
    },
    adjustedQuantity: {
      type: Number,
      required: true
    },
    adjustedTotalQuantity: {
      type: Number,
      default: 0
    },
    differenceQuantity: {
      type: Number,
      default: 0
    },
    differenceTotalQuantity: {
      type: Number,
      default: 0
    },
    unit: {
      type: String
    },
    baseUnit: {
      type: String
    },
    multiplier: {
      type: Number,
      default: 1
    },
    reason: {
      type: String,
      trim: true
    }
  },
  {
    _id: true
  }
);

const stockAdjustmentSchema = new mongoose.Schema(
  {
    adjustmentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true
    },
    adjustmentType: {
      type: String,
      enum: ADJUSTMENT_TYPE_ENUM,
      required: true
    },
    adjustmentDate: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    items: [stockAdjustmentItemSchema],
    totalQuantity: {
      type: Number,
      default: 0
    },
    totalTotalQuantity: {
      type: Number,
      default: 0
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    approvalComment: {
      type: String,
      trim: true
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected'],
      default: 'draft'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.StockAdjustment ||
  mongoose.model('StockAdjustment', stockAdjustmentSchema);
