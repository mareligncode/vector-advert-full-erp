import mongoose from 'mongoose';

const staffReturnItemSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true
    },
    sivItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    returnedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    returnedTotalQuantity: {
      type: Number,
      default: 0
    },
    acceptedQuantity: {
      type: Number,
      default: 0
    },
    acceptedTotalQuantity: {
      type: Number,
      default: 0
    },
    rejectedQuantity: {
      type: Number,
      default: 0
    },
    rejectedTotalQuantity: {
      type: Number,
      default: 0
    },
    unit: {
      type: String
    },
    baseUnit: {
      type: String
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
    condition: {
      type: String,
      enum: ['good', 'damaged', 'defective'],
      default: 'good'
    },
    reason: {
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

const staffReturnSchema = new mongoose.Schema(
  {
    returnCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    sivId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StoreIssueVoucher',
      required: true,
      index: true
    },
    staffRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffRequest',
      required: true
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true
    },
    returnDate: {
      type: Date,
      default: Date.now
    },
    items: [staffReturnItemSchema],
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
      enum: ['pending_review', 'accepted', 'partially_accepted', 'rejected'],
      default: 'accepted'
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

export default mongoose.models.StaffReturn || mongoose.model('StaffReturn', staffReturnSchema);
