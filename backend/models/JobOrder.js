import mongoose from 'mongoose';
import {
  JOB_ORDER_STATUS_ENUM,
  JOB_PRIORITY_ENUM,
  WARRANTY_STATUS_ENUM
} from '../constants/operationsEnums.js';

const jobOrderSchema = new mongoose.Schema(
  {
    jobOrderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    orderId: {
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
    approvedDesignProofId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DesignProof',
      required: true
    },
    projectTitle: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: JOB_ORDER_STATUS_ENUM,
      default: 'queued_for_materials',
      index: true
    },
    priority: {
      type: String,
      enum: JOB_PRIORITY_ENUM,
      default: 'normal',
      index: true
    },
    materialRequisition: {
      staffRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffRequest' },
      storeIssueVoucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreIssueVoucher' },
      materialsAllocated: { type: Boolean, default: false, index: true },
      allocatedAt: { type: Date },
      actualMaterialCostETB: { type: Number, default: 0, min: 0 }
    },
    workstationRouting: {
      machineFabrication: {
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed'],
          default: 'pending'
        },
        assignedOperator: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        machinesUsed: [{ type: String, trim: true }],
        startedAt: { type: Date },
        completedAt: { type: Date },
        machineRunHours: { type: Number, default: 0, min: 0 }
      },
      assemblyAndFinishing: {
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed'],
          default: 'pending'
        },
        leadCraftsman: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        operationsPerformed: [{ type: String, trim: true }],
        startedAt: { type: Date },
        completedAt: { type: Date }
      },
      electricalAndQC: {
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'passed', 'rework_needed'],
          default: 'pending'
        },
        inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        insulationResistanceTestPassed: { type: Boolean, default: false },
        illuminationBurnInTestHours: { type: Number, default: 0, min: 0 },
        qcSignOffDate: { type: Date }
      },
      packagingAndDispatch: {
        isPackaged: { type: Boolean, default: false },
        packagingType: {
          type: String,
          enum: ['wooden_crate', 'bubble_wrap_corrugated', 'steel_frame_cradle']
        },
        readyForDispatchDate: { type: Date }
      }
    },
    scheduledStartDate: {
      type: Date,
      required: true
    },
    targetCompletionDate: {
      type: Date,
      required: true,
      index: true
    },
    actualStartDate: { type: Date },
    actualCompletionDate: { type: Date },
    fulfillment: {
      deliveryMethod: {
        type: String,
        enum: ['counter_pickup', 'company_delivery_only', 'on_site_installation'],
        required: true
      },
      siteInstallationId: { type: mongoose.Schema.Types.ObjectId, ref: 'SiteInstallation' },
      handoverSignOffDate: { type: Date }
    },
    warranty: {
      warrantyCode: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        uppercase: true
      },
      status: {
        type: String,
        enum: WARRANTY_STATUS_ENUM,
        default: 'pending_activation',
        index: true
      },
      warrantyStartDate: { type: Date },
      coverageDurationsMonths: {
        ledModulesMonths: { type: Number, default: 24 },
        powerSupplyTransformerMonths: { type: Number, default: 12 },
        siliconeNeonFlexMonths: { type: Number, default: 12 },
        acrylicAndStructureMonths: { type: Number, default: 36 }
      },
      expirationDeadlines: {
        transformerExpiry: { type: Date },
        neonFlexExpiry: { type: Date },
        ledModulesExpiry: { type: Date, index: true },
        structuralExpiry: { type: Date, index: true }
      },
      scannableQrCodeUrl: { type: String, trim: true },
      isVoided: { type: Boolean, default: false, index: true },
      voidReason: { type: String, trim: true }
    },
    workshopSupervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    assignedCrew: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    ],
    authorizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

jobOrderSchema.index({ orderId: 1, status: 1 });
jobOrderSchema.index({ clientId: 1, status: 1 });
jobOrderSchema.index({ status: 1, priority: 1 });
jobOrderSchema.index({ targetCompletionDate: 1, status: 1 });
jobOrderSchema.index({ 'materialRequisition.materialsAllocated': 1, status: 1 });

export default mongoose.models.JobOrder || mongoose.model('JobOrder', jobOrderSchema);
