import mongoose from 'mongoose';
import { MACHINE_TYPE_ENUM } from '../constants/operationsEnums.js';

const productionMachineSchema = new mongoose.Schema(
  {
    machineCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    machineName: {
      type: String,
      required: true,
      trim: true
    },
    machineType: {
      type: String,
      enum: MACHINE_TYPE_ENUM,
      required: true,
      index: true
    },
    bedDimensions: {
      bedWidthCm: {
        type: Number,
        required: true,
        min: 0
      },
      bedLengthCm: {
        type: Number,
        required: true,
        min: 0
      },
      zAxisClearanceMm: {
        type: Number,
        min: 0
      }
    },
    technicalCapabilities: {
      supportedMaterials: [
        {
          type: String,
          trim: true
        }
      ],
      maxCuttingThicknessMm: {
        type: Number,
        min: 0
      },
      spindleMaxRpm: {
        type: Number,
        min: 0
      },
      laserWattagePower: {
        type: Number,
        min: 0
      },
      vacuumBedEquipped: {
        type: Boolean,
        default: true
      }
    },
    workshopLocationBay: {
      type: String,
      trim: true
    },
    currentOperationalStatus: {
      type: String,
      enum: ['idle', 'in_production', 'maintenance_hold', 'breakdown', 'offline'],
      default: 'idle',
      index: true
    },
    assignedLeadOperator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    hourlyCostRateETB: {
      type: Number,
      default: 0,
      min: 0
    },
    totalOperatingHours: {
      type: Number,
      default: 0,
      min: 0
    },
    maintenanceSchedule: {
      lastMaintenanceDate: {
        type: Date
      },
      nextMaintenanceDueDate: {
        type: Date,
        index: true
      },
      maintenanceNotes: {
        type: String,
        trim: true
      }
    }
  },
  {
    timestamps: true
  }
);

productionMachineSchema.index({ machineType: 1, currentOperationalStatus: 1 });
productionMachineSchema.index({ currentOperationalStatus: 1, 'bedDimensions.bedWidthCm': 1 });

export default mongoose.models.ProductionMachine ||
  mongoose.model('ProductionMachine', productionMachineSchema);
