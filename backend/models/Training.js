import mongoose from 'mongoose';

const participantAttendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'present'
    }
  },
  { _id: true }
);

const participantSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    attendance: [participantAttendanceSchema],
    completionStatus: {
      type: String,
      enum: ['enrolled', 'in_progress', 'completed', 'failed', 'dropped'],
      default: 'enrolled'
    },
    certificateUrl: {
      type: String,
      trim: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    remarks: {
      type: String,
      trim: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    }
  },
  { _id: true }
);

const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Training title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    trainingType: {
      type: String,
      enum: ['internal', 'external', 'online', 'workshop', 'on_the_job', 'certification', 'other'],
      default: 'internal',
      trim: true
    },
    trainerName: {
      type: String,
      trim: true
    },
    provider: {
      type: String,
      trim: true
    },
    department: [
      {
        type: String,
        trim: true
      }
    ],
    location: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    duration: {
      type: String,
      trim: true
    },
    budget: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['planned', 'scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'planned'
    },
    attachments: [
      {
        type: String,
        trim: true
      }
    ],
    note: {
      type: String,
      trim: true
    },
    participants: [participantSchema]
  },
  {
    timestamps: true
  }
);

trainingSchema.index({ status: 1, startDate: 1 });
trainingSchema.index({ 'participants.employee': 1 });

const Training = mongoose.model('Training', trainingSchema);
export default Training;
