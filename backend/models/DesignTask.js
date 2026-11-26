import mongoose from 'mongoose';
import { DESIGN_TASK_STATUS_ENUM } from '../constants/operationsEnums.js';

const designTaskSchema = new mongoose.Schema(
  {
    taskCode: {
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
    assignedDesigner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    artDirector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    briefTitle: {
      type: String,
      required: true,
      trim: true
    },
    clientBrandAssets: {
      brandLogoVectorUrl: { type: String, trim: true },
      brandFonts: [{ type: String, trim: true }],
      brandColorCodes: [{ type: String, trim: true }],
      clientNotes: { type: String, trim: true }
    },
    technicalDeliverablesRequired: {
      requires3dDaylightRender: { type: Boolean, default: true },
      requires3dNightIlluminatedRender: { type: Boolean, default: true },
      requiresCncVectorCutPaths: { type: Boolean, default: true },
      requires1to1MountingPaperStencil: { type: Boolean, default: true },
      requiresWiringDiagram: { type: Boolean, default: true }
    },
    status: {
      type: String,
      enum: DESIGN_TASK_STATUS_ENUM,
      default: 'assigned',
      index: true
    },
    targetCompletionDate: {
      type: Date,
      required: true,
      index: true
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    totalDesignHours: { type: Number, default: 0, min: 0 },
    revisionCount: { type: Number, default: 0, min: 0 }
  },
  {
    timestamps: true
  }
);

designTaskSchema.index({ orderId: 1, status: 1 });
designTaskSchema.index({ assignedDesigner: 1, status: 1 });
designTaskSchema.index({ targetCompletionDate: 1, status: 1 });

export default mongoose.models.DesignTask || mongoose.model('DesignTask', designTaskSchema);
