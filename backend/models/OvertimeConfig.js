import mongoose from 'mongoose';

const OvertimeConfigSchema = new mongoose.Schema(
  {
    // Ethiopian Labor Proclamation Multiplier Rates
    dayShiftMultiplier: {
      type: Number,
      default: 1.25,
      min: 1.0,
      max: 3.0,
    },
    nightShiftMultiplier: {
      type: Number,
      default: 1.5,
      min: 1.0,
      max: 3.0,
    },
    weekendMultiplier: {
      type: Number,
      default: 2.0,
      min: 1.0,
      max: 4.0,
    },
    holidayMultiplier: {
      type: Number,
      default: 2.5,
      min: 1.0,
      max: 5.0,
    },

    // Policy Caps and Thresholds
    maxMonthlyHoursAlert: {
      type: Number,
      default: 30,
      min: 1,
      max: 100,
    },
    requireAdvanceApproval: {
      type: Boolean,
      default: true,
    },
    nightShiftStart: {
      type: String,
      default: '22:00',
    },
    nightShiftEnd: {
      type: String,
      default: '06:00',
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

OvertimeConfigSchema.statics.getActiveConfig = async function () {
  let config = await this.findOne().sort({ createdAt: -1 });
  if (!config) {
    config = await this.create({});
  }
  return config;
};

const OvertimeConfig = mongoose.model('OvertimeConfig', OvertimeConfigSchema);
export default OvertimeConfig;
