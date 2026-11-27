import mongoose from 'mongoose';

// 1. Single attachment item schema with individual verification workflow
const attachmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true
    },
    fileName: {
      type: String,
      trim: true
    },
    mimeType: {
      type: String
    },
    fileSize: {
      type: Number // in bytes
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
    // Verification workflow per attachment
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    _id: true,
    timestamps: true
  }
);

// 2. Note / Audit commentary schema
const noteSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    _id: true,
    timestamps: true
  }
);

// 3. Main Evidence schema (Strictly 1 Document per Entity)
const evidenceSchema = new mongoose.Schema(
  {
    // The model name (e.g., 'LeaveRequest', 'FieldVisit', 'Employee', 'OvertimeRequest', etc.)
    entityType: {
      type: String,
      required: true,
      trim: true
    },
    // The _id of the entity
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'entityType'
    },
    // The user who created/owns the parent entity (optional for public submissions like JobApplication)
    entityOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      index: true
    },
    attachments: [attachmentSchema],
    notes: [noteSchema]
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring only 1 Evidence document per entity
evidenceSchema.index({ entityType: 1, entityId: 1 }, { unique: true });

// Virtual summary to inspect overall verification counts
evidenceSchema.virtual('summary').get(function () {
  if (!this.attachments || this.attachments.length === 0) {
    return { total: 0, pending: 0, verified: 0, rejected: 0 };
  }
  return this.attachments.reduce(
    (acc, att) => {
      acc.total += 1;
      acc[att.status] = (acc[att.status] || 0) + 1;
      return acc;
    },
    { total: 0, pending: 0, verified: 0, rejected: 0 }
  );
});

evidenceSchema.set('toJSON', { virtuals: true });
evidenceSchema.set('toObject', { virtuals: true });

const Evidence = mongoose.model('Evidence', evidenceSchema);
export default Evidence;
