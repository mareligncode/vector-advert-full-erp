import mongoose from 'mongoose';
import {
  MAINTENANCE_FREQUENCY_ENUM,
  MAINTENANCE_TASK_CATEGORY_ENUM
} from '../constants/operationsEnums.js';

const checklistResultItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      trim: true
    },
    taskName: {
      type: String,
      required: true,
      trim: true
    },
    taskCategory: {
      type: String,
      enum: MAINTENANCE_TASK_CATEGORY_ENUM,
      required: true
    },
    isSatisfactory: {
      type: Boolean,
      required: true
    },
    loggedNumericalValue: {
      type: Number
    },
    statusAction: {
      type: String,
      enum: [
        'satisfactory_ok',
        'cleaned_and_cleared',
        'adjusted_and_re-torqued',
        'lubricated',
        'defect_escalated_to_repair'
      ],
      default: 'satisfactory_ok'
    },
    technicianObservations: {
      type: String,
      trim: true
    },
    photoUrl: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

const machineMaintenanceLogSchema = new mongoose.Schema(
  {
    logCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionMachine',
      required: true,
      index: true
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MachineMaintenanceSchedule',
      default: null,
      index: true
    },
    frequency: {
      type: String,
      enum: MAINTENANCE_FREQUENCY_ENUM,
      required: true,
      index: true
    },
    machineOperatingHoursAtLog: {
      type: Number,
      min: 0
    },
    conductedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    performedDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    shift: {
      type: String,
      enum: [
        'morning_pre_shift',
        'afternoon_mid_shift',
        'evening_post_shift',
        'night_maintenance'
      ],
      default: 'morning_pre_shift'
    },
    checklistResults: [checklistResultItemSchema],
    environmentalParameters: {
      ambientWorkshopTempCelsius: { type: Number },
      chillerFluidTempCelsius: { type: Number },
      pneumaticAirPressureBar: { type: Number },
      spindleWarmupCycleCompleted: { type: Boolean, default: false },
      nozzleHealthTestPercentage: { type: Number, min: 0, max: 100 }
    },
    supervisorCertified: {
      type: Boolean,
      default: false,
      index: true
    },
    supervisorEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    certifiedAt: {
      type: Date
    },
    overallResult: {
      type: String,
      enum: [
        'passed_ready_for_production',
        'conditional_pass_with_snags',
        'failed_locked_for_repair'
      ],
      default: 'passed_ready_for_production',
      index: true
    },
    supervisorNotes: {
      type: String,
      trim: true
    },
    evidenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evidence',
      default: null
    }
  },
  {
    timestamps: true
  }
);

machineMaintenanceLogSchema.index({ machineId: 1, performedDate: 1 });
machineMaintenanceLogSchema.index({ frequency: 1, performedDate: 1 });
machineMaintenanceLogSchema.index({ overallResult: 1, supervisorCertified: 1 });

export default mongoose.models.MachineMaintenanceLog ||
  mongoose.model('MachineMaintenanceLog', machineMaintenanceLogSchema);
