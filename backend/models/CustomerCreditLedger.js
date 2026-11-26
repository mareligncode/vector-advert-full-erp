import mongoose from 'mongoose';
import { AGING_BRACKET_ENUM } from '../constants/operationsEnums.js';

const customerCreditLedgerSchema = new mongoose.Schema(
  {
    transactionCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    clientOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientOrder',
      default: null,
      index: true
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
      index: true
    },
    paymentCollectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentCollection',
      default: null
    },
    transactionType: {
      type: String,
      enum: ['invoice_debit', 'payment_credit', 'withholding_tax_credit', 'credit_note_adjustment'],
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    balanceBefore: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date
    },
    daysPastDue: {
      type: Number,
      default: 0,
      min: 0
    },
    agingBracket: {
      type: String,
      enum: AGING_BRACKET_ENUM,
      default: 'current_0_30_days',
      index: true
    },
    notes: {
      type: String,
      trim: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

customerCreditLedgerSchema.index({ clientId: 1, transactionType: 1 });
customerCreditLedgerSchema.index({ agingBracket: 1, daysPastDue: 1 });
customerCreditLedgerSchema.index({ invoiceId: 1, transactionType: 1 });

export default mongoose.models.CustomerCreditLedger ||
  mongoose.model('CustomerCreditLedger', customerCreditLedgerSchema);
