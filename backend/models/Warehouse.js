import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    code: {
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
    warehouseType: {
      type: String,
      enum: ['central', 'workshop', 'office', 'transit'],
      default: 'central'
    },
    address: {
      type: String,
      trim: true
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
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

export default mongoose.models.Warehouse || mongoose.model('Warehouse', warehouseSchema);
