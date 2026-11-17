import mongoose from 'mongoose';

const locationReferenceSchema = new mongoose.Schema({
  officeName: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  location: {
    lat: { type: Number, required: true },
    long: { type: Number, required: true }
  },
  radiusMeters: { type: Number, default: 200 }
});

const attendanceConfigSchema = new mongoose.Schema(
  {
    locationReferences: [locationReferenceSchema],
    morningTime: {
      startTime: { type: String, default: '08:30' }, // HH:mm (24hr)
      endTime: { type: String, default: '12:30' }
    },
    afternoonTime: {
      startTime: { type: String, default: '13:30' },
      endTime: { type: String, default: '17:30' }
    },
    isSelfieRequired: {
      type: Boolean,
      default: true
    },
    isLocationRequired: {
      type: Boolean,
      default: true
    },
    autoOvertimeAllow: {
      type: Boolean,
      default: false
    },
    lateAllowedMinutes: {
      type: Number,
      default: 15
    },
    maxAllowedDistanceMeters: {
      type: Number,
      default: 200
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * Singleton helper: Fetch current active configuration or create default
 */
attendanceConfigSchema.statics.getActiveConfig = async function () {
  let config = await this.findOne({ isActive: true }).sort({ createdAt: -1 });
  if (!config) {
    config = await this.create({
      locationReferences: [
        {
          officeName: 'Headquarters - Addis Ababa',
          address: 'Bole Road, Vector Tower, Addis Ababa, Ethiopia',
          location: {
            lat: 9.005401,
            long: 38.784015
          },
          radiusMeters: 250
        }
      ],
      morningTime: { startTime: '08:30', endTime: '12:30' },
      afternoonTime: { startTime: '13:30', endTime: '17:30' },
      isSelfieRequired: true,
      isLocationRequired: true,
      autoOvertimeAllow: false,
      lateAllowedMinutes: 15,
      maxAllowedDistanceMeters: 250,
      isActive: true
    });
  }
  return config;
};

const AttendanceConfig = mongoose.model('AttendanceConfig', attendanceConfigSchema);
export default AttendanceConfig;
