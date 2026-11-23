import mongoose from 'mongoose';
import { UNIT_ENUM, APPROVAL_STATUS_ENUM } from '../constants/inventoryEnums.js';

const staffRequestItemSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true
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
      required: true,
      min: 0.0001
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
      default: 0
    },
    issuedTotalQuantity: {
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
    purpose: {
      type: String,
      trim: true
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
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

const staffRequestSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    requestType: {
      type: String,
      enum: ['office', 'workshop'],
      required: true,
      index: true
    },
    jobOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    workshopId: {
      type: mongoose.Schema.Types.ObjectId
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse'
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    requiredDate: {
      type: Date
    },
    purpose: {
      type: String,
      required: true,
      trim: true
    },
    items: [staffRequestItemSchema],
    totalItems: {
      type: Number,
      default: 0
    },
    totalRequestedQuantity: {
      type: Number,
      default: 0
    },
    totalRequestedTotalQuantity: {
      type: Number,
      default: 0
    },
    totalApprovedQuantity: {
      type: Number,
      default: 0
    },
    totalApprovedTotalQuantity: {
      type: Number,
      default: 0
    },
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUS_ENUM,
      default: 'pending',
      index: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    issuedStatus: {
      type: String,
      enum: ['unissued', 'partially_issued', 'fully_issued'],
      default: 'unissued'
    },
    rejectionReason: {
      type: String,
      trim: true
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

staffRequestSchema.index({ requestType: 1, jobOrderId: 1 });
staffRequestSchema.index({ requestedBy: 1, approvalStatus: 1 });

export default mongoose.models.StaffRequest || mongoose.model('StaffRequest', staffRequestSchema);
