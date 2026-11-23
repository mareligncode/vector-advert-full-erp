import mongoose from 'mongoose';

const approvalStageSchema = new mongoose.Schema(
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

const payrollRunSchema = new mongoose.Schema(
  {
    payrollCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    periodMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    periodYear: {
      type: Number,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    paymentDate: {
      type: Date
    },
    payrollStatus: {
      type: String,
      enum: [
        'draft',
        'calculating',
        'pending_hr_review',
        'pending_finance_approval',
        'pending_executive_approval',
        'approved',
        'disbursed',
        'cancelled'
      ],
      default: 'draft',
      index: true
    },
    totalEmployees: {
      type: Number,
      default: 0
    },
    financialSummary: {
      totalBasicSalary: { type: Number, default: 0 },
      totalAllowances: { type: Number, default: 0 },
      totalOvertimePay: { type: Number, default: 0 },
      totalGrossPay: { type: Number, default: 0 },
      totalTaxableIncome: { type: Number, default: 0 },
      totalIncomeTax: { type: Number, default: 0 },
      totalEmployeePension: { type: Number, default: 0 },
      totalEmployerPension: { type: Number, default: 0 },
      totalLoanDeductions: { type: Number, default: 0 },
      totalOtherDeductions: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
      totalNetPay: { type: Number, default: 0 },
      totalCompanyCost: { type: Number, default: 0 }
    },
    approvals: {
      preparedBy: {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        comments: { type: String, trim: true }
      },
      hrApproval: {
        type: approvalStageSchema,
        default: () => ({ status: 'pending' })
      },
      financeApproval: {
        type: approvalStageSchema,
        default: () => ({ status: 'pending' })
      },
      executiveApproval: {
        type: approvalStageSchema,
        default: () => ({ status: 'pending' })
      }
    },
    disbursementDetails: {
      disbursedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      disbursedAt: { type: Date },
      sourceBankAccount: { type: String, trim: true },
      paymentReference: { type: String, trim: true },
      proofDocumentUrl: { type: String, trim: true }
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

payrollRunSchema.index({ periodYear: 1, periodMonth: 1 });

const PayrollRun = mongoose.model('PayrollRun', payrollRunSchema);
export default PayrollRun;
