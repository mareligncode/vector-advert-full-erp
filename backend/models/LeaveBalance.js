import mongoose from 'mongoose';

const annualLeaveSchema = new mongoose.Schema(
  {
    annualTotalEntitlement: { type: Number, default: 16, min: 0 },
    annualAccruedDays: { type: Number, default: 16, min: 0 },
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
 * Method to compute and synchronize remaining balances
 */
leaveBalanceSchema.methods.recalculateBalances = function () {
  const accruedOrTotal =
    this.annualLeave.annualAccruedDays !== undefined
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
    balance = new this({
      employee: employeeId,
      year,
      annualLeave: {
        annualTotalEntitlement: 16,
        annualAccruedDays: 16,
        annualUsedDays: 0,
        annualRemainingDays: 16
      },
      sickLeave: {
        sickEntitlement: 15,
        sickUsedDays: 0,
        sickRemainingDays: 15
      },
      casualLeave: {
        casualEntitlement: 5,
        casualUsedDays: 0,
        casualRemainingDays: 5
      },
      maternityLeave: {
        maternityEntitlement: 120,
        maternityUsedDays: 0,
        maternityRemainingDays: 120
      },
      paternityLeave: {
        paternityEntitlement: 10,
        paternityUsedDays: 0,
        paternityRemainingDays: 10
      },
      carriedForwardDays: 0
    });
    balance.recalculateBalances();
    await balance.save();
  }
  return balance;
};

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);
export default LeaveBalance;
