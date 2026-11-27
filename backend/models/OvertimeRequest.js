import mongoose from 'mongoose';

const approveDecisionSchema = new mongoose.Schema(
  {
    approverType: {
      type: String,
      enum: ['Manager', 'HR Officer', 'HR Manager', 'Executive'],
      required: true
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    decision: {
      type: String,
      enum: ['approved', 'rejected'],
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

const overtimeRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      default: null
    },
    requestDate: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    totalHours: {
      type: Number,
      required: true,
      min: 0.5
    },
    overtimeType: {
      type: String,
      enum: ['normal_day', 'night_shift', 'weekend', 'public_holiday'],
      default: 'normal_day'
    },
    rateMultiplier: {
      type: Number,
      default: 1.25,
      min: 1.0,
      max: 5.0
    },
    hourlyRate: {
      type: Number,
      default: 0
    },
    estimatedPayout: {
      type: Number,
      default: 0
    },
    requestReason: {
      type: String,
      required: true,
      trim: true
    },
    advanceApprovalRequired: {
      type: Boolean,
      default: true
    },
    requestStatus: {
      type: String,
      enum: ['pending', 'pending_manager', 'pending_hr', 'approved', 'rejected', 'cancelled'],
      default: 'pending_manager'
    },
    managerApproval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      approvedAt: {
        type: Date
      },
      comments: {
        type: String,
        trim: true
      }
    },
    hrApproval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      approvedAt: {
        type: Date
      },
      comments: {
        type: String,
        trim: true
      }
    },
    approveDecisions: [approveDecisionSchema]
  },
  {
    timestamps: true
  }
);

const OvertimeRequest = mongoose.model('OvertimeRequest', overtimeRequestSchema);
export default OvertimeRequest;
