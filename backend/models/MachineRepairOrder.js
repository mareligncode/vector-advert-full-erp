import mongoose from 'mongoose';
import {
  REPAIR_URGENCY_ENUM,
  REPAIR_STATUS_ENUM,
  MACHINE_FAILURE_CATEGORY_ENUM
} from '../constants/operationsEnums.js';

const sparePartUsedSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      default: null
    },
    partCode: {
      type: String,
      trim: true
    },
    partName: {
      type: String,
      required: true,
      trim: true
    },
    quantityUsed: {
      type: Number,
      required: true,
      min: 0
    },
    unitPriceETB: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPriceETB: {
      type: Number,
      default: 0,
      min: 0
    },
    storeIssueVoucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StoreIssueVoucher',
      default: null
    }
  },
  { _id: true }
);

const machineRepairOrderSchema = new mongoose.Schema(
  {
    repairOrderCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionMachine',
      required: true,
      index: true
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    breakdownTimestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    urgency: {
      type: String,
      enum: REPAIR_URGENCY_ENUM,
      default: 'high_urgent',
      index: true
    },
    status: {
      type: String,
      enum: REPAIR_STATUS_ENUM,
      default: 'reported_pending_diagnosis',
      index: true
    },
    interruptedProduction: {
      activeJobOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobOrder',
        default: null
      },
      activeJobOrderNumber: {
        type: String,
        trim: true
      },
      activeProductionRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionRequest',
        default: null
      },
      damagedWorkpieceScrapped: {
        type: Boolean,
        default: false
      },
      scrapCostEstimatedETB: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    breakdownSymptoms: {
      type: String,
      required: true,
      trim: true
    },
    errorCodesLogged: [
      {
        type: String,
        trim: true
      }
    ],
    diagnosis: {
      diagnosedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
      },
      diagnosisDate: {
        type: Date
      },
      failureCategory: {
        type: String,
        enum: MACHINE_FAILURE_CATEGORY_ENUM,
        index: true
      },
      rootCauseSummary: {
        type: String,
        trim: true
      },
      repairStrategy: {
        type: String,
        trim: true
      }
    },
    sparePartsUsed: [sparePartUsedSchema],
    totalSparePartsCostETB: {
      type: Number,
      default: 0,
      min: 0
    },
    externalService: {
      isExternalVendorCalled: {
        type: Boolean,
        default: false
      },
      vendorName: { type: String, trim: true },
      vendorTechnicianName: { type: String, trim: true },
      vendorInvoiceNumber: { type: String, trim: true },
      vendorServiceFeeETB: { type: Number, default: 0, min: 0 }
    },
    leadTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      index: true
    },
    assistingTechnicians: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    ],
    repairStartedAt: {
      type: Date
    },
    repairCompletedAt: {
      type: Date
    },
    totalDowntimeHours: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    laborHoursTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRepairCostETB: {
      type: Number,
      default: 0,
      min: 0
    },
    postRepairTesting: {
      testRunType: { type: String, trim: true },
      calibrationTestPassed: {
        type: Boolean,
        default: false,
        index: true
      },
      dimensionalAccuracyVarianceMm: { type: Number, min: 0 },
      spindleRunoutDialIndicatorMm: { type: Number, min: 0 },
      certifiedReturnToServiceDate: { type: Date },
      certifiedBySupervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      },
      calibrationEvidenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence',
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

machineRepairOrderSchema.index({ machineId: 1, status: 1 });
machineRepairOrderSchema.index({ status: 1, urgency: 1 });
machineRepairOrderSchema.index({ breakdownTimestamp: 1, status: 1 });
machineRepairOrderSchema.index({ 'postRepairTesting.calibrationTestPassed': 1, status: 1 });

export default mongoose.models.MachineRepairOrder ||
  mongoose.model('MachineRepairOrder', machineRepairOrderSchema);
