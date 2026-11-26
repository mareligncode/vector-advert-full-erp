import mongoose from 'mongoose';
import {
  ADVERTISING_PRODUCT_CATEGORY_ENUM,
  CLIENT_ORDER_STATUS_ENUM,
  FINANCIAL_CLEARANCE_STATUS_ENUM,
  JOB_PRIORITY_ENUM
} from '../constants/operationsEnums.js';

const requestedItemSchema = new mongoose.Schema(
  {
    itemCode: { type: String, trim: true },
    productCategory: {
      type: String,
      enum: ADVERTISING_PRODUCT_CATEGORY_ENUM,
      required: true
    },
    itemTitle: { type: String, required: true, trim: true },
    detailedDescription: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    dimensions: {
      widthCm: { type: Number, required: true, min: 0 },
      heightCm: { type: Number, required: true, min: 0 },
      depthReturnCm: { type: Number, default: 0, min: 0 },
      totalAreaSqM: { type: Number, default: 0, min: 0 }
    },
    initialMaterialSpecifications: {
      faceMaterial: { type: String, trim: true },
      returnSideMaterial: { type: String, trim: true },
      backerMaterial: { type: String, trim: true },
      neonFlexSpecs: { type: String, trim: true },
      ledModuleSpecs: { type: String, trim: true },
      powerSupplySpecs: { type: String, trim: true }
    },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 }
  },
  { _id: true }
);

const clientOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
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
    sourceLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    siteSurveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SiteSurvey'
    },
    projectTitle: {
      type: String,
      required: true,
      trim: true
    },
    orderType: {
      type: String,
      enum: ADVERTISING_PRODUCT_CATEGORY_ENUM,
      required: true,
      index: true
    },
    priority: {
      type: String,
      enum: JOB_PRIORITY_ENUM,
      default: 'normal',
      index: true
    },
    status: {
      type: String,
      enum: CLIENT_ORDER_STATUS_ENUM,
      default: 'draft',
      index: true
    },
    orderDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    estimatedCompletionDate: {
      type: Date,
      required: true
    },
    designAgreedDate: { type: Date },
    productionAuthorizedDate: { type: Date },
    actualCompletedDate: { type: Date },
    requestedItems: [requestedItemSchema],
    commercial: {
      subtotal: { type: Number, required: true, default: 0, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
      taxableAmount: { type: Number, default: 0, min: 0 },
      vatRatePercentage: { type: Number, default: 15, min: 0 },
      vatAmount: { type: Number, default: 0, min: 0 },
      withholdingTaxApplicable: { type: Boolean, default: false },
      withholdingTaxAmount: { type: Number, default: 0, min: 0 },
      grandTotal: { type: Number, required: true, default: 0, min: 0 },
      advanceDepositRequiredPercentage: { type: Number, default: 50, min: 0, max: 100 },
      advanceDepositAmountRequired: { type: Number, required: true, default: 0, min: 0 },
      advanceDepositAmountPaid: { type: Number, default: 0, min: 0 },
      advanceReceiptNumber: { type: String, trim: true },
      currentOutstandingBalance: { type: Number, default: 0 },
      paymentTermsType: {
        type: String,
        enum: ['cash_advance_deposit', 'credit_approved_account', '100_percent_prepayment'],
        default: 'cash_advance_deposit'
      }
    },
    designTask: {
      hasDesignTask: { type: Boolean, default: true },
      designTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'DesignTask' },
      assignedDesigner: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      agreedDesignProofId: { type: mongoose.Schema.Types.ObjectId, ref: 'DesignProof' }
    },
    productionClearance: {
      proceedToProductionConfirmed: { type: Boolean, default: false },
      confirmedAt: { type: Date },
      confirmedByClientContact: { type: String, trim: true },
      financialClearanceStatus: {
        type: String,
        enum: FINANCIAL_CLEARANCE_STATUS_ENUM,
        default: 'pending_setup',
        index: true
      },
      financialClearedAt: { type: Date },
      financialClearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      financialClearanceNotes: { type: String, trim: true },
      isProductionAuthorized: { type: Boolean, default: false, index: true }
    },
    spawnedJobOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOrder'
    },
    salesAccountManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    fulfillmentMethod: {
      type: String,
      enum: ['counter_pickup', 'company_delivery_only', 'on_site_installation'],
      default: 'on_site_installation',
      required: true
    },
    deliveryAddress: { type: String, trim: true },
    installationNotes: { type: String, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

clientOrderSchema.index({ clientId: 1, status: 1 });
clientOrderSchema.index({ status: 1, priority: 1 });
clientOrderSchema.index({ 'productionClearance.isProductionAuthorized': 1, status: 1 });
clientOrderSchema.index({ orderDate: -1, status: 1 });

export default mongoose.models.ClientOrder || mongoose.model('ClientOrder', clientOrderSchema);
