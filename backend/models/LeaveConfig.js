import mongoose from 'mongoose';

const LeaveConfigSchema = new mongoose.Schema(
  {
    // Annual Leave Settings
    annualEntitlementDefault: {
      type: Number,
      default: 16,
      min: 1,
      max: 60,
    },
    enforceMonthlyAccrual: {
      type: Boolean,
      default: true,
    },
    allowAdvanceLeave: {
      type: Boolean,
      default: true,
    },
    restrictProbationEmployees: {
      type: Boolean,
      default: true,
    },
    maxCarryForwardDays: {
      type: Number,
      default: 5,
      min: 0,
      max: 30,
    },

    // Accrual Cycle & Monthly Schedule
    accrualCycleMode: {
      type: String,
      enum: ['hire_date', 'ethiopian_calendar', 'gregorian_calendar'],
      default: 'hire_date', // Accrual starts from employee's registration/hire month
    },
    isCustomScheduleActive: {
      type: Boolean,
      default: false,
    },
    customMonthlyAccrualSchedule: {
      type: [Number],
      default: () => [1.5, 2.5, 4.0, 5.5, 6.5, 8.0, 9.5, 10.5, 12.0, 13.5, 14.5, 16.0],
    },

    // Casual Leave Settings
    casualEntitlementDefault: {
      type: Number,
      default: 5,
      min: 0,
      max: 30,
    },
    casualMaxDaysPerMonth: {
      type: Number,
      default: 2,
      min: 1,
      max: 10,
    },

    // Other Leave Types Defaults (days)
    sickEntitlementDefault: {
      type: Number,
      default: 15,
      min: 0,
      max: 180,
    },
    maternityEntitlementDefault: {
      type: Number,
      default: 120,
      min: 0,
      max: 180,
    },
    paternityEntitlementDefault: {
      type: Number,
      default: 10,
      min: 0,
      max: 30,
    },
    compassionateEntitlementDefault: {
      type: Number,
      default: 3,
      min: 0,
      max: 15,
    },

    // Auditing
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Singleton helper: fetches existing active config or creates initial default
LeaveConfigSchema.statics.getActiveConfig = async function () {
  let config = await this.findOne().sort({ createdAt: -1 });
  if (!config) {
    config = await this.create({});
  }
  return config;
};

const LeaveConfig = mongoose.model('LeaveConfig', LeaveConfigSchema);

export default LeaveConfig;
