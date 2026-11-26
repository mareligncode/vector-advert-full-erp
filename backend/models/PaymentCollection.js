import mongoose from 'mongoose';
import { PAYMENT_METHOD_ENUM, RECEIPT_TYPE_ENUM } from '../constants/operationsEnums.js';

const paymentCollectionSchema = new mongoose.Schema(
  {
    receiptVoucherNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
      index: true
    },
    clientOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientOrder',
      required: true,
      index: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    receiptType: {
      type: String,
      enum: RECEIPT_TYPE_ENUM,
      required: true,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD_ENUM,
      required: true,
      index: true
    },
    amountPaidETB: {
      type: Number,
      required: true,
      min: 1
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    destinationBankAccount: {
      type: String,
      trim: true
    },
    electronicTransfer: {
      bankTransactionReference: { type: String, trim: true },
      mobileMoneyPayerPhone: { type: String, trim: true },
      mobileTransactionId: { type: String, trim: true }
    },
    chequeDetails: {
      chequeNumber: { type: String, trim: true },
      issuingBank: { type: String, trim: true },
      chequeDate: { type: Date },
      chequeMaturityDate: { type: Date },
      clearingStatus: {
        type: String,
        enum: ['pending_clearance', 'cleared_in_bank', 'bounced_dishonored'],
        default: 'pending_clearance',
        index: true
      },
      clearedDate: { type: Date }
    },
    withholdingTaxCreditSlip: {
      withholdingTaxSlipNumber: { type: String, trim: true },
      withholdingAmountDeducted: { type: Number, min: 0 },
      withholdingCertificateUrl: { type: String, trim: true }
    },
    triggersProductionClearance: {
      type: Boolean,
      default: false
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    verifiedByFinance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    paymentProofEvidenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evidence',
      default: null
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

paymentCollectionSchema.index({ clientOrderId: 1, receiptType: 1 });
paymentCollectionSchema.index({ invoiceId: 1, paymentMethod: 1 });
paymentCollectionSchema.index({ paymentDate: 1, paymentMethod: 1 });
paymentCollectionSchema.index({ 'chequeDetails.clearingStatus': 1, paymentDate: 1 });

export default mongoose.models.PaymentCollection ||
  mongoose.model('PaymentCollection', paymentCollectionSchema);
