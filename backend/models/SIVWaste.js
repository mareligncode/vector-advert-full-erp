import mongoose from 'mongoose';

const sivWasteItemSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
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
    condition: {
      type: String,
      enum: ['damaged', 'expired', 'defective']
    },
    reason: {
      type: String,
      trim: true
    }
  },
  {
    _id: true
  }
);

const sivWasteSchema = new mongoose.Schema(
  {
    wasteCode: {
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
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    wasteDate: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    items: [sivWasteItemSchema],
    totalQuantity: {
      type: Number,
      default: 0
    },
    totalTotalQuantity: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'written_off'],
      default: 'draft'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.SIVWaste || mongoose.model('SIVWaste', sivWasteSchema);
