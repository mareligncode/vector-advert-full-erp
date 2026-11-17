import mongoose from 'mongoose';

const checkPointSchema = new mongoose.Schema(
  {
    time: { type: Date },
    selfie: { type: String },
    location: {
      lat: { type: Number },
      long: { type: Number }
    },
    distanceMeters: { type: Number },
    status: {
      type: String,
      enum: ['on_time', 'late', 'normal', 'early_leave'],
      default: 'on_time'
    }
  },
  { _id: false }
);

const shiftCheckSchema = new mongoose.Schema(
  {
    locationRef: { type: String, trim: true },
    checkIn: checkPointSchema,
    checkOut: checkPointSchema
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: false
    },
    attendanceDate: {
      type: Date,
      required: true
    },
    morningCheck: {
      type: shiftCheckSchema,
      default: () => ({})
    },
    afternoonCheck: {
      type: shiftCheckSchema,
      default: () => ({})
    },
    attendanceStatus: {
      type: String,
      enum: ['present', 'half_day', 'absent', 'on_leave', 'field_visit', 'holiday'],
      default: 'present'
    },
    late: {
      isLate: { type: Boolean, default: false },
      minutesLate: { type: Number, default: 0 }
    },
    overtime: {
      hasOvertime: { type: Boolean, default: false },
      numberOfHours: { type: Number, default: 0 }
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

// Unique index per employee per calendar date
attendanceSchema.index({ employee: 1, attendanceDate: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
