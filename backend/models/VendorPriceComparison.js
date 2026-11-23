import mongoose from 'mongoose';
import { APPROVAL_STATUS_ENUM } from '../constants/inventoryEnums.js';

const vendorQuoteItemSchema = new mongoose.Schema(
  {
    purchaseRequestItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem'
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true
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
    totalQuantity: {
      type: Number,
      default: 0
    },
    unitPrice: {
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
    totalWithTax: {
      type: Number,
      required: true
    },
    availability: {
      type: String,
      enum: ['in_stock', 'requires_order', 'unavailable'],
      default: 'in_stock'
    },
    deliveryTime: {
      type: String
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

const vendorQuoteSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    quoteNumber: {
      type: String,
      trim: true
    },
    quoteDate: {
      type: Date
    },
    validUntil: {
      type: Date
    },
    subtotal: {
      type: Number,
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
    totalAmount: {
      type: Number,
      required: true
    },
    paymentTerms: {
      type: String,
      trim: true
    },
    deliveryTime: {
      type: String,
      trim: true
    },
    items: [vendorQuoteItemSchema],
    notes: {
      type: String,
      trim: true
    }
  },
  {
    _id: true
  }
);

const vendorPriceComparisonSchema = new mongoose.Schema(
  {
    comparisonCode: {
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
    comparisonDate: {
      type: Date,
      default: Date.now
    },
    suppliers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
      }
    ],
    quotes: [vendorQuoteSchema],
    selectedSupplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    selectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    selectionReason: {
      type: String,
      trim: true
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
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.VendorPriceComparison ||
  mongoose.model('VendorPriceComparison', vendorPriceComparisonSchema);
