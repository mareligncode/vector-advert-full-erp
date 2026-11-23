import mongoose from 'mongoose';

const endOfDayReportSchema = new mongoose.Schema(
  {
    reportCode: {
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
      required: true,
      index: true
    },
    reportDate: {
      type: Date,
      required: true,
      index: true
    },
    openingTotalQuantity: {
      type: Number,
      default: 0
    },
    receivedTotalQuantity: {
      type: Number,
      default: 0
    },
    issuedTotalQuantity: {
      type: Number,
      default: 0
    },
    returnedTotalQuantity: {
      type: Number,
      default: 0
    },
    wasteTotalQuantity: {
      type: Number,
      default: 0
    },
    closingTotalQuantity: {
      type: Number,
      default: 0
    },
    preparedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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

export default mongoose.models.EndOfDayReport ||
  mongoose.model('EndOfDayReport', endOfDayReportSchema);
