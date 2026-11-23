import mongoose from 'mongoose';

const assetRegisterSchema = new mongoose.Schema(
  {
    assetCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    serialNumber: {
      type: String,
      trim: true
    },
    purchaseDate: {
      type: Date
    },
    purchaseCost: {
      type: Number,
      default: 0,
      min: 0
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse'
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarehouseLocation'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'needs_repair', 'scrapped'],
      default: 'good'
    },
    status: {
      type: String,
      enum: ['in_use', 'maintenance', 'idle', 'disposed'],
      default: 'in_use'
    },
    warrantyExpiry: {
      type: Date
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

export default mongoose.models.AssetRegister ||
  mongoose.model('AssetRegister', assetRegisterSchema);
