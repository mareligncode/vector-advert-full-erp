import mongoose from 'mongoose';

/**
 * Standard Ethiopian Income Tax (PAYE) default brackets:
 * 0 - 600: 0%
 * 601 - 1,650: 10% (deductible: 60)
 * 1,651 - 3,200: 15% (deductible: 142.50)
 * 3,201 - 5,250: 20% (deductible: 302.50)
 * 5,251 - 7,800: 25% (deductible: 565)
 * 7,801 - 10,900: 30% (deductible: 955)
 * > 10,900: 35% (deductible: 1,500)
 */
export const DEFAULT_INCOME_TAX_SLABS = [
  { slabName: 'Tier 1 (0%)', minIncome: 0, maxIncome: 600, taxRate: 0, deductibleAmount: 0 },
  { slabName: 'Tier 2 (10%)', minIncome: 601, maxIncome: 1650, taxRate: 10, deductibleAmount: 60 },
  { slabName: 'Tier 3 (15%)', minIncome: 1651, maxIncome: 3200, taxRate: 15, deductibleAmount: 142.5 },
  { slabName: 'Tier 4 (20%)', minIncome: 3201, maxIncome: 5250, taxRate: 20, deductibleAmount: 302.5 },
  { slabName: 'Tier 5 (25%)', minIncome: 5251, maxIncome: 7800, taxRate: 25, deductibleAmount: 565 },
  { slabName: 'Tier 6 (30%)', minIncome: 7801, maxIncome: 10900, taxRate: 30, deductibleAmount: 955 },
  { slabName: 'Tier 7 (35%)', minIncome: 10901, maxIncome: null, taxRate: 35, deductibleAmount: 1500 }
];

const taxSlabSchema = new mongoose.Schema(
  {
    slabName: { type: String, required: true },
    minIncome: { type: Number, required: true, default: 0 },
    maxIncome: { type: Number, default: null },
    taxRate: { type: Number, required: true, min: 0, max: 100 },
    deductibleAmount: { type: Number, default: 0 }
  },
  { _id: true }
);

const payrollConfigSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'Vector Advert ERP',
      trim: true
    },
    currency: {
      type: String,
      default: 'ETB',
      trim: true
    },
    payFrequency: {
      type: String,
      enum: ['monthly', 'bi_weekly', 'weekly'],
      default: 'monthly'
    },
    standardWorkingDaysPerMonth: {
      type: Number,
      default: 22,
      min: 1,
      max: 31
    },
    standardWorkingHoursPerDay: {
      type: Number,
      default: 8,
      min: 1,
      max: 24
    },
    payrollCutoffDay: {
      type: Number,
      default: 25,
      min: 1,
      max: 31
    },
    pensionContribution: {
      employeePensionRate: { type: Number, default: 7, min: 0, max: 100 },
      employerPensionRate: { type: Number, default: 11, min: 0, max: 100 },
      isPensionMandatory: { type: Boolean, default: true }
    },
    incomeTaxSlabs: {
      type: [taxSlabSchema],
      default: DEFAULT_INCOME_TAX_SLABS
    },
    overtimeMultipliers: {
      normalDayMultiplier: { type: Number, default: 1.5, min: 1 },
      nightShiftMultiplier: { type: Number, default: 1.75, min: 1 },
      weekendMultiplier: { type: Number, default: 2.0, min: 1 },
      publicHolidayMultiplier: { type: Number, default: 2.5, min: 1 }
    },
    taxExemptAllowanceLimits: {
      transportAllowanceLimit: { type: Number, default: 2200 },
      foodAllowanceLimit: { type: Number, default: 0 },
      mobileAllowanceLimit: { type: Number, default: 0 }
    },
    latePenalty: {
      enabled: { type: Boolean, default: false },
      graceMinutes: { type: Number, default: 15 },
      ratePerHour: { type: Number, default: 0 } // If 0, uses hourly basic wage
    },
    isActive: {
      type: Boolean,
      default: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

const PayrollConfig = mongoose.model('PayrollConfig', payrollConfigSchema);
export default PayrollConfig;
