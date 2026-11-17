import OvertimeRequest from '../models/OvertimeRequest.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import { HR_ADMIN_ROLES, MANAGEMENT_ROLES, ROLES } from '../constants/roles.js';

/**
 * @desc    Submit an Overtime Request
 * @route   POST /api/overtime
 * @access  Private (Authenticated Employee)
 */
export const createOvertimeRequest = async (req, res) => {
  try {
    const {
      requestDate,
      startTime,
      endTime,
      totalHours,
      requestReason,
      attendanceId,
      advanceApprovalRequired = true
    } = req.body;

    if (!requestDate || !startTime || !endTime || !totalHours || !requestReason) {
      return res.status(400).json({
        success: false,
        message: 'requestDate, startTime, endTime, totalHours, and requestReason are required'
      });
    }

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    const overtime = await OvertimeRequest.create({
      employee: employee._id,
      attendance: attendanceId || null,
      requestDate: new Date(requestDate),
      startTime,
      endTime,
      totalHours: Number(totalHours),
      requestReason,
      advanceApprovalRequired,
      requestStatus: 'pending'
    });

    const populated = await OvertimeRequest.findById(overtime._id).populate(
      'employee',
      'name employeeNumber jobTitle department'
    );

    return res.status(201).json({
      success: true,
      message: 'Overtime request submitted successfully and is pending review',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get currently logged-in user's overtime requests
 * @route   GET /api/overtime/me
 * @access  Private
 */
export const getMyOvertimeRequests = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { employee: employee._id };
    if (status) query.requestStatus = status;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, requests] = await Promise.all([
      OvertimeRequest.countDocuments(query),
      OvertimeRequest.find(query)
        .sort({ requestDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('approveDecisions.approver', 'email roles')
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: requests
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all overtime requests (Management/HR)
 * @route   GET /api/overtime
 * @access  Private (Management/HR)
 */
export const getAllOvertimeRequests = async (req, res) => {
  try {
    const { status, employeeId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.requestStatus = status;
    if (employeeId) query.employee = employeeId;
    if (startDate || endDate) {
      query.requestDate = {};
      if (startDate) query.requestDate.$gte = new Date(startDate);
      if (endDate) query.requestDate.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, requests] = await Promise.all([
      OvertimeRequest.countDocuments(query),
      OvertimeRequest.find(query)
        .populate('employee', 'name employeeNumber jobTitle department')
        .populate('approveDecisions.approver', 'email roles')
        .sort({ requestDate: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: requests
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single overtime request by ID
 * @route   GET /api/overtime/:id
 * @access  Private
 */
export const getOvertimeRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await OvertimeRequest.findById(id)
      .populate('employee', 'name employeeNumber jobTitle department email')
      .populate('approveDecisions.approver', 'email roles')
      .populate('attendance');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Overtime request not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Make decision on Overtime Request (Approve / Reject)
 * @route   PATCH /api/overtime/:id/decision
 * @access  Private (Management / HR)
 */
export const decideOvertimeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, comments } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be 'approved' or 'rejected'"
      });
    }

    const overtime = await OvertimeRequest.findById(id);
    if (!overtime) {
      return res.status(404).json({
        success: false,
        message: 'Overtime request not found'
      });
    }

    // Determine approver role label
    let approverType = 'Manager';
    if (req.user.roles.includes(ROLES.HR_MANAGER)) {
      approverType = 'HR Manager';
    } else if (req.user.roles.includes(ROLES.HR_OFFICER)) {
      approverType = 'HR Officer';
    } else if (
      req.user.roles.includes(ROLES.SUPER_ADMIN) ||
      req.user.roles.includes(ROLES.CEO) ||
      req.user.roles.includes(ROLES.COO) ||
      req.user.roles.includes(ROLES.CAO)
    ) {
      approverType = 'Executive';
    }

    overtime.approveDecisions.push({
      approverType,
      approver: req.user._id,
      decision,
      comments: comments || '',
      decidedAt: new Date()
    });

    overtime.requestStatus = decision;
    await overtime.save();

    // If approved and linked to attendance record, credit hours to attendance
    if (decision === 'approved') {
      const attendanceQuery = overtime.attendance
        ? { _id: overtime.attendance }
        : {
            employee: overtime.employee,
            attendanceDate: {
              $gte: new Date(new Date(overtime.requestDate).setHours(0, 0, 0, 0)),
              $lte: new Date(new Date(overtime.requestDate).setHours(23, 59, 59, 999))
            }
          };

      const linkedAttendance = await Attendance.findOne(attendanceQuery);
      if (linkedAttendance) {
        linkedAttendance.overtime.hasOvertime = true;
        linkedAttendance.overtime.numberOfHours =
          (linkedAttendance.overtime.numberOfHours || 0) + overtime.totalHours;
        await linkedAttendance.save();
      }
    }

    const populated = await OvertimeRequest.findById(overtime._id)
      .populate('employee', 'name employeeNumber jobTitle department')
      .populate('approveDecisions.approver', 'email roles');

    return res.status(200).json({
      success: true,
      message: `Overtime request has been ${decision}`,
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
