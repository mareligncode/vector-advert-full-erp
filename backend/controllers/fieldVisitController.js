import FieldVisit from '../models/FieldVisit.js';
import Employee from '../models/Employee.js';
import { calculateDistanceMeters } from '../utils/geoUtils.js';
import { MANAGEMENT_ROLES, HR_ADMIN_ROLES } from '../constants/roles.js';
import { formatFileUrl } from '../utils/fileUtils.js';

/**
 * Helper to check role
 */
const isPrivileged = (user) => {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((r) => MANAGEMENT_ROLES.includes(r));
};

/**
 * @desc    Create a new field visit assignment
 * @route   POST /api/field-visits
 * @access  Private (Management/HR)
 */
export const createFieldVisit = async (req, res) => {
  try {
    const {
      visitPurpose,
      visitDate,
      returnDate,
      visitStartTime,
      visitEndTime,
      visitAddress,
      location,
      radiusMeters = 300,
      employees,
      leader,
      visitReportNotes
    } = req.body;

    if (!visitPurpose || !visitDate || !visitStartTime || !visitEndTime || !visitAddress) {
      return res.status(400).json({
        success: false,
        message: 'visitPurpose, visitDate, visitStartTime, visitEndTime, and visitAddress are required'
      });
    }

    let parsedLocation = { lat: null, long: null };
    if (location && typeof location.lat === 'number' && typeof location.long === 'number') {
      parsedLocation = { lat: location.lat, long: location.long };
    }

    const fieldVisit = await FieldVisit.create({
      visitPurpose,
      visitDate: new Date(visitDate),
      returnDate: returnDate ? new Date(returnDate) : null,
      visitStartTime,
      visitEndTime,
      visitAddress,
      location: parsedLocation,
      radiusMeters: Number(radiusMeters) || 300,
      employees: employees || [],
      leader: leader || null,
      visitReportNotes: visitReportNotes || '',
      visitStatus: 'scheduled'
    });

    const populated = await FieldVisit.findById(fieldVisit._id)
      .populate('leader', 'name employeeNumber jobTitle primaryPhone')
      .populate('employees', 'name employeeNumber jobTitle primaryPhone');

    return res.status(201).json({
      success: true,
      message: 'Field visit scheduled successfully',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all field visits with filters and pagination
 * @route   GET /api/field-visits
 * @access  Private (Authenticated)
 */
export const getFieldVisits = async (req, res) => {
  try {
    const { status, date, leaderId, employeeId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.visitStatus = status;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      query.visitDate = { $gte: d, $lt: nextDay };
    }
    if (leaderId) query.leader = leaderId;
    if (employeeId) query.employees = employeeId;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, visits] = await Promise.all([
      FieldVisit.countDocuments(query),
      FieldVisit.find(query)
        .populate('leader', 'name employeeNumber jobTitle primaryPhone')
        .populate('employees', 'name employeeNumber jobTitle')
        .populate('checkIns.employee', 'name employeeNumber jobTitle')
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: visits
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get field visits for the logged-in employee (as leader or participant)
 * @route   GET /api/field-visits/me
 * @access  Private
 */
export const getMyFieldVisits = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = {
      $or: [{ leader: employee._id }, { employees: employee._id }]
    };
    if (status) query.visitStatus = status;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, visits] = await Promise.all([
      FieldVisit.countDocuments(query),
      FieldVisit.find(query)
        .populate('leader', 'name employeeNumber jobTitle primaryPhone')
        .populate('employees', 'name employeeNumber jobTitle')
        .populate('checkIns.employee', 'name employeeNumber jobTitle')
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: visits
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single field visit details
 * @route   GET /api/field-visits/:id
 * @access  Private
 */
export const getFieldVisitById = async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await FieldVisit.findById(id)
      .populate('leader', 'name employeeNumber jobTitle primaryPhone email')
      .populate('employees', 'name employeeNumber jobTitle primaryPhone email')
      .populate('checkIns.employee', 'name employeeNumber jobTitle');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Field visit not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: visit
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update field visit details / report notes / status
 * @route   PATCH /api/field-visits/:id
 * @access  Private (Management or Assigned Leader)
 */
export const updateFieldVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await FieldVisit.findById(id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Field visit not found'
      });
    }

    // Authorization: Management/HR or the assigned team leader
    const selfEmployee = await Employee.findOne({ user: req.user._id });
    const isLeader =
      selfEmployee && visit.leader && visit.leader.toString() === selfEmployee._id.toString();

    if (!isPrivileged(req.user) && !isLeader) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this field visit'
      });
    }

    const updateData = { ...req.body };
    if (updateData.visitDate) {
      updateData.visitDate = new Date(updateData.visitDate);
    }
    if (updateData.returnDate !== undefined) {
      updateData.returnDate = updateData.returnDate ? new Date(updateData.returnDate) : null;
    }
    if (updateData.location !== undefined) {
      if (
        updateData.location &&
        typeof updateData.location.lat === 'number' &&
        typeof updateData.location.long === 'number'
      ) {
        updateData.location = { lat: updateData.location.lat, long: updateData.location.long };
      } else {
        updateData.location = { lat: null, long: null };
      }
    }

    const updated = await FieldVisit.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    )
      .populate('leader', 'name employeeNumber jobTitle primaryPhone')
      .populate('employees', 'name employeeNumber jobTitle primaryPhone');

    return res.status(200).json({
      success: true,
      message: 'Field visit updated successfully',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Check-in on-site at a field visit location
 * @route   POST /api/field-visits/:id/check-in
 * @access  Private (Participant/Leader)
 */
export const checkInFieldVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, long, notes } = req.body;
    let selfie = req.body.selfie;
    if (req.file) {
      const category = req.uploadCategory || 'field-visits';
      selfie = formatFileUrl(category, req.file.filename);
    }

    const visit = await FieldVisit.findById(id);
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Field visit not found'
      });
    }

    const selfEmployee = await Employee.findOne({ user: req.user._id });
    if (!selfEmployee) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    // Verify employee is assigned to this visit
    const isParticipant =
      (visit.leader && visit.leader.toString() === selfEmployee._id.toString()) ||
      visit.employees.some((e) => e.toString() === selfEmployee._id.toString());

    if (!isParticipant && !isPrivileged(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this field visit'
      });
    }

    let parsedLat = null;
    let parsedLong = null;
    let distanceMeters = null;

    const hasCheckInCoords =
      lat !== undefined &&
      lat !== null &&
      lat !== '' &&
      long !== undefined &&
      long !== null &&
      long !== '' &&
      !isNaN(Number(lat)) &&
      !isNaN(Number(long));

    if (hasCheckInCoords) {
      parsedLat = Number(lat);
      parsedLong = Number(long);

      // If visit has target coordinates, calculate distance
      if (
        visit.location &&
        typeof visit.location.lat === 'number' &&
        typeof visit.location.long === 'number'
      ) {
        distanceMeters = calculateDistanceMeters(
          parsedLat,
          parsedLong,
          visit.location.lat,
          visit.location.long
        );
      }
    }

    const checkInRecord = {
      employee: selfEmployee._id,
      checkInTime: new Date(),
      location: { lat: parsedLat, long: parsedLong },
      distanceMeters,
      selfie: selfie || null,
      notes: notes ? String(notes).trim() : null
    };

    visit.checkIns.push(checkInRecord);

    // If visit was scheduled, transition to in_progress
    if (visit.visitStatus === 'scheduled') {
      visit.visitStatus = 'in_progress';
    }

    await visit.save();

    const fullyPopulated = await FieldVisit.findById(visit._id)
      .populate('leader', 'name employeeNumber jobTitle primaryPhone')
      .populate('employees', 'name employeeNumber jobTitle primaryPhone')
      .populate('checkIns.employee', 'name employeeNumber jobTitle');

    const createdRecord = fullyPopulated.checkIns[fullyPopulated.checkIns.length - 1];

    const message = distanceMeters !== null
      ? `On-site field check-in successful (${distanceMeters}m from site target)`
      : 'Field check-in recorded successfully';

    return res.status(200).json({
      success: true,
      message,
      distanceMeters,
      visitStatus: fullyPopulated.visitStatus,
      checkIn: createdRecord,
      data: fullyPopulated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a field visit assignment
 * @route   DELETE /api/field-visits/:id
 * @access  Private (Management/HR)
 */
export const deleteFieldVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await FieldVisit.findByIdAndDelete(id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Field visit not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Field visit assignment deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get field visit summary and statistics
 * @route   GET /api/field-visits/summary/me
 * @access  Private
 */
export const getMyFieldVisitSummary = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    const query = {
      $or: [{ leader: employee._id }, { employees: employee._id }]
    };

    const myVisits = await FieldVisit.find(query);

    let scheduledCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let myCheckInsCount = 0;

    myVisits.forEach((v) => {
      if (v.visitStatus === 'scheduled') scheduledCount++;
      else if (v.visitStatus === 'in_progress') inProgressCount++;
      else if (v.visitStatus === 'completed') completedCount++;
      else if (v.visitStatus === 'cancelled') cancelledCount++;

      const checkedIn = v.checkIns?.some(
        (c) => c.employee?.toString() === employee._id.toString()
      );
      if (checkedIn) myCheckInsCount++;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalAssigned: myVisits.length,
        scheduledCount,
        inProgressCount,
        completedCount,
        cancelledCount,
        myCheckInsCount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
