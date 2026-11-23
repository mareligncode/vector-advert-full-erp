import mongoose from 'mongoose';

const taxConfigurationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    description: {
      type: String,
      trim: true
    },
    effectiveFrom: {
      type: Date,
      required: true
    },
    effectiveUntil: {
      type: Date
    },
    isDefault: {
      type: Boolean,
      default: false
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

export default mongoose.models.TaxConfiguration ||
  mongoose.model('TaxConfiguration', taxConfigurationSchema);
