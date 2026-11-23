import mongoose from 'mongoose';

const loanApprovalStageSchema = new mongoose.Schema(
  {
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
  { _id: false }
);

const repaymentHistorySchema = new mongoose.Schema(
  {
    payrollRun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollRun'
    },
    payslip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payslip'
    },
    installmentNumber: {
      type: Number,
      required: true
    },
    amountPaid: {
      type: Number,
      required: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    balanceAfterPayment: {
      type: Number,
      required: true
    }
  },
  { _id: true }
);

const salaryAdvanceLoanSchema = new mongoose.Schema(
  {
    loanCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    requestType: {
      type: String,
      enum: ['salary_advance', 'staff_loan', 'emergency_loan', 'education_loan'],
      default: 'salary_advance'
    },
    amountRequested: {
      type: Number,
      required: true,
      min: 1
    },
    amountApproved: {
      type: Number,
      default: 0
    },
    disbursementDate: {
      type: Date
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    totalInstallments: {
      type: Number,
      default: 1,
      min: 1
    },
    monthlyDeductionAmount: {
      type: Number,
      default: 0
    },
    deductionStartMonth: {
      type: Number,
      min: 1,
      max: 12
    },
    deductionStartYear: {
      type: Number
    },
    remainingBalance: {
      type: Number,
      default: 0
    },
    repaymentStatus: {
      type: String,
      enum: [
        'pending_approval',
        'approved',
        'active',
        'repaid',
        'suspended',
        'rejected',
        'written_off'
      ],
      default: 'pending_approval',
      index: true
    },
    repaymentHistory: [repaymentHistorySchema],
    approvals: {
      managerApproval: {
        type: loanApprovalStageSchema,
        default: () => ({ status: 'pending' })
      },
      hrApproval: {
        type: loanApprovalStageSchema,
        default: () => ({ status: 'pending' })
      },
      financeApproval: {
        type: loanApprovalStageSchema,
        default: () => ({ status: 'pending' })
      }
    },
    disbursementReference: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const SalaryAdvanceLoan = mongoose.model('SalaryAdvanceLoan', salaryAdvanceLoanSchema);
export default SalaryAdvanceLoan;
