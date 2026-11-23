import mongoose from 'mongoose';

const stockCountItemSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true
    },
    systemQuantity: {
      type: Number,
      default: 0
    },
    systemTotalQuantity: {
      type: Number,
      default: 0
    },
    physicalQuantity: {
      type: Number,
      required: true
    },
    physicalTotalQuantity: {
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
    notes: {
      type: String,
      trim: true
    }
  },
  {
    _id: true
  }
);

const stockCountSchema = new mongoose.Schema(
  {
    countCode: {
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
    countDate: {
      type: Date,
      default: Date.now
    },
    countedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    items: [stockCountItemSchema],
    totalItems: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'reconciled', 'cancelled'],
      default: 'in_progress'
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

export default mongoose.models.StockCount ||
  mongoose.model('StockCount', stockCountSchema);
