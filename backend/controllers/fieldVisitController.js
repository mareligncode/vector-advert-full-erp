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
      visitStartTime,
      visitEndTime,
      visitAddress,
      location,
      radiusMeters = 300,
      employees,
      leader,
      visitReportNotes
    } = req.body;

    if (!visitPurpose || !visitDate || !visitStartTime || !visitEndTime || !visitAddress || !location) {
      return res.status(400).json({
        success: false,
        message: 'visitPurpose, visitDate, visitStartTime, visitEndTime, visitAddress, and location (lat/long) are required'
      });
    }

    if (typeof location.lat !== 'number' || typeof location.long !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'location must contain numeric lat and long coordinates'
      });
    }

    const fieldVisit = await FieldVisit.create({
      visitPurpose,
      visitDate: new Date(visitDate),
      visitStartTime,
      visitEndTime,
      visitAddress,
      location,
      radiusMeters,
      employees: employees || [],
      leader: leader || null,
      visitReportNotes,
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

    const updated = await FieldVisit.findByIdAndUpdate(
      id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    )
      .populate('leader', 'name employeeNumber jobTitle')
      .populate('employees', 'name employeeNumber jobTitle');

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

    if (lat === undefined || long === undefined) {
      return res.status(400).json({
        success: false,
        message: 'GPS coordinates (lat and long) are required for field check-in'
      });
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

    // Calculate distance to site
    const distanceMeters = calculateDistanceMeters(
      Number(lat),
      Number(long),
      visit.location.lat,
      visit.location.long
    );

    const allowedRadius = visit.radiusMeters || 300;
    if (distanceMeters > allowedRadius) {
      return res.status(400).json({
        success: false,
        message: `Field check-in failed: You are ${distanceMeters}m away from the visit site, which exceeds the allowed radius of ${allowedRadius}m.`,
        distanceMeters,
        allowedRadius
      });
    }

    const checkInRecord = {
      employee: selfEmployee._id,
      checkInTime: new Date(),
      location: { lat: Number(lat), long: Number(long) },
      distanceMeters,
      selfie: selfie || null,
      notes: notes || null
    };

    visit.checkIns.push(checkInRecord);

    // If visit was scheduled, transition to in_progress
    if (visit.visitStatus === 'scheduled') {
      visit.visitStatus = 'in_progress';
    }

    await visit.save();

    const createdRecord = visit.checkIns[visit.checkIns.length - 1];

    return res.status(200).json({
      success: true,
      message: `On-site field check-in successful (${distanceMeters}m from site target)`,
      distanceMeters,
      visitStatus: visit.visitStatus,
      checkIn: createdRecord
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
