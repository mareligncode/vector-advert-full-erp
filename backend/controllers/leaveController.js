import mongoose from 'mongoose';
import LeaveBalance from '../models/LeaveBalance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Employee from '../models/Employee.js';
import { HR_ADMIN_ROLES, MANAGEMENT_ROLES, EXECUTIVE_ROLES } from '../constants/roles.js';
import { canApproveAsManager, canApproveAsHR } from '../utils/approvalUtils.js';

/**
 * Helper to check role privileges
 */
const isPrivileged = (user, allowedRoles = MANAGEMENT_ROLES) => {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((r) => allowedRoles.includes(r));
};

// ==========================================
// LEAVE BALANCES
// ==========================================

/**
 * @desc    Get currently logged-in employee's leave balance
 * @route   GET /api/leave/balances/me
 * @access  Private
 */
export const getMyLeaveBalance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
    const balance = await LeaveBalance.getOrCreateForEmployee(employee._id, year);

    return res.status(200).json({
      success: true,
      data: balance
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all employee leave balances (Management/HR)
 * @route   GET /api/leave/balances
 * @access  Private (Management/HR)
 */
export const getAllLeaveBalances = async (req, res) => {
  try {
    const { year, department, employeeId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (year) query.year = parseInt(year, 10);
    if (employeeId) query.employee = employeeId;

    if (department) {
      const matchingEmployees = await Employee.find({
        department: new RegExp(department, 'i')
      }).select('_id');
      query.employee = { $in: matchingEmployees.map((e) => e._id) };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, balances] = await Promise.all([
      LeaveBalance.countDocuments(query),
      LeaveBalance.find(query)
        .populate('employee', 'name employeeNumber jobTitle department email')
        .sort({ year: -1, 'annualLeave.annualRemainingDays': 1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      total,
      count: balances.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: balances
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get leave balance for specific employee across years
 * @route   GET /api/leave/balances/:employeeId
 * @access  Private (Management/HR)
 */
export const getEmployeeLeaveBalances = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const balances = await LeaveBalance.find({ employee: employeeId })
      .populate('employee', 'name employeeNumber jobTitle department')
      .sort({ year: -1 });

    return res.status(200).json({
      success: true,
      data: balances
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Batch initialize or rollover leave balances for a new year
 * @route   POST /api/leave/balances/initialize
 * @access  Private (HR/Admin)
 */
export const initializeYearBalances = async (req, res) => {
  try {
    const targetYear = req.body.year ? parseInt(req.body.year, 10) : new Date().getFullYear();
    const carryForwardMax = req.body.carryForwardMax !== undefined ? parseInt(req.body.carryForwardMax, 10) : 5;

    const activeEmployees = await Employee.find({
      employmentStatus: { $in: ['active', 'probation'] }
    });

    let createdCount = 0;
    let existingCount = 0;

    for (const emp of activeEmployees) {
      const existing = await LeaveBalance.findOne({ employee: emp._id, year: targetYear });
      if (existing) {
        existingCount++;
        continue;
      }

      // Check previous year for rollover
      const prevYearBalance = await LeaveBalance.findOne({ employee: emp._id, year: targetYear - 1 });
      let carryForward = 0;
      if (prevYearBalance && prevYearBalance.annualLeave) {
        carryForward = Math.min(carryForwardMax, prevYearBalance.annualLeave.annualRemainingDays || 0);
      }

      const newBalance = new LeaveBalance({
        employee: emp._id,
        year: targetYear,
        carriedForwardDays: carryForward
      });
      newBalance.recalculateBalances();
      await newBalance.save();
      createdCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Leave balances initialized for ${targetYear}: ${createdCount} created, ${existingCount} already existed.`,
      year: targetYear,
      createdCount,
      existingCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Manually adjust leave balance entitlements or carried days
 * @route   PUT /api/leave/balances/:id
 * @access  Private (HR/Admin)
 */
export const adjustLeaveBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const balance = await LeaveBalance.findById(id);

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'Leave balance record not found'
      });
    }

    // Merge updates
    if (req.body.annualLeave) Object.assign(balance.annualLeave, req.body.annualLeave);
    if (req.body.sickLeave) Object.assign(balance.sickLeave, req.body.sickLeave);
    if (req.body.casualLeave) Object.assign(balance.casualLeave, req.body.casualLeave);
    if (req.body.maternityLeave) Object.assign(balance.maternityLeave, req.body.maternityLeave);
    if (req.body.paternityLeave) Object.assign(balance.paternityLeave, req.body.paternityLeave);
    if (req.body.carriedForwardDays !== undefined) balance.carriedForwardDays = req.body.carriedForwardDays;

    balance.recalculateBalances();
    await balance.save();

    const populated = await LeaveBalance.findById(balance._id).populate(
      'employee',
      'name employeeNumber jobTitle department'
    );

    return res.status(200).json({
      success: true,
      message: 'Leave balance adjusted successfully',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// LEAVE REQUESTS & APPROVAL PIPELINES
// ==========================================

/**
 * @desc    Submit a new leave request
 * @route   POST /api/leave/requests
 * @access  Private (Authenticated Employee)
 */
export const createLeaveRequest = async (req, res) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      startDayPeriod = 'full_day',
      endDayPeriod = 'full_day',
      totalLeaveDays,
      requestReason,
      supportingAttachments,
      employeeId
    } = req.body;

    if (!leaveType || !startDate || !endDate || !totalLeaveDays || !requestReason) {
      return res.status(400).json({
        success: false,
        message: 'leaveType, startDate, endDate, totalLeaveDays, and requestReason are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be before or equal to endDate'
      });
    }

    // Resolve target employee
    let targetEmployeeId = null;
    if (employeeId && isPrivileged(req.user, HR_ADMIN_ROLES)) {
      targetEmployeeId = employeeId;
    } else {
      const selfEmp = await Employee.findOne({ user: req.user._id });
      if (!selfEmp) {
        return res.status(400).json({
          success: false,
          message: 'No employee profile linked to your user account'
        });
      }
      targetEmployeeId = selfEmp._id;
    }

    // Check for overlapping active requests
    const overlapping = await LeaveRequest.findOne({
      employee: targetEmployeeId,
      requestStatus: { $in: ['pending', 'pending_manager', 'pending_hr', 'approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: `You already have an overlapping active leave request (${overlapping.requestStatus}) covering ${new Date(
          overlapping.startDate
        ).toLocaleDateString()} to ${new Date(overlapping.endDate).toLocaleDateString()}`
      });
    }

    // Check Leave Balance
    const requestYear = start.getFullYear();
    const balance = await LeaveBalance.getOrCreateForEmployee(targetEmployeeId, requestYear);

    // Validate available remaining days
    const daysRequested = Number(totalLeaveDays);
    let remainingDays = 0;

    switch (leaveType) {
      case 'annual':
        remainingDays = balance.annualLeave?.annualRemainingDays || 0;
        break;
      case 'sick':
        remainingDays = balance.sickLeave?.sickRemainingDays || 0;
        break;
      case 'casual':
        remainingDays = balance.casualLeave?.casualRemainingDays || 0;
        break;
      case 'maternity':
        remainingDays = balance.maternityLeave?.maternityRemainingDays || 0;
        break;
      case 'paternity':
        remainingDays = balance.paternityLeave?.paternityRemainingDays || 0;
        break;
      case 'unpaid':
      case 'other':
        remainingDays = Infinity;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Invalid leave type: ${leaveType}`
        });
    }

    if (leaveType !== 'unpaid' && leaveType !== 'other' && daysRequested > remainingDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance: You requested ${daysRequested} days, but have only ${remainingDays} day(s) remaining for ${leaveType} leave.`
      });
    }

    const leaveRequest = await LeaveRequest.create({
      employee: targetEmployeeId,
      leaveBalance: balance._id,
      leaveType,
      startDate: start,
      startDayPeriod,
      endDate: end,
      endDayPeriod,
      totalLeaveDays: daysRequested,
      requestReason,
      supportingAttachments: supportingAttachments || [],
      requestStatus: 'pending_manager',
      managerApproval: { status: 'pending' },
      hrApproval: { status: 'pending' }
    });

    const populated = await LeaveRequest.findById(leaveRequest._id)
      .populate('employee', 'name employeeNumber jobTitle department email')
      .populate('leaveBalance')
      .populate('managerApproval.approvedBy', 'email roles')
      .populate('hrApproval.approvedBy', 'email roles');

    return res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully and is pending review',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get currently logged-in employee's leave requests
 * @route   GET /api/leave/requests/me
 * @access  Private
 */
export const getMyLeaveRequests = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    const { status, leaveType, page = 1, limit = 20 } = req.query;
    const query = { employee: employee._id };

    if (status) {
      if (status === 'pending') {
        query.requestStatus = { $in: ['pending', 'pending_manager', 'pending_hr'] };
      } else {
        query.requestStatus = status;
      }
    }
    if (leaveType) query.leaveType = leaveType;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, requests] = await Promise.all([
      LeaveRequest.countDocuments(query),
      LeaveRequest.find(query)
        .populate('reviewer', 'email roles')
        .populate('managerApproval.approvedBy', 'email roles')
        .populate('hrApproval.approvedBy', 'email roles')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      total,
      count: requests.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: requests
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all leave requests (Management / HR)
 * @route   GET /api/leave/requests
 * @access  Private (Management/HR)
 */
export const getAllLeaveRequests = async (req, res) => {
  try {
    const { status, leaveType, department, employeeId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      if (status === 'pending') {
        query.requestStatus = { $in: ['pending', 'pending_manager', 'pending_hr'] };
      } else {
        query.requestStatus = status;
      }
    }
    if (leaveType) query.leaveType = leaveType;
    if (employeeId) query.employee = employeeId;

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    if (department) {
      const matchingEmployees = await Employee.find({
        department: new RegExp(department, 'i')
      }).select('_id');
      query.employee = { $in: matchingEmployees.map((e) => e._id) };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, requests] = await Promise.all([
      LeaveRequest.countDocuments(query),
      LeaveRequest.find(query)
        .populate('employee', 'name employeeNumber jobTitle department email')
        .populate('reviewer', 'email roles')
        .populate('managerApproval.approvedBy', 'email roles')
        .populate('hrApproval.approvedBy', 'email roles')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      total,
      count: requests.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: requests
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single leave request details
 * @route   GET /api/leave/requests/:id
 * @access  Private
 */
export const getLeaveRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findById(id)
      .populate('employee', 'name employeeNumber jobTitle department email primaryPhone')
      .populate('leaveBalance')
      .populate('reviewer', 'email roles')
      .populate('managerApproval.approvedBy', 'email roles')
      .populate('hrApproval.approvedBy', 'email roles')
      .populate('approvalHistory.reviewer', 'email roles');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
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
 * @desc    Review leave request with sequential double approval (Manager -> HR Officer)
 * @route   PATCH /api/leave/requests/:id/review
 * @access  Private (Management/HR)
 */
export const reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments, stage, bypassDoubleApproval } = req.body;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'approved' or 'rejected'"
      });
    }

    const leaveRequest = await LeaveRequest.findById(id).populate('employee');
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (['approved', 'rejected', 'cancelled'].includes(leaveRequest.requestStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot review request that is already ${leaveRequest.requestStatus}`
      });
    }

    // Optional executive bypass if explicitly requested
    const isExecutive = req.user.roles.some((r) => EXECUTIVE_ROLES.includes(r));
    if (bypassDoubleApproval && isExecutive) {
      if (action === 'approved') {
        const balance = await LeaveBalance.findById(leaveRequest.leaveBalance);
        if (!balance) {
          return res.status(404).json({
            success: false,
            message: 'Associated leave balance not found'
          });
        }
        const days = leaveRequest.totalLeaveDays;
        switch (leaveRequest.leaveType) {
          case 'annual':
            balance.annualLeave.annualUsedDays = (balance.annualLeave.annualUsedDays || 0) + days;
            break;
          case 'sick':
            balance.sickLeave.sickUsedDays = (balance.sickLeave.sickUsedDays || 0) + days;
            break;
          case 'casual':
            balance.casualLeave.casualUsedDays = (balance.casualLeave.casualUsedDays || 0) + days;
            break;
          case 'maternity':
            balance.maternityLeave.maternityUsedDays = (balance.maternityLeave.maternityUsedDays || 0) + days;
            break;
          case 'paternity':
            balance.paternityLeave.paternityUsedDays = (balance.paternityLeave.paternityUsedDays || 0) + days;
            break;
          default:
            break;
        }
        balance.recalculateBalances();
        await balance.save();
      }

      leaveRequest.managerApproval = {
        status: action,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments: comments || 'Executive override approval'
      };
      leaveRequest.hrApproval = {
        status: action,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments: comments || 'Executive override approval'
      };
      leaveRequest.requestStatus = action;
      leaveRequest.reviewer = req.user._id;
      leaveRequest.reviewComments = comments || 'Executive override';
      leaveRequest.reviewDate = new Date();
      leaveRequest.approvalHistory.push({
        reviewer: req.user._id,
        stage: 'executive',
        action,
        comments: comments || 'Executive override',
        decidedAt: new Date()
      });
      await leaveRequest.save();

      const populated = await LeaveRequest.findById(leaveRequest._id)
        .populate('employee', 'name employeeNumber jobTitle department email')
        .populate('leaveBalance')
        .populate('reviewer', 'email roles')
        .populate('managerApproval.approvedBy', 'email roles')
        .populate('hrApproval.approvedBy', 'email roles');

      return res.status(200).json({
        success: true,
        message: `Leave request has been ${action} via executive decision`,
        data: populated
      });
    }

    // Determine current approval stage
    const isAtManagerStage =
      leaveRequest.requestStatus === 'pending_manager' ||
      (leaveRequest.requestStatus === 'pending' && leaveRequest.managerApproval?.status !== 'approved');

    // Stage 1: Direct Manager Review
    if (stage === 'manager' || (!stage && isAtManagerStage)) {
      const check = await canApproveAsManager(req.user, leaveRequest.employee);
      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          message: check.message || 'You are not authorized to approve the manager stage'
        });
      }

      leaveRequest.managerApproval = {
        status: action,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments: comments || ''
      };

      if (action === 'rejected') {
        leaveRequest.requestStatus = 'rejected';
      } else {
        leaveRequest.requestStatus = 'pending_hr';
      }

      leaveRequest.reviewer = req.user._id;
      leaveRequest.reviewComments = comments || '';
      leaveRequest.reviewDate = new Date();

      leaveRequest.approvalHistory.push({
        reviewer: req.user._id,
        stage: 'manager',
        action,
        comments: comments || '',
        decidedAt: new Date()
      });

      await leaveRequest.save();

      const populated = await LeaveRequest.findById(leaveRequest._id)
        .populate('employee', 'name employeeNumber jobTitle department email')
        .populate('leaveBalance')
        .populate('reviewer', 'email roles')
        .populate('managerApproval.approvedBy', 'email roles')
        .populate('hrApproval.approvedBy', 'email roles');

      const message =
        action === 'approved'
          ? 'Manager approval granted. Leave request is now pending HR approval.'
          : 'Leave request has been rejected by the manager.';

      return res.status(200).json({
        success: true,
        message,
        data: populated
      });
    }

    // Stage 2: HR Officer Review
    const isAtHRStage =
      leaveRequest.requestStatus === 'pending_hr' ||
      (leaveRequest.managerApproval?.status === 'approved' && leaveRequest.hrApproval?.status === 'pending');

    if (stage === 'hr' || (!stage && isAtHRStage)) {
      if (leaveRequest.managerApproval?.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Direct manager approval must be granted before HR review'
        });
      }

      const check = canApproveAsHR(req.user, leaveRequest.employee);
      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          message: check.message || 'Only an HR Officer, HR Manager, or Executive can approve the HR stage'
        });
      }

      leaveRequest.hrApproval = {
        status: action,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments: comments || ''
      };

      if (action === 'rejected') {
        leaveRequest.requestStatus = 'rejected';
      } else {
        leaveRequest.requestStatus = 'approved';

        // Deduct leave balance upon final HR approval
        const balance = await LeaveBalance.findById(leaveRequest.leaveBalance);
        if (!balance) {
          return res.status(404).json({
            success: false,
            message: 'Associated leave balance not found'
          });
        }

        const days = leaveRequest.totalLeaveDays;
        switch (leaveRequest.leaveType) {
          case 'annual':
            balance.annualLeave.annualUsedDays = (balance.annualLeave.annualUsedDays || 0) + days;
            break;
          case 'sick':
            balance.sickLeave.sickUsedDays = (balance.sickLeave.sickUsedDays || 0) + days;
            break;
          case 'casual':
            balance.casualLeave.casualUsedDays = (balance.casualLeave.casualUsedDays || 0) + days;
            break;
          case 'maternity':
            balance.maternityLeave.maternityUsedDays = (balance.maternityLeave.maternityUsedDays || 0) + days;
            break;
          case 'paternity':
            balance.paternityLeave.paternityUsedDays = (balance.paternityLeave.paternityUsedDays || 0) + days;
            break;
          default:
            break;
        }

        balance.recalculateBalances();
        await balance.save();
      }

      leaveRequest.reviewer = req.user._id;
      leaveRequest.reviewComments = comments || '';
      leaveRequest.reviewDate = new Date();

      leaveRequest.approvalHistory.push({
        reviewer: req.user._id,
        stage: 'hr',
        action,
        comments: comments || '',
        decidedAt: new Date()
      });

      await leaveRequest.save();

      const populated = await LeaveRequest.findById(leaveRequest._id)
        .populate('employee', 'name employeeNumber jobTitle department email')
        .populate('leaveBalance')
        .populate('reviewer', 'email roles')
        .populate('managerApproval.approvedBy', 'email roles')
        .populate('hrApproval.approvedBy', 'email roles');

      const message =
        action === 'approved'
          ? 'Leave request fully approved by HR and balance deducted.'
          : 'Leave request has been rejected by HR.';

      return res.status(200).json({
        success: true,
        message,
        data: populated
      });
    }

    return res.status(400).json({
      success: false,
      message: `Invalid review stage or request state (current status: ${leaveRequest.requestStatus})`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Cancel a leave request (restores balance if previously approved)
 * @route   POST /api/leave/requests/:id/cancel
 * @access  Private (Employee or HR)
 */
export const cancelLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (['cancelled', 'rejected'].includes(leaveRequest.requestStatus)) {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leaveRequest.requestStatus}`
      });
    }

    // Permission check: must be the employee or HR
    const selfEmployee = await Employee.findOne({ user: req.user._id });
    const isOwner = selfEmployee && leaveRequest.employee.toString() === selfEmployee._id.toString();
    if (!isOwner && !isPrivileged(req.user, HR_ADMIN_ROLES)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this leave request'
      });
    }

    // Rollback balance if it was approved
    if (leaveRequest.requestStatus === 'approved') {
      const balance = await LeaveBalance.findById(leaveRequest.leaveBalance);
      if (balance) {
        const days = leaveRequest.totalLeaveDays;
        switch (leaveRequest.leaveType) {
          case 'annual':
            balance.annualLeave.annualUsedDays = Math.max(0, (balance.annualLeave.annualUsedDays || 0) - days);
            break;
          case 'sick':
            balance.sickLeave.sickUsedDays = Math.max(0, (balance.sickLeave.sickUsedDays || 0) - days);
            break;
          case 'casual':
            balance.casualLeave.casualUsedDays = Math.max(0, (balance.casualLeave.casualUsedDays || 0) - days);
            break;
          case 'maternity':
            balance.maternityLeave.maternityUsedDays = Math.max(0, (balance.maternityLeave.maternityUsedDays || 0) - days);
            break;
          case 'paternity':
            balance.paternityLeave.paternityUsedDays = Math.max(0, (balance.paternityLeave.paternityUsedDays || 0) - days);
            break;
          default:
            break;
        }

        balance.recalculateBalances();
        await balance.save();
      }
    }

    leaveRequest.requestStatus = 'cancelled';
    leaveRequest.approvalHistory.push({
      reviewer: req.user._id,
      action: 'rejected',
      comments: cancellationReason ? `Cancelled: ${cancellationReason}` : 'Cancelled by user/HR',
      decidedAt: new Date()
    });

    await leaveRequest.save();

    return res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully and any deducted days have been restored',
      data: leaveRequest
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
