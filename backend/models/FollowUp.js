import mongoose from 'mongoose';
import {
  ADVERTISING_PRODUCT_CATEGORY_ENUM,
  FOLLOWUP_CHANNEL_ENUM,
  FOLLOWUP_ACTION_TYPE_ENUM,
  FOLLOWUP_STATUS_ENUM
} from '../constants/operationsEnums.js';

const followUpSchema = new mongoose.Schema(
  {
    followUpCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    targetEntity: {
      entityType: {
        type: String,
        enum: ['Lead', 'Client', 'ClientOrder', 'JobOrder'],
        required: true,
        index: true
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'targetEntity.entityType',
        index: true
      },
      referenceNumber: { type: String, trim: true },
      clientOrLeadName: { type: String, trim: true }
    },
    interaction: {
      channel: {
        type: String,
        enum: FOLLOWUP_CHANNEL_ENUM,
        required: true
      },
      occurredAt: {
        type: Date,
        default: Date.now
      },
      conductedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
      },
      clientContactPerson: { type: String, trim: true },
      summary: { type: String, required: true, trim: true },
      detailedNotes: { type: String, trim: true },
      clientSentiment: {
        type: String,
        enum: ['very_positive', 'positive', 'neutral', 'hesitant', 'unhappy_negative'],
        default: 'neutral'
      },
      discussedProductCategories: [
        {
          type: String,
          enum: ADVERTISING_PRODUCT_CATEGORY_ENUM
        }
      ],
      technicalSpecificationsDiscussed: {
        neonColor: { type: String, trim: true },
        acrylicThickness: { type: String, trim: true },
        ledSpecs: { type: String, trim: true },
        powerSupplyRequirements: { type: String, trim: true }
      },
      attachmentEvidenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }
    },
    hasScheduledTask: {
      type: Boolean,
      default: false,
      index: true
    },
    task: {
      actionType: {
        type: String,
        enum: FOLLOWUP_ACTION_TYPE_ENUM
      },
      scheduledDateTime: { type: Date, index: true },
      dueDateTime: { type: Date },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      },
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        index: true
      },
      title: { type: String, trim: true },
      instructions: { type: String, trim: true },
      status: {
        type: String,
        enum: FOLLOWUP_STATUS_ENUM,
        default: 'scheduled',
        index: true
      },
      completedAt: { type: Date },
      completionNotes: { type: String, trim: true },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
    },
    reminderSettings: {
      sendSystemNotification: { type: Boolean, default: true },
      sendTelegramNotification: { type: Boolean, default: true },
      sendEmailNotification: { type: Boolean, default: false },
      notifyMinutesBefore: { type: Number, default: 60 },
      notificationDispatched: { type: Boolean, default: false },
      dispatchedAt: { type: Date }
    },
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

followUpSchema.index({ 'targetEntity.entityType': 1, 'targetEntity.entityId': 1 });
followUpSchema.index({ 'task.status': 1, 'task.scheduledDateTime': 1 });
followUpSchema.index({ 'task.assignedTo': 1, 'task.status': 1 });
followUpSchema.index({ 'reminderSettings.notificationDispatched': 1, 'task.scheduledDateTime': 1 });

export default mongoose.models.FollowUp || mongoose.model('FollowUp', followUpSchema);
