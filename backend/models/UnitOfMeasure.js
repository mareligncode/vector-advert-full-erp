import mongoose from 'mongoose';
import { UNIT_ENUM } from '../constants/inventoryEnums.js';

const unitOfMeasureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: UNIT_ENUM
    },
    symbol: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
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

export default mongoose.models.UnitOfMeasure || mongoose.model('UnitOfMeasure', unitOfMeasureSchema);
