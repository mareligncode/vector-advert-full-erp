import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    cleared: {
      type: Boolean,
      default: false
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

const departmentClearanceSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      enum: ['department_head', 'store', 'it', 'finance', 'hr'],
      required: true
    },
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
    note: {
      type: String,
      trim: true
    },
    items: [checklistItemSchema]
  },
  { _id: true }
);

const clearanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    resignationDate: {
      type: Date,
      required: true
    },
    lastWorkingDay: {
      type: Date,
      required: true
    },
    reasonForLeaving: {
      type: String,
      required: true,
      trim: true
    },
    clearances: [departmentClearanceSchema],
    overallClearanceStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    clearanceCertificateUrl: {
      type: String,
      trim: true
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
clearanceSchema.index({ employee: 1 });
clearanceSchema.index({ overallClearanceStatus: 1 });

/**
 * Standard default checklist items for each department
 */
export const DEFAULT_DEPARTMENT_CLEARANCES = [
  {
    department: 'department_head',
    status: 'pending',
    items: [
      { name: 'Operational Handover of Tasks & Active Projects', cleared: false },
      { name: 'Handover of Physical & Digital Files/Client Assets', cleared: false },
      { name: 'Knowledge Transfer & Delegation of Responsibilities', cleared: false }
    ]
  },
  {
    department: 'store',
    status: 'pending',
    items: [
      { name: 'Return of Company Uniforms & Safety Gear', cleared: false },
      { name: 'Return of Office Keys, Drawers & Access Tokens', cleared: false },
      { name: 'Physical Tools & Equipment Handover', cleared: false }
    ]
  },
  {
    department: 'it',
    status: 'pending',
    items: [
      { name: 'Company Laptop & Charger Handover', cleared: false },
      { name: 'Revocation of Corporate Email & Cloud Access', cleared: false },
      { name: 'Revocation of ERP, Database & VPN Credentials', cleared: false }
    ]
  },
  {
    department: 'finance',
    status: 'pending',
    items: [
      { name: 'Settlement of Salary Advance & Company Loans', cleared: false },
      { name: 'Petty Cash & Expense Reports Reconciliation', cleared: false },
      { name: 'Final Severance & Leave Encashment Calculation', cleared: false }
    ]
  },
  {
    department: 'hr',
    status: 'pending',
    items: [
      { name: 'Completion of Exit Interview Questionnaire', cleared: false },
      { name: 'Return of Company ID Badge & Health Card', cleared: false },
      { name: 'Issuance of Experience & Clearance Certificate', cleared: false }
    ]
  }
];

/**
 * Recalculate overall status based on 5 department subdocuments
 */
clearanceSchema.methods.recalculateOverallStatus = function () {
  if (this.overallClearanceStatus === 'completed') {
    return this.overallClearanceStatus;
  }

  const deptList = this.clearances || [];

  const hasRejected = deptList.some((d) => d.status === 'rejected');
  if (hasRejected) {
    this.overallClearanceStatus = 'rejected';
    return this.overallClearanceStatus;
  }

  const allApproved =
    deptList.length >= 5 && deptList.every((d) => d.status === 'approved');
  if (allApproved) {
    this.overallClearanceStatus = 'approved';
    return this.overallClearanceStatus;
  }

  const anyApproved = deptList.some((d) => d.status === 'approved');
  if (anyApproved) {
    this.overallClearanceStatus = 'in_progress';
    return this.overallClearanceStatus;
  }

  this.overallClearanceStatus = 'pending';
  return this.overallClearanceStatus;
};

const Clearance = mongoose.model('Clearance', clearanceSchema);
export default Clearance;
