import mongoose from 'mongoose';

const creditPaymentSchema = new mongoose.Schema(
  {
    paymentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    creditTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreditTransaction',
      required: true,
      index: true
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cheque', 'cash', 'credit_card'],
      required: true
    },
    referenceNumber: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending_clearance', 'completed', 'bounced', 'void'],
      default: 'completed'
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

export default mongoose.models.CreditPayment ||
  mongoose.model('CreditPayment', creditPaymentSchema);
