import mongoose from 'mongoose';
import LeaveConfig from './LeaveConfig.js';

const annualLeaveSchema = new mongoose.Schema(
  {
    annualTotalEntitlement: { type: Number, default: 16, min: 0 },
    annualAccruedDays: { type: Number, default: 16, min: 0 },
    accruedMonths: { type: Number, default: 12, min: 0, max: 12 },
    monthlyAccrualRate: { type: Number, default: 1.33, min: 0 },
    annualUsedDays: { type: Number, default: 0, min: 0 },
    annualRemainingDays: { type: Number, default: 16, min: 0 }
  },
  { _id: false }
);

const sickLeaveSchema = new mongoose.Schema(
  {
    sickEntitlement: { type: Number, default: 15, min: 0 },
    sickUsedDays: { type: Number, default: 0, min: 0 },
    sickRemainingDays: { type: Number, default: 15, min: 0 }
  },
  { _id: false }
);

const casualLeaveSchema = new mongoose.Schema(
  {
    casualEntitlement: { type: Number, default: 5, min: 0 },
    maxDaysPerMonth: { type: Number, default: 2, min: 0 }, // Monthly limit restriction
    casualUsedDays: { type: Number, default: 0, min: 0 },
    casualRemainingDays: { type: Number, default: 5, min: 0 }
  },
  { _id: false }
);

const maternityLeaveSchema = new mongoose.Schema(
  {
    maternityEntitlement: { type: Number, default: 120, min: 0 },
    maternityUsedDays: { type: Number, default: 0, min: 0 },
    maternityRemainingDays: { type: Number, default: 120, min: 0 }
  },
  { _id: false }
);

const paternityLeaveSchema = new mongoose.Schema(
  {
    paternityEntitlement: { type: Number, default: 10, min: 0 },
    paternityUsedDays: { type: Number, default: 0, min: 0 },
    paternityRemainingDays: { type: Number, default: 10, min: 0 }
  },
  { _id: false }
);

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear()
    },
    annualLeave: {
      type: annualLeaveSchema,
      default: () => ({})
    },
    sickLeave: {
      type: sickLeaveSchema,
      default: () => ({})
    },
    casualLeave: {
      type: casualLeaveSchema,
      default: () => ({})
    },
    maternityLeave: {
      type: maternityLeaveSchema,
      default: () => ({})
    },
    paternityLeave: {
      type: paternityLeaveSchema,
      default: () => ({})
    },
    carriedForwardDays: {
      type: Number,
      default: 0,
      min: 0
    },
    enforceMonthlyAccrual: {
      type: Boolean,
      default: true
    },
    lastRecalculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: one leave balance per employee per year
leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

/**
 * Method to compute and synchronize monthly pro-rata accrual
 * Elapsed months in the current year determines the accrued portion of annual leave
 * Supports custom monthly progression configured by HR and hire/registration date anchoring
 */
leaveBalanceSchema.methods.recalculateMonthlyAccrual = function (
  asOfDate = new Date(),
  hireDate = null,
  customSchedule = null
) {
  const targetYear = this.year;
  const asOfYear = asOfDate.getFullYear();

  let elapsedMonths = 12;

  if (targetYear > asOfYear) {
    // Future year
    elapsedMonths = 0;
  } else if (targetYear === asOfYear) {
    // Current year: months elapsed so far in the year (1 to 12)
    const currentMonth = asOfDate.getMonth() + 1; // 1-12
    elapsedMonths = currentMonth;

    // If employee was hired this year or calculating from hire date
    if (hireDate) {
      const hDate = new Date(hireDate);
      if (hDate.getFullYear() === targetYear) {
        const hireMonth = hDate.getMonth() + 1;
        // Month 1 is the employee's registration/hire month
        elapsedMonths = Math.max(1, currentMonth - hireMonth + 1);
      }
    }
  } else {
    // Past year: all 12 months accrued
    elapsedMonths = 12;
  }

  elapsedMonths = Math.min(12, Math.max(0, elapsedMonths));
  this.annualLeave.accruedMonths = elapsedMonths;
  const total = this.annualLeave.annualTotalEntitlement || 16;
  const rate = total / 12;
  this.annualLeave.monthlyAccrualRate = Number(rate.toFixed(2));

  let accrued = 0;
  if (elapsedMonths === 0) {
    accrued = 0;
  } else if (
    customSchedule &&
    Array.isArray(customSchedule) &&
    customSchedule.length >= elapsedMonths &&
    typeof customSchedule[elapsedMonths - 1] === 'number'
  ) {
    // Use HR-configured monthly schedule
    accrued = Math.min(total, customSchedule[elapsedMonths - 1]);
  } else {
    // Pro-rata accrued days rounded to nearest half-day
    accrued = Math.min(
      total,
      Math.round(rate * elapsedMonths * 2) / 2
    );
  }

  this.annualLeave.annualAccruedDays = accrued;
  this.recalculateBalances();
};

/**
 * Method to compute and synchronize remaining balances
 */
leaveBalanceSchema.methods.recalculateBalances = function () {
  const accruedOrTotal =
    this.enforceMonthlyAccrual !== false && this.annualLeave.annualAccruedDays !== undefined
      ? this.annualLeave.annualAccruedDays
      : this.annualLeave.annualTotalEntitlement;

  this.annualLeave.annualRemainingDays = Math.max(
    0,
    accruedOrTotal + (this.carriedForwardDays || 0) - (this.annualLeave.annualUsedDays || 0)
  );

  this.sickLeave.sickRemainingDays = Math.max(
    0,
    this.sickLeave.sickEntitlement - (this.sickLeave.sickUsedDays || 0)
  );

  this.casualLeave.casualRemainingDays = Math.max(
    0,
    this.casualLeave.casualEntitlement - (this.casualLeave.casualUsedDays || 0)
  );

  this.maternityLeave.maternityRemainingDays = Math.max(
    0,
    this.maternityLeave.maternityEntitlement - (this.maternityLeave.maternityUsedDays || 0)
  );

  this.paternityLeave.paternityRemainingDays = Math.max(
    0,
    this.paternityLeave.paternityEntitlement - (this.paternityLeave.paternityUsedDays || 0)
  );

  this.lastRecalculatedAt = new Date();
};

/**
 * Static method to fetch or initialize leave balance for an employee for a year
 */
leaveBalanceSchema.statics.getOrCreateForEmployee = async function (employeeId, year = new Date().getFullYear()) {
  let balance = await this.findOne({ employee: employeeId, year });
  if (!balance) {
    const config = await LeaveConfig.getActiveConfig();
    const annualTotal = config.annualEntitlementDefault || 16;
    const monthlyRate = Number((annualTotal / 12).toFixed(2));

    balance = new this({
      employee: employeeId,
      year,
      annualLeave: {
        annualTotalEntitlement: annualTotal,
        annualAccruedDays: annualTotal,
        accruedMonths: 12,
        monthlyAccrualRate: monthlyRate,
        annualUsedDays: 0,
        annualRemainingDays: annualTotal
      },
      sickLeave: {
        sickEntitlement: config.sickEntitlementDefault || 15,
        sickUsedDays: 0,
        sickRemainingDays: config.sickEntitlementDefault || 15
      },
      casualLeave: {
        casualEntitlement: config.casualEntitlementDefault || 5,
        maxDaysPerMonth: config.casualMaxDaysPerMonth || 2,
        casualUsedDays: 0,
        casualRemainingDays: config.casualEntitlementDefault || 5
      },
      maternityLeave: {
        maternityEntitlement: config.maternityEntitlementDefault || 120,
        maternityUsedDays: 0,
        maternityRemainingDays: config.maternityEntitlementDefault || 120
      },
      paternityLeave: {
        paternityEntitlement: config.paternityEntitlementDefault || 10,
        paternityUsedDays: 0,
        paternityRemainingDays: config.paternityEntitlementDefault || 10
      },
      carriedForwardDays: 0,
      enforceMonthlyAccrual: config.enforceMonthlyAccrual !== false
    });
    const customSchedule = config?.isCustomScheduleActive ? config.customMonthlyAccrualSchedule : null;
    balance.recalculateMonthlyAccrual(new Date(), null, customSchedule);
    await balance.save();
  }
  return balance;
};

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);
export default LeaveBalance;
