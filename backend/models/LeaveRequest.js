import mongoose from 'mongoose';

const approvalHistorySchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'escalated'],
      required: true
    },
    comments: {
      type: String,
      trim: true
    },
    decidedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const leaveRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    leaveBalance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveBalance',
      required: true
    },
    leaveType: {
      type: String,
      enum: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other'],
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    startDayPeriod: {
      type: String,
      enum: ['morning', 'afternoon', 'full_day'],
      default: 'full_day'
    },
    endDate: {
      type: Date,
      required: true
    },
    endDayPeriod: {
      type: String,
      enum: ['morning', 'afternoon', 'full_day'],
      default: 'full_day'
    },
    totalLeaveDays: {
      type: Number,
      required: true,
      min: 0.5
    },
    requestReason: {
      type: String,
      required: true,
      trim: true
    },
    supportingAttachments: [
      {
        type: String,
        trim: true
      }
    ],
    requestStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewComments: {
      type: String,
      trim: true
    },
    reviewDate: {
      type: Date
    },
    approvalHistory: [approvalHistorySchema]
  },
  {
    timestamps: true
  }
);

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
export default LeaveRequest;
