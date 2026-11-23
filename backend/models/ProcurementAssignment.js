import mongoose from 'mongoose';

const procurementAssignmentSchema = new mongoose.Schema(
  {
    assignmentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    purchaseRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseRequest',
      required: true,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'quoted', 'completed', 'cancelled'],
      default: 'assigned'
    },
    dueDate: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.ProcurementAssignment ||
  mongoose.model('ProcurementAssignment', procurementAssignmentSchema);
