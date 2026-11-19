import OvertimeRequest from '../models/OvertimeRequest.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import { HR_ADMIN_ROLES, MANAGEMENT_ROLES, EXECUTIVE_ROLES, ROLES } from '../constants/roles.js';
import { canApproveAsManager, canApproveAsHR } from '../utils/approvalUtils.js';

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
      requestStatus: 'pending_manager',
      managerApproval: { status: 'pending' },
      hrApproval: { status: 'pending' }
    });

    const populated = await OvertimeRequest.findById(overtime._id)
      .populate('employee', 'name employeeNumber jobTitle department')
      .populate('managerApproval.approvedBy', 'email roles')
      .populate('hrApproval.approvedBy', 'email roles');

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
    if (status) {
      if (status === 'pending') {
        query.requestStatus = { $in: ['pending', 'pending_manager', 'pending_hr'] };
      } else {
        query.requestStatus = status;
      }
    }

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
        .populate('managerApproval.approvedBy', 'email roles')
        .populate('hrApproval.approvedBy', 'email roles')
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

    if (status) {
      if (status === 'pending') {
        query.requestStatus = { $in: ['pending', 'pending_manager', 'pending_hr'] };
      } else {
        query.requestStatus = status;
      }
    }
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
        .populate('managerApproval.approvedBy', 'email roles')
        .populate('hrApproval.approvedBy', 'email roles')
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
      .populate('managerApproval.approvedBy', 'email roles')
      .populate('hrApproval.approvedBy', 'email roles')
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
 * @desc    Make decision on Overtime Request with sequential double approval (Manager -> HR Officer)
 * @route   PATCH /api/overtime/:id/decision
 * @access  Private (Management / HR)
 */
export const decideOvertimeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, comments, stage, bypassDoubleApproval } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be 'approved' or 'rejected'"
      });
    }

    const overtime = await OvertimeRequest.findById(id).populate('employee');
    if (!overtime) {
      return res.status(404).json({
        success: false,
        message: 'Overtime request not found'
      });
    }

    if (['approved', 'rejected', 'cancelled'].includes(overtime.requestStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot review request that is already ${overtime.requestStatus}`
      });
    }

    // Optional executive bypass if explicitly requested
    const isExecutive = req.user.roles.some((r) => EXECUTIVE_ROLES.includes(r));
    if (bypassDoubleApproval && isExecutive) {
      overtime.managerApproval = {
        status: decision,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments: comments || 'Executive override approval'
      };
      overtime.hrApproval = {
        status: decision,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments: comments || 'Executive override approval'
      };
      overtime.requestStatus = decision;

      overtime.approveDecisions.push({
        approverType: 'Executive',
        approver: req.user._id,
        decision,
        comments: comments || 'Executive override',
        decidedAt: new Date()
      });

      if (decision === 'approved') {
        const attendanceQuery = overtime.attendance
          ? { _id: overtime.attendance }
          : {
              employee: overtime.employee._id || overtime.employee,
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

      await overtime.save();

      const populated = await OvertimeRequest.findById(overtime._id)
        .populate('employee', 'name employeeNumber jobTitle department')
        .populate('approveDecisions.approver', 'email roles')
        .populate('managerApproval.approvedBy', 'email roles')
        .populate('hrApproval.approvedBy', 'email roles');

      return res.status(200).json({
        success: true,
        message: `Overtime request has been ${decision} via executive decision`,
        data: populated
      });
    }

    // Determine current approval stage
    const isAtManagerStage =
      overtime.requestStatus === 'pending_manager' ||
      (overtime.requestStatus === 'pending' && overtime.managerApproval?.status !== 'approved');

    // Stage 1: Direct Manager Review
    if (stage === 'manager' || (!stage && isAtManagerStage)) {
      const check = await canApproveAsManager(req.user, overtime.employee);
      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          message: check.message || 'You are not authorized to approve the manager stage'
        });
      }

      overtime.managerApproval = {
        status: decision,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments: comments || ''
      };

      if (decision === 'rejected') {
        overtime.requestStatus = 'rejected';
      } else {
        overtime.requestStatus = 'pending_hr';
      }

      overtime.approveDecisions.push({
        approverType: 'Manager',
        approver: req.user._id,
        decision,
        comments: comments || '',
        decidedAt: new Date()
      });

      await overtime.save();

      const populated = await OvertimeRequest.findById(overtime._id)
        .populate('employee', 'name employeeNumber jobTitle department')
        .populate('approveDecisions.approver', 'email roles')
        .populate('managerApproval.approvedBy', 'email roles')
        .populate('hrApproval.approvedBy', 'email roles');

      const message =
        decision === 'approved'
          ? 'Manager approval granted. Overtime request is now pending HR approval.'
          : 'Overtime request has been rejected by the manager.';

      return res.status(200).json({
        success: true,
        message,
        data: populated
      });
    }

    // Stage 2: HR Officer Review
    const isAtHRStage =
      overtime.requestStatus === 'pending_hr' ||
      (overtime.managerApproval?.status === 'approved' && overtime.hrApproval?.status === 'pending');

    if (stage === 'hr' || (!stage && isAtHRStage)) {
      if (overtime.managerApproval?.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Direct manager approval must be granted before HR review'
        });
      }

      const check = canApproveAsHR(req.user, overtime.employee);
      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          message: check.message || 'Only an HR Officer, HR Manager, or Executive can approve the HR stage'
        });
      }

      overtime.hrApproval = {
        status: decision,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments: comments || ''
      };

      if (decision === 'rejected') {
        overtime.requestStatus = 'rejected';
      } else {
        overtime.requestStatus = 'approved';

        // Credit hours to attendance upon final HR approval
        const attendanceQuery = overtime.attendance
          ? { _id: overtime.attendance }
          : {
              employee: overtime.employee._id || overtime.employee,
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

      overtime.approveDecisions.push({
        approverType: check.roleTitle || 'HR Officer',
        approver: req.user._id,
        decision,
        comments: comments || '',
        decidedAt: new Date()
      });

      await overtime.save();

      const populated = await OvertimeRequest.findById(overtime._id)
        .populate('employee', 'name employeeNumber jobTitle department')
        .populate('approveDecisions.approver', 'email roles')
        .populate('managerApproval.approvedBy', 'email roles')
        .populate('hrApproval.approvedBy', 'email roles');

      const message =
        decision === 'approved'
          ? 'Overtime request fully approved by HR and credited.'
          : 'Overtime request has been rejected by HR.';

      return res.status(200).json({
        success: true,
        message,
        data: populated
      });
    }

    return res.status(400).json({
      success: false,
      message: `Invalid review stage or request state (current status: ${overtime.requestStatus})`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
