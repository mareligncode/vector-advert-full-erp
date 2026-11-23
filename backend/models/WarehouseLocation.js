import mongoose from 'mongoose';

const warehouseLocationSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    locationType: {
      type: String,
      enum: ['aisle', 'rack', 'shelf', 'bin', 'floor_area'],
      default: 'shelf'
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

warehouseLocationSchema.index({ warehouseId: 1, code: 1 }, { unique: true });

export default mongoose.models.WarehouseLocation || mongoose.model('WarehouseLocation', warehouseLocationSchema);
