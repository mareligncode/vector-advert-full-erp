import mongoose from 'mongoose';

const professionalUpgradeSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    upgradeType: {
      type: String,
      enum: ['degree', 'masters', 'phd', 'certification', 'diploma', 'course', 'workshop', 'other'],
      required: [true, 'Upgrade type is required'],
      trim: true
    },
    upgradeTitle: {
      type: String,
      required: [true, 'Upgrade title is required'],
      trim: true
    },
    institution: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true
    },
    fieldOfStudy: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    expectedCompletionDate: {
      type: Date
    },
    completionDate: {
      type: Date
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: 0
    },
    companySponsorshipRequested: {
      type: Boolean,
      default: false
    },
    supportingDocuments: [
      {
        type: String,
        trim: true
      }
    ],
    requestStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNotes: {
      type: String,
      trim: true
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

professionalUpgradeSchema.index({ employee: 1, requestStatus: 1 });

const ProfessionalUpgrade = mongoose.model('ProfessionalUpgrade', professionalUpgradeSchema);
export default ProfessionalUpgrade;
