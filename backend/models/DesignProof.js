import mongoose from 'mongoose';
import {
  PROOF_STATUS_ENUM,
  REVISION_CATEGORY_ENUM,
  APPROVAL_METHOD_ENUM
} from '../constants/operationsEnums.js';

const designProofSchema = new mongoose.Schema(
  {
    proofCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    designTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DesignTask',
      required: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientOrder',
      required: true,
      index: true
    },
    versionNumber: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    },
    isCurrentVersion: {
      type: Boolean,
      default: true,
      index: true
    },
    presentationMedia: {
      daylightMockupImageUrl: { type: String, required: true, trim: true },
      nightIlluminatedMockupImageUrl: { type: String, trim: true },
      technicalDrawingPdfUrl: { type: String, trim: true },
      materialSamplePhotos: [{ type: String, trim: true }]
    },
    productionFiles: {
      cncLaserVectorCutUrl: { type: String, trim: true },
      letterFaceCutPath: { type: String, trim: true },
      letterBackerCutPath: { type: String, trim: true },
      letterReturnContourPath: { type: String, trim: true },
      fullScalePaperStencilPdfUrl: { type: String, trim: true },
      ledLayoutWiringPdfUrl: { type: String, trim: true }
    },
    engineeringSpecs: {
      overallWidthCm: { type: Number, required: true, min: 0 },
      overallHeightCm: { type: Number, required: true, min: 0 },
      strokeWidthMm: { type: Number, min: 0 },
      returnDepthCm: { type: Number, default: 0, min: 0 },
      acrylicThicknessMm: { type: Number, min: 0 },
      backerThicknessMm: { type: Number, min: 0 },
      calculatedTotalLedModules: { type: Number, default: 0, min: 0 },
      calculatedTotalWattage: { type: Number, default: 0, min: 0 },
      recommendedPowerSupplyCapacityWatts: { type: Number, default: 0, min: 0 },
      transformerCount: { type: Number, default: 1, min: 0 }
    },
    status: {
      type: String,
      enum: PROOF_STATUS_ENUM,
      default: 'draft_internal',
      index: true
    },
    submittedToClientDate: { type: Date },
    clientFeedback: {
      reviewedAt: { type: Date },
      reviewedByClientContactName: { type: String, trim: true },
      revisionCategory: { type: String, enum: REVISION_CATEGORY_ENUM },
      feedbackNotes: { type: String, trim: true }
    },
    clientApproval: {
      isApproved: { type: Boolean, default: false, index: true },
      approvedAt: { type: Date },
      approverFullName: { type: String, trim: true },
      approverJobTitle: { type: String, trim: true },
      approvalMethod: { type: String, enum: APPROVAL_METHOD_ENUM },
      signatureImageUrl: { type: String, trim: true },
      signedProofDocumentUrl: { type: String, trim: true },
      witnessedByEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
    },
    isLockedForProduction: {
      type: Boolean,
      default: false,
      index: true
    },
    lockedAt: { type: Date },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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

designProofSchema.index({ designTaskId: 1, versionNumber: 1 }, { unique: true });
designProofSchema.index({ orderId: 1, isCurrentVersion: 1 });
designProofSchema.index({ designTaskId: 1, status: 1 });
designProofSchema.index({ 'clientApproval.isApproved': 1, isLockedForProduction: 1 });

export default mongoose.models.DesignProof || mongoose.model('DesignProof', designProofSchema);
