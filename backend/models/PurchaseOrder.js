import mongoose from 'mongoose';
import { UNIT_ENUM, APPROVAL_STATUS_ENUM } from '../constants/inventoryEnums.js';

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    purchaseRequestItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      default: null
    },
    isNewItem: {
      type: Boolean,
      default: false
    },
    itemCode: {
      type: String,
      trim: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
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
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxRate: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    receivedQuantity: {
      type: Number,
      default: 0
    },
    receivedTotalQuantity: {
      type: Number,
      default: 0
    },
    remainingQuantity: {
      type: Number,
      default: 0
    },
    remainingTotalQuantity: {
      type: Number,
      default: 0
    },
    fulfillmentStatus: {
      type: String,
      enum: ['unfulfilled', 'partially_fulfilled', 'fulfilled', 'over_fulfilled'],
      default: 'unfulfilled'
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

const purchaseOrderSchema = new mongoose.Schema(
  {
    purchaseOrderCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    purchaseRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseRequest',
      required: true,
      index: true
    },
    comparisonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorPriceComparison'
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    expectedDeliveryDate: {
      type: Date,
      required: true
    },
    items: [purchaseOrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    deliveryCost: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    paymentTerms: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_approval',
        'approved',
        'sent_to_supplier',
        'partially_received',
        'completed',
        'cancelled'
      ],
      default: 'draft',
      index: true
    },
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUS_ENUM,
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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

purchaseOrderSchema.index({ supplierId: 1, status: 1 });
purchaseOrderSchema.index({ warehouseId: 1, status: 1 });

export default mongoose.models.PurchaseOrder ||
  mongoose.model('PurchaseOrder', purchaseOrderSchema);
