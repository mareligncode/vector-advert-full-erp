import mongoose from 'mongoose';
import {
  ADVERTISING_PRODUCT_CATEGORY_ENUM,
  LEAD_SOURCE_ENUM,
  LEAD_STATUS_ENUM
} from '../constants/operationsEnums.js';

const manufacturingInterestSchema = new mongoose.Schema(
  {
    productCategory: {
      type: String,
      enum: ADVERTISING_PRODUCT_CATEGORY_ENUM,
      required: true
    },
    estimatedDimensions: {
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      depth: { type: Number, min: 0 },
      unit: { type: String, enum: ['cm', 'meter', 'inch'], default: 'meter' }
    },
    illuminationType: {
      type: String,
      enum: [
        'front_lit',
        'back_halo_lit',
        'front_and_back_lit',
        'edge_lit',
        'non_illuminated',
        'rgb_color_changing'
      ]
    },
    specificationsSummary: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    leadNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    companyName: {
      type: String,
      trim: true
    },
    pointOfContact: {
      name: { type: String, required: true, trim: true },
      jobTitle: { type: String, trim: true },
      isDecisionMaker: { type: Boolean, default: false }
    },
    phone: {
      primary: { type: String, required: true, trim: true, index: true },
      alternative: { type: String, trim: true },
      hasTelegram: { type: Boolean, default: false },
      hasWhatsApp: { type: Boolean, default: false }
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    address: {
      city: { type: String, default: 'Addis Ababa', trim: true },
      subcity: { type: String, trim: true },
      woreda: { type: String, trim: true },
      specificLocation: { type: String, trim: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      }
    },
    source: {
      type: String,
      enum: LEAD_SOURCE_ENUM,
      required: true,
      default: 'walk_in',
      index: true
    },
    status: {
      type: String,
      enum: LEAD_STATUS_ENUM,
      required: true,
      default: 'new',
      index: true
    },
    manufacturingInterests: [manufacturingInterestSchema],
    estimatedValue: {
      amount: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'ETB' },
      isFlexibleBudget: { type: Boolean, default: true }
    },
    qualificationRating: {
      type: String,
      enum: ['hot', 'warm', 'cold'],
      default: 'warm',
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      index: true
    },
    siteSurveyRequired: {
      type: Boolean,
      default: false
    },
    siteSurveyDetails: {
      scheduledDate: { type: Date },
      surveyorEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      surveyStatus: {
        type: String,
        enum: ['not_scheduled', 'pending', 'completed'],
        default: 'not_scheduled'
      },
      surveyNotes: { type: String, trim: true },
      evidenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }
    },
    lostReason: {
      reason: {
        type: String,
        enum: [
          'price_too_high',
          'competitor_chosen',
          'project_cancelled',
          'timeline_too_long',
          'unresponsive',
          'other'
        ]
      },
      notes: { type: String, trim: true }
    },
    convertedClient: {
      isConverted: { type: Boolean, default: false, index: true },
      convertedAt: { type: Date },
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
      initialClientOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientOrder' }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

leadSchema.index({ status: 1, assignedTo: 1 });
leadSchema.index({ source: 1, createdAt: -1 });
leadSchema.index({ 'phone.primary': 1, status: 1 });
leadSchema.index({ qualificationRating: 1, status: 1 });

export default mongoose.models.Lead || mongoose.model('Lead', leadSchema);
