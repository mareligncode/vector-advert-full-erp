import mongoose from 'mongoose';
import { PAYMENT_STATUS_ENUM } from '../constants/inventoryEnums.js';

const creditTransactionSchema = new mongoose.Schema(
  {
    transactionCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      index: true
    },
    grvId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GoodsReceivedVoucher',
      index: true
    },
    transactionType: {
      type: String,
      enum: ['invoice_credit', 'payment_debit', 'credit_note_debit', 'debit_note_credit'],
      required: true
    },
    transactionDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date
    },
    description: {
      type: String,
      trim: true
    },
    debitAmount: {
      type: Number,
      default: 0
    },
    creditAmount: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS_ENUM,
      default: 'unpaid',
      index: true
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

creditTransactionSchema.index({ supplierId: 1, paymentStatus: 1 });
creditTransactionSchema.index({ dueDate: 1, paymentStatus: 1 });

export default mongoose.models.CreditTransaction ||
  mongoose.model('CreditTransaction', creditTransactionSchema);
