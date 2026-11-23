import mongoose from 'mongoose';
import {
  UNIT_ENUM,
  ITEM_TYPE_ENUM,
  APPROVAL_STATUS_ENUM
} from '../constants/inventoryEnums.js';

const purchaseRequestItemSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      default: null
    },
    isNewItem: {
      type: Boolean,
      default: false
    },
    itemType: {
      type: String,
      enum: ITEM_TYPE_ENUM,
      default: 'inventory',
      required: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    itemDescription: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.0001
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
    totalQuantity: {
      type: Number,
      default: 0
    },
    estimatedUnitCost: {
      type: Number,
      default: 0
    },
    estimatedTotalCost: {
      type: Number,
      default: 0
    },
    preferredSupplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
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

const purchaseRequestSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
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
    requestType: {
      type: String,
      enum: ['office', 'workshop', 'store_replenishment'],
      default: 'office'
    },
    jobOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    requiredDate: {
      type: Date,
      required: true
    },
    purpose: {
      type: String,
      required: true,
      trim: true
    },
    items: [purchaseRequestItemSchema],
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
    estimatedTotalCost: {
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
    procurementStatus: {
      type: String,
      enum: [
        'unassigned',
        'assigned',
        'in_comparison',
        'po_created',
        'completed',
        'cancelled'
      ],
      default: 'unassigned'
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

purchaseRequestSchema.index({ requestedBy: 1, approvalStatus: 1 });
purchaseRequestSchema.index({ procurementStatus: 1 });

export default mongoose.models.PurchaseRequest ||
  mongoose.model('PurchaseRequest', purchaseRequestSchema);
