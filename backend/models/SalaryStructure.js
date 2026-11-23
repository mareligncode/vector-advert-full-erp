import mongoose from 'mongoose';

const earningComponentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0, default: 0 },
    isTaxable: { type: Boolean, default: true },
    taxExemptLimit: { type: Number, default: 0, min: 0 },
    isRecurring: { type: Boolean, default: true }
  },
  { _id: true }
);

const deductionComponentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0, min: 0 },
    deductionType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    percentageRate: { type: Number, default: 0, min: 0, max: 100 },
    isPreTax: { type: Boolean, default: false },
    isRecurring: { type: Boolean, default: true }
  },
  { _id: true }
);

const salaryStructureSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveTo: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'superseded'],
      default: 'active',
      index: true
    },
    baseSalary: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'cheque'],
      default: 'bank_transfer'
    },
    bankAccount: {
      bankName: { type: String, trim: true },
      holderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      branch: { type: String, trim: true }
    },
    isOvertimeEligible: {
      type: Boolean,
      default: true
    },
    isPensionEligible: {
      type: Boolean,
      default: true
    },
    isTaxExempt: {
      type: Boolean,
      default: false
    },
    earnings: [earningComponentSchema],
    deductions: [deductionComponentSchema],
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
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

const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);
export default SalaryStructure;
