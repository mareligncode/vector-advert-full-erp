import mongoose from 'mongoose';
import { INVOICE_TYPE_ENUM, INVOICE_STATUS_ENUM } from '../constants/operationsEnums.js';

const invoiceLineItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    dimensions: {
      widthCm: { type: Number, min: 0 },
      heightCm: { type: Number, min: 0 },
      depthReturnCm: { type: Number, min: 0 },
      totalAreaSqM: { type: Number, min: 0 }
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    invoiceType: {
      type: String,
      enum: INVOICE_TYPE_ENUM,
      default: 'proforma',
      index: true
    },
    proformaReferenceCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    clientOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientOrder',
      required: true,
      index: true
    },
    jobOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOrder',
      default: null,
      index: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: INVOICE_STATUS_ENUM,
      default: 'draft',
      index: true
    },
    buyerCredentials: {
      legalCompanyName: {
        type: String,
        required: true,
        trim: true
      },
      tin: {
        type: String,
        trim: true,
        index: true
      },
      vatRegistrationNumber: {
        type: String,
        trim: true
      },
      billingAddress: {
        type: String,
        trim: true
      }
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    validityDays: {
      type: Number,
      default: 15,
      min: 0
    },
    paymentTermType: {
      type: String,
      enum: ['immediate_due_on_receipt', 'net_15_days', 'net_30_days', 'net_60_days'],
      default: 'immediate_due_on_receipt',
      index: true
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    lineItems: [invoiceLineItemSchema],
    pricingBreakdown: {
      subtotal: {
        type: Number,
        required: true,
        min: 0
      },
      discountAmount: {
        type: Number,
        default: 0,
        min: 0
      },
      taxableAmount: {
        type: Number,
        required: true,
        min: 0
      },
      vatRate: {
        type: Number,
        default: 15,
        min: 0
      },
      vatAmount: {
        type: Number,
        required: true,
        min: 0
      },
      withholdingTaxApplicable: {
        type: Boolean,
        default: false
      },
      withholdingTaxRate: {
        type: Number,
        default: 2,
        min: 0
      },
      withholdingTaxAmount: {
        type: Number,
        default: 0,
        min: 0
      },
      grossTotalAmount: {
        type: Number,
        required: true,
        min: 0
      },
      advanceDepositRequiredPercentage: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
      },
      advanceDepositAmountRequired: {
        type: Number,
        required: true,
        min: 0
      }
    },
    totalPaidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    withholdingTaxVoucherAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    outstandingBalance: {
      type: Number,
      required: true,
      default: 0,
      index: true
    },
    isCreditDispatched: {
      type: Boolean,
      default: false
    },
    fiscalReceiptReference: {
      type: String,
      trim: true
    },
    bankRemittanceAccounts: [
      {
        bankName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        accountName: { type: String, trim: true }
      }
    ],
    evidenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evidence',
      default: null
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedByFinance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

invoiceSchema.index({ clientId: 1, status: 1 });
invoiceSchema.index({ clientOrderId: 1, status: 1 });
invoiceSchema.index({ invoiceType: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, outstandingBalance: 1 });

export default mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
