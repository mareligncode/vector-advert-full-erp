import dotenv from 'dotenv';
import mongoose from 'mongoose';
import AttendanceConfig from '../models/AttendanceConfig.js';

dotenv.config();

const updateConfig = async () => {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp';
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB.');

    let config = await AttendanceConfig.getActiveConfig();

    // Option: Disable GPS requirement or expand allowed radius
    config.isLocationRequired = false; // Set to false to allow punch from anywhere
    config.maxAllowedDistanceMeters = 20000; // 20km

    if (config.locationReferences && config.locationReferences.length > 0) {
      config.locationReferences.forEach((loc) => {
        loc.radiusMeters = 20000;
      });
    }

    await config.save();
    console.log('✅ Attendance Geofence successfully updated: isLocationRequired = false, radius = 20,000m');
    process.exit(0);
  } catch (error) {
    console.error('Error updating config:', error);
    process.exit(1);
  }
};

updateConfig();
