import mongoose from 'mongoose';

const grvReturnItemSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true
    },
    originalGrvItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    totalQuantity: {
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
    unitCost: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    },
    reason: {
      type: String,
      trim: true
    },
    condition: {
      type: String,
      enum: ['damaged', 'defective', 'expired', 'wrong_specification']
    }
  },
  {
    _id: true
  }
);

const grvReturnSchema = new mongoose.Schema(
  {
    returnCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    originalGrvId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GoodsReceivedVoucher',
      required: true,
      index: true
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    returnDate: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    items: [grvReturnItemSchema],
    totalQuantity: {
      type: Number,
      default: 0
    },
    totalTotalQuantity: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'dispatched', 'refund_credited'],
      default: 'draft'
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

export default mongoose.models.GRVReturn || mongoose.model('GRVReturn', grvReturnSchema);
