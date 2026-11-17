import mongoose from 'mongoose';

const fieldCheckInSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    checkInTime: {
      type: Date,
      default: Date.now
    },
    location: {
      lat: { type: Number, required: true },
      long: { type: Number, required: true }
    },
    distanceMeters: {
      type: Number
    },
    selfie: {
      type: String
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

const fieldVisitSchema = new mongoose.Schema(
  {
    visitPurpose: {
      type: String,
      required: true,
      trim: true
    },
    visitDate: {
      type: Date,
      required: true
    },
    visitStartTime: {
      type: String,
      required: true
    },
    visitEndTime: {
      type: String,
      required: true
    },
    visitAddress: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      lat: {
        type: Number,
        required: true
      },
      long: {
        type: Number,
        required: true
      }
    },
    radiusMeters: {
      type: Number,
      default: 300
    },
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    ],
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    visitReportNotes: {
      type: String,
      trim: true
    },
    visitStatus: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    checkIns: [fieldCheckInSchema]
  },
  {
    timestamps: true
  }
);

const FieldVisit = mongoose.model('FieldVisit', fieldVisitSchema);
export default FieldVisit;
