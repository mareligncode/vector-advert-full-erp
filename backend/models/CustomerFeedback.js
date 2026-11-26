import mongoose from 'mongoose';
import { FEEDBACK_CHANNEL_ENUM } from '../constants/operationsEnums.js';

const customerFeedbackSchema = new mongoose.Schema(
  {
    feedbackCode: {
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
      required: true,
      index: true
    },
    clientOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientOrder',
      default: null,
      index: true
    },
    siteInstallationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SiteInstallation',
      default: null
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    channel: {
      type: String,
      enum: FEEDBACK_CHANNEL_ENUM,
      default: 'in_person_handover',
      index: true
    },
    submissionDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    ratings: {
      overallSatisfactionScore: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        index: true
      },
      designFidelityRating: { type: Number, min: 1, max: 5 },
      illuminationBrightnessRating: { type: Number, min: 1, max: 5 },
      installationWorkmanshipRating: { type: Number, min: 1, max: 5 },
      timelinessDeliveryRating: { type: Number, min: 1, max: 5 },
      communicationStaffRating: { type: Number, min: 1, max: 5 }
    },
    npsScore: {
      type: Number,
      min: 0,
      max: 10,
      index: true
    },
    npsCategory: {
      type: String,
      enum: ['promoter', 'passive', 'detractor'],
      index: true
    },
    clientComments: {
      type: String,
      trim: true
    },
    clientRepresentativeName: {
      type: String,
      required: true,
      trim: true
    },
    clientRepresentativeTitle: {
      type: String,
      trim: true
    },
    allowPublicMarketingShowcase: {
      type: Boolean,
      default: true
    },
    highlightQuoteForWebsite: {
      type: String,
      trim: true
    },
    requiresManagementFollowUp: {
      type: Boolean,
      default: false
    },
    followUpActionTaken: {
      type: String,
      trim: true
    },
    followUpCompletedDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

customerFeedbackSchema.index({ clientId: 1, submissionDate: 1 });
customerFeedbackSchema.index({ 'ratings.overallSatisfactionScore': 1, npsCategory: 1 });
customerFeedbackSchema.index({ jobOrderId: 1, submissionDate: 1 });

export default mongoose.models.CustomerFeedback ||
  mongoose.model('CustomerFeedback', customerFeedbackSchema);
