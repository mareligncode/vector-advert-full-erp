import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import AttendanceConfig from '../models/AttendanceConfig.js';
import Employee from '../models/Employee.js';
import { checkOfficeProximity } from '../utils/geoUtils.js';
import { HR_ADMIN_ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';
import { formatFileUrl } from '../utils/fileUtils.js';

/**
 * Helper to get normalized midnight Date
 */
const getDayStart = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Helper to parse "HH:mm" to total minutes from midnight
 */
const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

/**
 * Helper to check if requester has HR or Management role
 */
const isPrivileged = (user, allowedRoles = MANAGEMENT_ROLES) => {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((r) => allowedRoles.includes(r));
};

/**
 * @desc    Get active attendance configuration
 * @route   GET /api/attendance/config
 * @access  Private
 */
export const getAttendanceConfig = async (req, res) => {
  try {
    const config = await AttendanceConfig.getActiveConfig();
    return res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update attendance configuration
 * @route   PUT /api/attendance/config
 * @access  Private (HR/Admin)
 */
export const updateAttendanceConfig = async (req, res) => {
  try {
    let config = await AttendanceConfig.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!config) {
      config = await AttendanceConfig.getActiveConfig();
    }

    const updatedConfig = await AttendanceConfig.findByIdAndUpdate(
      config._id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Attendance configuration updated successfully',
      data: updatedConfig
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Record employee check-in (Morning or Afternoon) with GPS & Selfie
 * @route   POST /api/attendance/check-in
 * @access  Private
 */
export const checkIn = async (req, res) => {
  try {
    const { lat, long, shift, employeeId, notes } = req.body;
    let selfie = req.body.selfie;
    if (req.file) {
      const category = req.uploadCategory || 'attendance';
      selfie = formatFileUrl(category, req.file.filename);
    }

    // Resolve target employee
    let targetEmployeeId = null;
    if (employeeId && isPrivileged(req.user, HR_ADMIN_ROLES)) {
      targetEmployeeId = employeeId;
    } else {
      const selfEmployee = await Employee.findOne({ user: req.user._id });
      if (!selfEmployee) {
        return res.status(400).json({
          success: false,
          message: 'No employee profile linked to your user account'
        });
      }
      targetEmployeeId = selfEmployee._id;
    }

    const config = await AttendanceConfig.getActiveConfig();

    // 1. Validate Selfie
    if (config.isSelfieRequired && (!selfie || typeof selfie !== 'string' || selfie.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Selfie verification image is required for check-in'
      });
    }

    // 2. Validate Geolocation
    let proximity = { isAllowed: true, nearestOffice: null, distanceMeters: null };
    if (config.isLocationRequired) {
      if (lat === undefined || long === undefined) {
        return res.status(400).json({
          success: false,
          message: 'GPS coordinates (lat and long) are required for check-in'
        });
      }

      proximity = checkOfficeProximity(
        Number(lat),
        Number(long),
        config.locationReferences,
        config.maxAllowedDistanceMeters
      );

      if (!proximity.isAllowed) {
        return res.status(400).json({
          success: false,
          message: `Location verification failed: You are ${proximity.distanceMeters}m away from the nearest office (${proximity.nearestOffice?.officeName || 'Office'}), exceeding the allowed ${proximity.allowedRadius}m radius.`,
          distanceMeters: proximity.distanceMeters,
          allowedRadius: proximity.allowedRadius
        });
      }
    }

    // 3. Determine Shift
    const now = new Date();
    const currentHour = now.getHours();
    const targetShift = shift || (currentHour < 13 ? 'morning' : 'afternoon');

    if (!['morning', 'afternoon'].includes(targetShift)) {
      return res.status(400).json({
        success: false,
        message: "Shift must be 'morning' or 'afternoon'"
      });
    }

    const todayDate = getDayStart(now);

    // 4. Find or Create Attendance document
    let attendance = await Attendance.findOne({
      employee: targetEmployeeId,
      attendanceDate: todayDate
    });

    if (!attendance) {
      attendance = new Attendance({
        employee: targetEmployeeId,
        attendanceDate: todayDate,
        attendanceStatus: 'half_day'
      });
    }

    const shiftProperty = targetShift === 'morning' ? 'morningCheck' : 'afternoonCheck';
    const shiftConfig = targetShift === 'morning' ? config.morningTime : config.afternoonTime;

    if (attendance[shiftProperty]?.checkIn?.time) {
      return res.status(400).json({
        success: false,
        message: `You have already checked in for the ${targetShift} shift today at ${new Date(
          attendance[shiftProperty].checkIn.time
        ).toLocaleTimeString()}`
      });
    }

    // 5. Calculate Lateness
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const shiftStartMinutes = timeStringToMinutes(shiftConfig.startTime);
    const gracePeriod = config.lateAllowedMinutes || 0;

    let checkInStatus = 'on_time';
    let minutesLate = 0;

    if (currentMinutes > shiftStartMinutes + gracePeriod) {
      checkInStatus = 'late';
      minutesLate = currentMinutes - shiftStartMinutes;
      attendance.late.isLate = true;
      attendance.late.minutesLate = (attendance.late.minutesLate || 0) + minutesLate;
    }

    // 6. Record Check-In
    attendance[shiftProperty] = {
      ...attendance[shiftProperty],
      locationRef: proximity.nearestOffice?.officeName || 'Designated Office',
      checkIn: {
        time: now,
        selfie: selfie || null,
        location: { lat: Number(lat), long: Number(long) },
        distanceMeters: proximity.distanceMeters,
        status: checkInStatus
      }
    };

    if (notes) {
      attendance.notes = attendance.notes ? `${attendance.notes}; ${notes}` : notes;
    }

    await attendance.save();

    const populated = await Attendance.findById(attendance._id).populate(
      'employee',
      'name employeeNumber jobTitle department'
    );

    return res.status(200).json({
      success: true,
      message: `Checked in successfully for ${targetShift} shift (${checkInStatus === 'late' ? `Late by ${minutesLate} mins` : 'On time'})`,
      shift: targetShift,
      checkInStatus,
      minutesLate,
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Record employee check-out (Morning or Afternoon) with GPS & Selfie
 * @route   POST /api/attendance/check-out
 * @access  Private
 */
export const checkOut = async (req, res) => {
  try {
    const { lat, long, shift, employeeId, notes } = req.body;
    let selfie = req.body.selfie;
    if (req.file) {
      const category = req.uploadCategory || 'attendance';
      selfie = formatFileUrl(category, req.file.filename);
    }

    // Resolve target employee
    let targetEmployeeId = null;
    if (employeeId && isPrivileged(req.user, HR_ADMIN_ROLES)) {
      targetEmployeeId = employeeId;
    } else {
      const selfEmployee = await Employee.findOne({ user: req.user._id });
      if (!selfEmployee) {
        return res.status(400).json({
          success: false,
          message: 'No employee profile linked to your user account'
        });
      }
      targetEmployeeId = selfEmployee._id;
    }

    const config = await AttendanceConfig.getActiveConfig();

    // 1. Validate Selfie
    if (config.isSelfieRequired && (!selfie || typeof selfie !== 'string' || selfie.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Selfie verification image is required for check-out'
      });
    }

    // 2. Validate Geolocation
    let proximity = { isAllowed: true, nearestOffice: null, distanceMeters: null };
    if (config.isLocationRequired) {
      if (lat === undefined || long === undefined) {
        return res.status(400).json({
          success: false,
          message: 'GPS coordinates (lat and long) are required for check-out'
        });
      }

      proximity = checkOfficeProximity(
        Number(lat),
        Number(long),
        config.locationReferences,
        config.maxAllowedDistanceMeters
      );

      if (!proximity.isAllowed) {
        return res.status(400).json({
          success: false,
          message: `Location verification failed: You are ${proximity.distanceMeters}m away from the nearest office, exceeding the allowed ${proximity.allowedRadius}m radius.`,
          distanceMeters: proximity.distanceMeters,
          allowedRadius: proximity.allowedRadius
        });
      }
    }

    // 3. Determine Shift
    const now = new Date();
    const currentHour = now.getHours();
    const todayDate = getDayStart(now);

    const attendance = await Attendance.findOne({
      employee: targetEmployeeId,
      attendanceDate: todayDate
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No attendance record found for today. You must check in first before checking out.'
      });
    }

    // Determine target shift for check-out intelligently:
    // If shift is specified, prioritize it unless it's afternoon without afternoon check-in but with open morning check-in.
    let targetShift = shift;
    if (!targetShift) {
      if (attendance.afternoonCheck?.checkIn?.time && !attendance.afternoonCheck?.checkOut?.time) {
        targetShift = 'afternoon';
      } else if (attendance.morningCheck?.checkIn?.time && !attendance.morningCheck?.checkOut?.time) {
        targetShift = 'morning';
      } else {
        targetShift = currentHour < 13 ? 'morning' : 'afternoon';
      }
    } else if (
      targetShift === 'afternoon' &&
      !attendance.afternoonCheck?.checkIn?.time &&
      attendance.morningCheck?.checkIn?.time &&
      !attendance.morningCheck?.checkOut?.time
    ) {
      // Employee checked in in the morning and is now checking out during afternoon hours
      targetShift = 'morning';
    }

    const shiftProperty = targetShift === 'morning' ? 'morningCheck' : 'afternoonCheck';
    const shiftConfig = targetShift === 'morning' ? config.morningTime : config.afternoonTime;

    if (!attendance[shiftProperty]?.checkIn?.time) {
      return res.status(400).json({
        success: false,
        message: `No check-in found for the ${targetShift} shift. Check-in is required prior to check-out.`
      });
    }

    if (attendance[shiftProperty]?.checkOut?.time) {
      return res.status(400).json({
        success: false,
        message: `You have already checked out for the ${targetShift} shift today at ${new Date(
          attendance[shiftProperty].checkOut.time
        ).toLocaleTimeString()}`
      });
    }

    // 4. Calculate Early Leave / Overtime
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const shiftEndMinutes = timeStringToMinutes(shiftConfig.endTime);
    const earlyLeaveBuffer = config.earlyLeaveAllowedMinutes ?? 15;

    let checkOutStatus = 'normal';
    if (currentMinutes < shiftEndMinutes - earlyLeaveBuffer) {
      checkOutStatus = 'early_leave';
    }

    // Automatic Overtime Calculation for afternoon shift
    if (config.autoOvertimeAllow && (targetShift === 'afternoon' || currentHour >= 17)) {
      const overtimeMinutes = currentMinutes - shiftEndMinutes;
      if (overtimeMinutes >= 30) {
        const extraHours = Math.round((overtimeMinutes / 60) * 10) / 10;
        attendance.overtime.hasOvertime = true;
        attendance.overtime.numberOfHours = (attendance.overtime.numberOfHours || 0) + extraHours;
      }
    }

    // 5. Record Check-Out
    attendance[shiftProperty].checkOut = {
      time: now,
      selfie: selfie || null,
      location: { lat: Number(lat), long: Number(long) },
      distanceMeters: proximity.distanceMeters,
      status: checkOutStatus
    };

    // Update Overall Attendance Status
    const morningDone = Boolean(attendance.morningCheck?.checkIn?.time && attendance.morningCheck?.checkOut?.time);
    const afternoonDone = Boolean(attendance.afternoonCheck?.checkIn?.time && attendance.afternoonCheck?.checkOut?.time);

    if (morningDone && afternoonDone) {
      attendance.attendanceStatus = 'present';
    } else if (morningDone && !attendance.afternoonCheck?.checkIn?.time && currentHour >= 16) {
      attendance.attendanceStatus = 'present';
    } else {
      attendance.attendanceStatus = 'half_day';
    }

    if (notes) {
      attendance.notes = attendance.notes ? `${attendance.notes}; ${notes}` : notes;
    }

    await attendance.save();

    const populated = await Attendance.findById(attendance._id).populate(
      'employee',
      'name employeeNumber jobTitle department'
    );

    return res.status(200).json({
      success: true,
      message: `Checked out successfully from ${targetShift} shift (${checkOutStatus})`,
      shift: targetShift,
      checkOutStatus,
      overtime: attendance.overtime,
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get today's attendance record for the logged-in employee
 * @route   GET /api/attendance/today
 * @access  Private
 */
export const getTodayAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    const todayDate = getDayStart();
    const attendance = await Attendance.findOne({
      employee: employee._id,
      attendanceDate: todayDate
    }).populate('employee', 'name employeeNumber jobTitle department');

    return res.status(200).json({
      success: true,
      data: attendance || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get attendance history for logged-in employee
 * @route   GET /api/attendance/me
 * @access  Private
 */
export const getMyAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = { employee: employee._id };

    if (startDate || endDate) {
      query.attendanceDate = {};
      if (startDate) query.attendanceDate.$gte = getDayStart(startDate);
      if (endDate) query.attendanceDate.$lte = getDayStart(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, records] = await Promise.all([
      Attendance.countDocuments(query),
      Attendance.find(query)
        .sort({ attendanceDate: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      total,
      count: records.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: records
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all attendance records (HR/Management)
 * @route   GET /api/attendance
 * @access  Private (Management/HR)
 */
export const getAllAttendance = async (req, res) => {
  try {
    const {
      date,
      startDate,
      endDate,
      employeeId,
      department,
      status,
      isLate,
      hasOvertime,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (date) {
      query.attendanceDate = getDayStart(date);
    } else if (startDate || endDate) {
      query.attendanceDate = {};
      if (startDate) query.attendanceDate.$gte = getDayStart(startDate);
      if (endDate) query.attendanceDate.$lte = getDayStart(endDate);
    }

    if (employeeId) {
      query.employee = employeeId;
    }

    if (status) {
      query.attendanceStatus = status;
    }

    if (isLate === 'true') {
      query['late.isLate'] = true;
    }

    if (hasOvertime === 'true') {
      query['overtime.hasOvertime'] = true;
    }

    // Filter by department if requested
    if (department) {
      const matchingEmployees = await Employee.find({
        department: new RegExp(department, 'i')
      }).select('_id');
      query.employee = { $in: matchingEmployees.map((e) => e._id) };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, records] = await Promise.all([
      Attendance.countDocuments(query),
      Attendance.find(query)
        .populate('employee', 'name employeeNumber jobTitle department')
        .sort({ attendanceDate: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      total,
      count: records.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: records
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get monthly or periodic attendance summary
 * @route   GET /api/attendance/summary
 * @access  Private
 */
export const getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    let targetEmployeeId = null;
    if (employeeId && isPrivileged(req.user)) {
      targetEmployeeId = new mongoose.Types.ObjectId(employeeId);
    } else {
      const selfEmp = await Employee.findOne({ user: req.user._id });
      if (!selfEmp) {
        return res.status(404).json({
          success: false,
          message: 'No linked employee profile found'
        });
      }
      targetEmployeeId = selfEmp._id;
    }

    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month, 10) - 1 : new Date().getMonth();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const records = await Attendance.find({
      employee: targetEmployeeId,
      attendanceDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const summary = {
      period: { year: currentYear, month: currentMonth + 1 },
      totalLoggedDays: records.length,
      presentDays: records.filter((r) => r.attendanceStatus === 'present').length,
      halfDays: records.filter((r) => r.attendanceStatus === 'half_day').length,
      totalLateDays: records.filter((r) => r.late?.isLate).length,
      totalMinutesLate: records.reduce((acc, r) => acc + (r.late?.minutesLate || 0), 0),
      overtimeDays: records.filter((r) => r.overtime?.hasOvertime).length,
      totalOvertimeHours: records.reduce((acc, r) => acc + (r.overtime?.numberOfHours || 0), 0)
    };

    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Manually adjust attendance record
 * @route   PUT /api/attendance/:id
 * @access  Private (HR/Admin)
 */
export const manualAttendanceUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const updated = await Attendance.findByIdAndUpdate(
      id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    ).populate('employee', 'name employeeNumber jobTitle department');

    return res.status(200).json({
      success: true,
      message: 'Attendance record adjusted successfully',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
