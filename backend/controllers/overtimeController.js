import OvertimeRequest from '../models/OvertimeRequest.js';
import OvertimeConfig from '../models/OvertimeConfig.js';
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
      overtimeType = 'normal_day',
      rateMultiplier: customRate,
      requestReason,
      attendanceId,
      employeeId,
      advanceApprovalRequired = true
    } = req.body;

    if (!requestDate || !startTime || !endTime || !totalHours || !requestReason) {
      return res.status(400).json({
        success: false,
        message: 'requestDate, startTime, endTime, totalHours, and requestReason are required'
      });
    }

    let targetEmployee = null;
    if (employeeId && req.user.roles.some((r) => HR_ADMIN_ROLES.includes(r))) {
      targetEmployee = await Employee.findById(employeeId);
    } else {
      targetEmployee = await Employee.findOne({ user: req.user._id });
    }

    if (!targetEmployee) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this request'
      });
    }

    // Resolve rate multiplier from OvertimeConfig if not explicitly provided
    const config = await OvertimeConfig.getActiveConfig();
    let multiplier = customRate ? Number(customRate) : null;
    if (!multiplier) {
      switch (overtimeType) {
        case 'night_shift':
          multiplier = config.nightShiftMultiplier || 1.5;
          break;
        case 'weekend':
          multiplier = config.weekendMultiplier || 2.0;
          break;
        case 'public_holiday':
          multiplier = config.holidayMultiplier || 2.5;
          break;
        case 'normal_day':
        default:
          multiplier = config.dayShiftMultiplier || 1.25;
          break;
      }
    }

    // Calculate hourly basic rate and estimated payout
    const monthlyBasic = targetEmployee.salary?.basic || 0;
    const hourlyRate = monthlyBasic > 0 ? Number((monthlyBasic / (30 * 8)).toFixed(2)) : 0;
    const estimatedPayout = Number((hourlyRate * multiplier * Number(totalHours)).toFixed(2));

    const overtime = await OvertimeRequest.create({
      employee: targetEmployee._id,
      attendance: attendanceId || null,
      requestDate: new Date(requestDate),
      startTime,
      endTime,
      totalHours: Number(totalHours),
      overtimeType,
      rateMultiplier: multiplier,
      hourlyRate,
      estimatedPayout,
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

/**
 * @desc    Cancel an overtime request
 * @route   POST /api/overtime/:id/cancel
 * @access  Private (Requester or HR Admin)
 */
export const cancelOvertimeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const overtime = await OvertimeRequest.findById(id).populate('employee');

    if (!overtime) {
      return res.status(404).json({
        success: false,
        message: 'Overtime request not found'
      });
    }

    const isOwner =
      overtime.employee &&
      overtime.employee.user &&
      overtime.employee.user.toString() === req.user._id.toString();
    const isHR = req.user.roles.some((r) => HR_ADMIN_ROLES.includes(r));

    if (!isOwner && !isHR) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this request'
      });
    }

    if (['approved', 'rejected', 'cancelled'].includes(overtime.requestStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a request that is already ${overtime.requestStatus}`
      });
    }

    overtime.requestStatus = 'cancelled';
    await overtime.save();

    return res.status(200).json({
      success: true,
      message: 'Overtime request cancelled successfully',
      data: overtime
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get active overtime policy configuration
 * @route   GET /api/overtime/config
 * @access  Private
 */
export const getOvertimeConfig = async (req, res) => {
  try {
    const config = await OvertimeConfig.getActiveConfig();
    return res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update overtime policy configuration
 * @route   PUT /api/overtime/config
 * @access  Private (HR/Admin)
 */
export const updateOvertimeConfig = async (req, res) => {
  try {
    const config = await OvertimeConfig.getActiveConfig();

    const updatedConfig = await OvertimeConfig.findByIdAndUpdate(
      config._id,
      {
        $set: {
          ...req.body,
          updatedBy: req.user._id
        }
      },
      { returnDocument: 'after', runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Overtime policy configuration updated successfully',
      data: updatedConfig
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get overtime analytics & stats summary
 * @route   GET /api/overtime/summary/me
 * @access  Private
 */
export const getMyOvertimeSummary = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    const requests = await OvertimeRequest.find({ employee: employee._id });

    let totalApprovedHours = 0;
    let totalPendingHours = 0;
    let totalEstimatedPayout = 0;
    const hoursByType = {
      normal_day: 0,
      night_shift: 0,
      weekend: 0,
      public_holiday: 0
    };

    requests.forEach((r) => {
      const hrs = Number(r.totalHours) || 0;
      const type = r.overtimeType || 'normal_day';

      if (r.requestStatus === 'approved') {
        totalApprovedHours += hrs;
        totalEstimatedPayout += Number(r.estimatedPayout) || 0;
        if (hoursByType[type] !== undefined) {
          hoursByType[type] += hrs;
        }
      } else if (['pending', 'pending_manager', 'pending_hr'].includes(r.requestStatus)) {
        totalPendingHours += hrs;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalApprovedHours,
        totalPendingHours,
        totalEstimatedPayout,
        hoursByType,
        totalRequestsCount: requests.length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
