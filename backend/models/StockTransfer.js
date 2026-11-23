import mongoose from 'mongoose';

const stockTransferItemSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true
    },
    sentQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    sentTotalQuantity: {
      type: Number,
      default: 0
    },
    receivedQuantity: {
      type: Number,
      default: 0
    },
    receivedTotalQuantity: {
      type: Number,
      default: 0
    },
    damagedQuantity: {
      type: Number,
      default: 0
    },
    damagedTotalQuantity: {
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
    notes: {
      type: String,
      trim: true
    }
  },
  {
    _id: true
  }
);

const stockTransferSchema = new mongoose.Schema(
  {
    transferCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    sourceWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true
    },
    destinationWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transferDate: {
      type: Date,
      default: Date.now
    },
    receivedDate: {
      type: Date
    },
    items: [stockTransferItemSchema],
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
      enum: [
        'draft',
        'pending_approval',
        'in_transit',
        'received',
        'partially_received',
        'cancelled'
      ],
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

export default mongoose.models.StockTransfer ||
  mongoose.model('StockTransfer', stockTransferSchema);
