import mongoose from 'mongoose';
import {
  PRODUCTION_REQUEST_STATUS_ENUM,
  JOB_PRIORITY_ENUM,
  MACHINE_TYPE_ENUM,
  MACHINE_OPERATION_STATUS_ENUM,
  FINISHING_OPERATION_TYPE_ENUM,
  FINISHING_TASK_STATUS_ENUM
} from '../constants/operationsEnums.js';

const submittedMaterialSchema = new mongoose.Schema(
  {
    materialCategory: {
      type: String,
      enum: [
        'substrate_sheet',
        'lighting_led_neon',
        'power_transformer',
        'bonding_chemical_adhesive',
        'metal_profile_framing',
        'mounting_hardware',
        'vinyl_film'
      ],
      required: true
    },
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      default: null
    },
    materialName: {
      type: String,
      required: true,
      trim: true
    },
    colorOrTone: {
      type: String,
      trim: true
    },
    quantitySubmitted: {
      type: Number,
      required: true,
      min: 0
    },
    unitOfMeasure: {
      type: String,
      enum: ['sheet', 'meter', 'roll', 'piece', 'liter', 'kg'],
      required: true
    },
    storeIssueVoucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StoreIssueVoucher',
      default: null
    },
    isDispensedFromStore: {
      type: Boolean,
      default: false,
      index: true
    },
    dispensedAt: {
      type: Date
    },
    actualQuantityConsumed: {
      type: Number,
      min: 0
    },
    scrapOrWastageQuantity: {
      type: Number,
      min: 0
    }
  },
  { _id: true }
);

const finishingTaskSchema = new mongoose.Schema(
  {
    taskNumber: {
      type: String,
      trim: true
    },
    operationType: {
      type: String,
      enum: FINISHING_OPERATION_TYPE_ENUM,
      required: true,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    assignedCraftsman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: FINISHING_TASK_STATUS_ENUM,
      default: 'assigned',
      index: true
    },
    stencilTemplateReferenceUrl: {
      type: String,
      trim: true
    },
    wiringDiagramUrl: {
      type: String,
      trim: true
    },
    consumablesAllocated: [
      {
        stockItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'StockItem'
        },
        itemName: {
          type: String,
          trim: true
        },
        quantity: {
          type: Number,
          min: 0
        },
        unit: {
          type: String,
          trim: true
        }
      }
    ],
    benchElectricalCheck: {
      testedOnBench: {
        type: Boolean,
        default: false
      },
      measuredVoltageDC: {
        type: Number
      },
      measuredAmperage: {
        type: Number
      },
      zeroShortCircuitConfirmed: {
        type: Boolean,
        default: false
      },
      powerSupplySerialOrCode: {
        type: String,
        trim: true
      }
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    durationMinutes: {
      type: Number,
      min: 0
    },
    craftsmanNotes: {
      type: String,
      trim: true
    },
    verificationPhotoUrl: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

const productionRequestSchema = new mongoose.Schema(
  {
    productionRequestCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    jobOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOrder',
      required: true,
      index: true
    },
    jobOrderNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    clientOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientOrder',
      required: true,
      index: true
    },
    designProofId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DesignProof',
      required: true,
      index: true
    },
    requestTitle: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: JOB_PRIORITY_ENUM,
      default: 'normal',
      index: true
    },
    status: {
      type: String,
      enum: PRODUCTION_REQUEST_STATUS_ENUM,
      default: 'submitted_to_shopfloor',
      index: true
    },
    submittedDimensions: {
      finishedDimensions: {
        widthCm: {
          type: Number,
          required: true,
          min: 0
        },
        heightCm: {
          type: Number,
          required: true,
          min: 0
        },
        depthReturnCm: {
          type: Number,
          min: 0
        },
        totalFabricatedAreaSqM: {
          type: Number,
          required: true,
          min: 0
        }
      },
      thicknessSpecifications: {
        faceThicknessMm: { type: Number, min: 0 },
        backerThicknessMm: { type: Number, min: 0 },
        metalReturnGaugeMm: { type: Number, min: 0 },
        neonChannelDepthMm: { type: Number, min: 0 }
      },
      quantityUnits: {
        type: Number,
        required: true,
        min: 1
      },
      machineBedNestingLayout: {
        rawSheetWidthCm: { type: Number, min: 0 },
        rawSheetLengthCm: { type: Number, min: 0 },
        sheetsRequiredCount: { type: Number, min: 0 },
        estimatedNestingYieldPercentage: { type: Number, min: 0, max: 100 }
      }
    },
    submittedMaterials: [submittedMaterialSchema],
    machineSelection: {
      machineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionMachine',
        required: true,
        index: true
      },
      machineType: {
        type: String,
        enum: MACHINE_TYPE_ENUM,
        required: true
      },
      assignedOperator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
      },
      toolpathCutFileUrl: {
        type: String,
        required: true,
        trim: true
      },
      toolpathFileFormat: {
        type: String,
        enum: ['DXF', 'AI', 'EPS', 'NC_GCODE', 'PLT'],
        default: 'DXF'
      },
      cuttingLayerTarget: {
        type: String,
        trim: true
      },
      machiningExecution: {
        operationStatus: {
          type: String,
          enum: MACHINE_OPERATION_STATUS_ENUM,
          default: 'idle_awaiting_job',
          index: true
        },
        toolingSpecs: {
          type: String,
          trim: true
        },
        scheduledStartTime: { type: Date },
        actualStartTime: { type: Date },
        actualEndTime: { type: Date },
        machineRunMinutes: { type: Number, min: 0 },
        linearCutMeters: { type: Number, min: 0 },
        scrapAndWaste: {
          scrapAreaSqM: { type: Number, default: 0, min: 0 },
          damagedSheetCount: { type: Number, default: 0, min: 0 },
          scrapReasonNotes: { type: String, trim: true }
        },
        operatorNotes: { type: String, trim: true }
      }
    },
    finishingTasks: [finishingTaskSchema],
    qualityClearance: {
      isQcPassed: {
        type: Boolean,
        default: false,
        index: true
      },
      inspectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
      },
      inspectedAt: {
        type: Date
      },
      illuminationBurnInTestHours: {
        type: Number,
        default: 4,
        min: 0
      },
      illuminationUniformityVerified: {
        type: Boolean,
        default: false
      },
      insulationResistanceTestMegaOhms: {
        type: Number,
        min: 0
      },
      weatherproofSiliconeSealed: {
        type: Boolean,
        default: false
      },
      acrylicSurfaceFreeOfScratches: {
        type: Boolean,
        default: false
      },
      qcInspectorNotes: {
        type: String,
        trim: true
      },
      evidenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence',
        default: null
      }
    },
    workshopSupervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    scheduledTargetDate: {
      type: Date,
      required: true,
      index: true
    },
    actualCompletedDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

productionRequestSchema.index({ jobOrderId: 1, status: 1 });
productionRequestSchema.index({ jobOrderNumber: 1, status: 1 });
productionRequestSchema.index({ clientOrderId: 1, status: 1 });
productionRequestSchema.index({ status: 1, priority: 1 });
productionRequestSchema.index({
  'machineSelection.machineId': 1,
  'machineSelection.machiningExecution.operationStatus': 1
});
productionRequestSchema.index({
  'finishingTasks.assignedCraftsman': 1,
  'finishingTasks.status': 1
});
productionRequestSchema.index({ 'qualityClearance.isQcPassed': 1, status: 1 });

export default mongoose.models.ProductionRequest ||
  mongoose.model('ProductionRequest', productionRequestSchema);
