import mongoose from 'mongoose';
import {
  WARRANTY_CLAIM_STATUS_ENUM,
  CLAIM_COVERAGE_DETERMINATION_ENUM
} from '../constants/operationsEnums.js';

const warrantyClaimSchema = new mongoose.Schema(
  {
    claimCode: {
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
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    claimDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: WARRANTY_CLAIM_STATUS_ENUM,
      default: 'claim_submitted',
      index: true
    },
    failedComponent: {
      type: String,
      enum: [
        'led_modules',
        'power_supply_transformer',
        'silicone_neon_flex',
        'acrylic_face_or_letter',
        'structural_frame_or_bracket',
        'wiring_connection'
      ],
      required: true
    },
    defectDescription: {
      type: String,
      required: true,
      trim: true
    },
    evidenceMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evidence',
      default: null
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    evaluationDate: {
      type: Date
    },
    isCoveredUnderActiveWarranty: {
      type: Boolean,
      required: true
    },
    determination: {
      type: String,
      enum: CLAIM_COVERAGE_DETERMINATION_ENUM,
      required: true,
      index: true
    },
    rejectionReasonNotes: {
      type: String,
      trim: true
    },
    fulfillment: {
      storeStaffRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StaffRequest',
        default: null
      },
      dispatchedTechnician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
      },
      repairExecutionDate: {
        type: Date
      },
      componentsReplaced: [
        {
          stockItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StockItem'
          },
          itemName: { type: String, trim: true },
          quantity: { type: Number, min: 0 },
          serialNumber: { type: String, trim: true }
        }
      ],
      claimResolutionCostETB: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    clientHandoverSignOff: {
      isSatisfactorilyRepaired: {
        type: Boolean,
        default: false,
        index: true
      },
      clientWitnessName: { type: String, trim: true },
      clientSignatureUrl: { type: String, trim: true },
      signOffDate: { type: Date },
      afterRepairPhotoEvidenceId: {
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

warrantyClaimSchema.index({ jobOrderId: 1, status: 1 });
warrantyClaimSchema.index({ clientId: 1, status: 1 });
warrantyClaimSchema.index({ determination: 1, claimDate: 1 });
warrantyClaimSchema.index({ 'clientHandoverSignOff.isSatisfactorilyRepaired': 1, status: 1 });

export default mongoose.models.WarrantyClaim ||
  mongoose.model('WarrantyClaim', warrantyClaimSchema);
