import mongoose from 'mongoose';
import { UNIT_ENUM } from '../constants/inventoryEnums.js';

const storeIssueItemSchema = new mongoose.Schema(
  {
    staffRequestItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true
    },
    stockBalanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockBalance'
    },
    itemCode: {
      type: String,
      trim: true
    },
    itemName: {
      type: String,
      trim: true
    },
    requestedQuantity: {
      type: Number,
      default: 0
    },
    requestedTotalQuantity: {
      type: Number,
      default: 0
    },
    approvedQuantity: {
      type: Number,
      default: 0
    },
    approvedTotalQuantity: {
      type: Number,
      default: 0
    },
    issuedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    issuedTotalQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    returnedQuantity: {
      type: Number,
      default: 0
    },
    returnedTotalQuantity: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: UNIT_ENUM
    },
    baseUnit: {
      type: String,
      enum: UNIT_ENUM
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
    notes: {
      type: String,
      trim: true
    }
  },
  {
    _id: true
  }
);

const storeIssueVoucherSchema = new mongoose.Schema(
  {
    sivCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    staffRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffRequest',
      required: true,
      index: true
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    items: [storeIssueItemSchema],
    totalItems: {
      type: Number,
      default: 0
    },
    totalQuantity: {
      type: Number,
      default: 0
    },
    totalTotalQuantity: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['issued', 'partially_returned', 'fully_returned', 'cancelled'],
      default: 'issued'
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

storeIssueVoucherSchema.index({ staffRequestId: 1, warehouseId: 1 });

export default mongoose.models.StoreIssueVoucher ||
  mongoose.model('StoreIssueVoucher', storeIssueVoucherSchema);
