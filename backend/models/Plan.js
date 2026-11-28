import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    role: {
      type: String,
      trim: true
    },
    performance: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

const checklistItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Checklist item name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isChecked: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    checklist: [checklistItemSchema],
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    doneBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'blocked'],
      default: 'pending'
    },
    dueDate: {
      type: Date
    }
  },
  { _id: true, timestamps: true }
);

const planDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['SOP', 'Milestone', 'Other'],
      default: 'Other'
    },
    url: {
      type: String,
      required: [true, 'Document URL is required'],
      trim: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true
    },
    parentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null
    },
    type: {
      type: String,
      enum: ['yearly', 'half yearly', 'half_yearly', 'quarterly', 'monthly', 'weekly', 'daily', 'custom'],
      required: [true, 'Plan type is required'],
      lowercase: true,
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    periodLabel: {
      type: String,
      trim: true
    },
    keyGoal: {
      type: String,
      trim: true
    },
    taskDetail: {
      type: String,
      trim: true
    },
    activity: {
      type: String,
      trim: true
    },
    expectedOutput: {
      type: String,
      trim: true
    },
    correctiveAction: {
      type: String,
      trim: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    supportTeamText: {
      type: String,
      trim: true
    },
    remark: {
      type: String,
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    description: {
      type: String,
      trim: true
    },
    kpis: {
      type: mongoose.Schema.Types.Mixed
    },
    target: {
      type: String,
      trim: true
    },
    budget: {
      type: Number,
      default: 0,
      min: 0
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    teams: [teamMemberSchema],
    tasks: [taskSchema],
    planDate: {
      type: Date
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'],
      default: 'draft'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    supportTeams: [teamMemberSchema],
    note: {
      type: String,
      trim: true
    },
    documents: [planDocumentSchema]
  },
  {
    timestamps: true
  }
);

planSchema.index({ department: 1, type: 1 });
planSchema.index({ parentPlan: 1 });
planSchema.index({ status: 1 });
planSchema.index({ leader: 1 });

const Plan = mongoose.model('Plan', planSchema);
export default Plan;
