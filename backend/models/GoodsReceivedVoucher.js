import mongoose from 'mongoose';
import {
  UNIT_ENUM,
  GRV_STATUS_ENUM,
  DELIVERY_STATUS_ENUM,
  ITEM_CONDITION_ENUM
} from '../constants/inventoryEnums.js';

const grvItemSchema = new mongoose.Schema(
  {
    purchaseOrderItemId: {
      type: mongoose.Schema.Types.ObjectId
    },
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem'
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
    orderedQuantity: {
      type: Number,
      default: 0
    },
    orderedTotalQuantity: {
      type: Number,
      default: 0
    },
    receivedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    receivedTotalQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    acceptedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    acceptedTotalQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    rejectedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    rejectedTotalQuantity: {
      type: Number,
      default: 0,
      min: 0
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
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0
    },
    condition: {
      type: String,
      enum: ITEM_CONDITION_ENUM,
      default: 'good'
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
    targetLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarehouseLocation'
    },
    binLocation: {
      type: String,
      trim: true
    },
    storeRemarks: {
      type: String,
      trim: true
    }
  },
  {
    _id: true
  }
);

const goodsReceivedVoucherSchema = new mongoose.Schema(
  {
    grvCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    storeGrvNumber: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      index: true
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
    purchaserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    purchaserGeneratedDate: {
      type: Date,
      default: Date.now
    },
    supplierInvoiceNumber: {
      type: String,
      required: true,
      trim: true
    },
    deliveryNoteNumber: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: GRV_STATUS_ENUM,
      default: 'pending_store_acceptance',
      index: true
    },
    deliveryStatus: {
      type: String,
      enum: DELIVERY_STATUS_ENUM,
      default: 'fully_delivered',
      required: true
    },
    deliveryStatusRemarks: {
      type: String,
      trim: true,
      default: ''
    },
    storeKeeperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    storeAcceptedAt: {
      type: Date
    },
    storeKeeperComment: {
      type: String,
      trim: true,
      default: ''
    },
    items: [grvItemSchema],
    totalItems: {
      type: Number,
      default: 0
    },
    totalReceivedQuantity: {
      type: Number,
      default: 0
    },
    totalAcceptedQuantity: {
      type: Number,
      default: 0
    },
    totalRejectedQuantity: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
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

goodsReceivedVoucherSchema.index({ status: 1, warehouseId: 1 });
goodsReceivedVoucherSchema.index({ purchaseOrderId: 1, status: 1 });

export default mongoose.models.GoodsReceivedVoucher ||
  mongoose.model('GoodsReceivedVoucher', goodsReceivedVoucherSchema);
