import mongoose from 'mongoose';
import {
  MACHINE_TYPE_ENUM,
  MAINTENANCE_FREQUENCY_ENUM,
  MAINTENANCE_TASK_CATEGORY_ENUM
} from '../constants/operationsEnums.js';

const checklistTemplateItemSchema = new mongoose.Schema(
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
    instructionDetails: {
      type: String,
      trim: true
    },
    hasNumericalReading: {
      type: Boolean,
      default: false
    },
    expectedRange: {
      minValue: { type: Number },
      maxValue: { type: Number },
      unit: { type: String, trim: true }
    },
    requiresPhotoEvidence: {
      type: Boolean,
      default: false
    },
    isSafetyCritical: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const machineMaintenanceScheduleSchema = new mongoose.Schema(
  {
    scheduleCode: {
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
    machineType: {
      type: String,
      enum: MACHINE_TYPE_ENUM,
      required: true,
      index: true
    },
    frequency: {
      type: String,
      enum: MAINTENANCE_FREQUENCY_ENUM,
      required: true,
      index: true
    },
    scheduleTitle: {
      type: String,
      required: true,
      trim: true
    },
    estimatedDurationMinutes: {
      type: Number,
      min: 0
    },
    checklistTemplate: [checklistTemplateItemSchema],
    assignedRole: {
      type: String,
      enum: ['machine_operator', 'maintenance_technician', 'lead_electrician'],
      default: 'machine_operator'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

machineMaintenanceScheduleSchema.index({ machineId: 1, frequency: 1 });
machineMaintenanceScheduleSchema.index({ machineType: 1, isActive: 1 });

export default mongoose.models.MachineMaintenanceSchedule ||
  mongoose.model('MachineMaintenanceSchedule', machineMaintenanceScheduleSchema);
