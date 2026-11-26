import mongoose from 'mongoose';
import {
  MANUFACTURING_STAGE_ENUM,
  PRODUCTION_SCRAP_CATEGORY_ENUM,
  SCRAP_COST_ALLOCATION_ENUM
} from '../constants/operationsEnums.js';

const wastageItemSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    quantityScrapped: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      trim: true
    },
    unitCostETB: {
      type: Number,
      default: 0,
      min: 0
    },
    totalScrapCostETB: {
      type: Number,
      default: 0,
      min: 0
    },
    isReusableOffcut: {
      type: Boolean,
      default: false
    },
    salvageableDimensions: {
      widthCm: { type: Number, min: 0 },
      heightCm: { type: Number, min: 0 }
    },
    offcutStorageLocation: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

const productionWastageSchema = new mongoose.Schema(
  {
    wastageCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    jobOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOrder',
      required: true,
      index: true
    },
    jobOrderNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    productionRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionRequest',
      default: null,
      index: true
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    workshopSupervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    loggedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    manufacturingStage: {
      type: String,
      enum: MANUFACTURING_STAGE_ENUM,
      required: true,
      index: true
    },
    scrapCategory: {
      type: String,
      enum: PRODUCTION_SCRAP_CATEGORY_ENUM,
      required: true,
      index: true
    },
    incidentSummary: {
      type: String,
      required: true,
      trim: true
    },
    items: [wastageItemSchema],
    totalWastageCostETB: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    rootCauseDescription: {
      type: String,
      required: true,
      trim: true
    },
    correctiveActionTaken: {
      type: String,
      trim: true
    },
    costAllocation: {
      type: String,
      enum: SCRAP_COST_ALLOCATION_ENUM,
      default: 'absorb_in_job_order_cost',
      index: true
    },
    requiresMaterialReplenishment: {
      type: Boolean,
      default: false
    },
    replenishmentStaffRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffRequest',
      default: null
    },
    replenishmentStatus: {
      type: String,
      enum: ['not_required', 'requisition_pending', 'materials_re-issued'],
      default: 'not_required'
    },
    evidenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evidence',
      default: null
    },
    status: {
      type: String,
      enum: ['logged', 'supervisor_verified', 'financial_writeoff_approved'],
      default: 'logged',
      index: true
    },
    verifiedByFinance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

productionWastageSchema.index({ jobOrderId: 1, manufacturingStage: 1 });
productionWastageSchema.index({ productionRequestId: 1, scrapCategory: 1 });
productionWastageSchema.index({ status: 1, requiresMaterialReplenishment: 1 });
productionWastageSchema.index({ loggedAt: 1, scrapCategory: 1 });

export default mongoose.models.ProductionWastage ||
  mongoose.model('ProductionWastage', productionWastageSchema);
