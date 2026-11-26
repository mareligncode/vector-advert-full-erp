import mongoose from 'mongoose';
import {
  COMPLAINT_CATEGORY_ENUM,
  COMPLAINT_SEVERITY_ENUM,
  COMPLAINT_RESOLUTION_STATUS_ENUM
} from '../constants/operationsEnums.js';

const replacementPartUsedSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem'
    },
    partName: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      min: 0
    },
    unitCostETB: {
      type: Number,
      min: 0
    }
  },
  { _id: true }
);

const customerComplaintSchema = new mongoose.Schema(
  {
    complaintCode: {
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
    jobOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOrder',
      default: null,
      index: true
    },
    siteInstallationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SiteInstallation',
      default: null
    },
    reportedByClientContact: {
      fullName: {
        type: String,
        required: true,
        trim: true
      },
      phone: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      }
    },
    reportedDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: COMPLAINT_CATEGORY_ENUM,
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: COMPLAINT_SEVERITY_ENUM,
      default: 'medium_functional_glitch',
      index: true
    },
    status: {
      type: String,
      enum: COMPLAINT_RESOLUTION_STATUS_ENUM,
      default: 'logged_open',
      index: true
    },
    complaintSubject: {
      type: String,
      required: true,
      trim: true
    },
    detailedDescription: {
      type: String,
      required: true,
      trim: true
    },
    evidencePhotoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evidence',
      default: null
    },
    targetResolutionDate: {
      type: Date,
      required: true,
      index: true
    },
    actualResolvedDate: {
      type: Date
    },
    slaResolutionTimeHours: {
      type: Number,
      min: 0
    },
    slaMet: {
      type: Boolean,
      default: true
    },
    investigation: {
      assignedInvestigator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null,
        index: true
      },
      siteVisitRequired: {
        type: Boolean,
        default: true
      },
      siteSurveyOrVisitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FieldVisit',
        default: null
      },
      rootCauseCategory: {
        type: String,
        enum: [
          'manufacturing_defect',
          'faulty_supplier_component',
          'installation_error',
          'client_power_surge',
          'environmental_weather_damage'
        ],
        index: true
      },
      rootCauseFindings: { type: String, trim: true },
      preventiveActionRecommendation: { type: String, trim: true }
    },
    correctiveAction: {
      assignedTechnician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
      },
      actionTakenSummary: { type: String, trim: true },
      replacementPartsUsed: [replacementPartUsedSchema],
      totalRepairCostETB: { type: Number, default: 0, min: 0 },
      costAbsorbedBy: {
        type: String,
        enum: [
          'vector_warranty_reserve',
          'client_billable_out_of_warranty',
          'installer_workmanship_liability'
        ],
        default: 'vector_warranty_reserve'
      }
    },
    resolutionSignOff: {
      clientConfirmedSatisfaction: {
        type: Boolean,
        default: false,
        index: true
      },
      confirmedByClientName: { type: String, trim: true },
      clientSignatureUrl: { type: String, trim: true },
      confirmationDate: { type: Date },
      clientClosingRemarks: { type: String, trim: true },
      completionEvidenceId: {
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

customerComplaintSchema.index({ clientId: 1, status: 1 });
customerComplaintSchema.index({ status: 1, severity: 1 });
customerComplaintSchema.index({ targetResolutionDate: 1, status: 1 });
customerComplaintSchema.index({ category: 1, status: 1 });

export default mongoose.models.CustomerComplaint ||
  mongoose.model('CustomerComplaint', customerComplaintSchema);
