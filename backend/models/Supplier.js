import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
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
      trim: true,
      index: true
    },
    contactPerson: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      country: { type: String, trim: true }
    },
    tin: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    bankAccountName: {
      type: String,
      trim: true
    },
    bankAccountNumber: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0
    },
    totalValue: {
      type: Number,
      default: 0,
      min: 0
    },
    onTimeDeliveryRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    qualityScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blacklisted'],
      default: 'active',
      index: true
    },
    specialties: [
      {
        type: String,
        trim: true
      }
    ],
    paymentTerms: {
      type: String,
      trim: true
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

export default mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);
