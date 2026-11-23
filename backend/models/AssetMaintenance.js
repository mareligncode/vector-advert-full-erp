import mongoose from 'mongoose';

const assetMaintenanceSchema = new mongoose.Schema(
  {
    maintenanceCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetRegister',
      required: true,
      index: true
    },
    maintenanceType: {
      type: String,
      enum: ['preventive', 'corrective', 'emergency', 'inspection'],
      default: 'preventive'
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    maintenanceDate: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    serviceProvider: {
      type: String,
      trim: true
    },
    cost: {
      type: Number,
      default: 0,
      min: 0
    },
    nextMaintenanceDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'completed'
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

export default mongoose.models.AssetMaintenance ||
  mongoose.model('AssetMaintenance', assetMaintenanceSchema);
