import mongoose from 'mongoose';
import Clearance, { DEFAULT_DEPARTMENT_CLEARANCES } from '../models/Clearance.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import { ROLES, HR_ADMIN_ROLES, MANAGEMENT_ROLES, ACCOUNT_STATUS } from '../constants/roles.js';
import { formatFileUrl } from '../utils/fileUtils.js';

/**
 * Helper to check general privileged role
 */
const isPrivileged = (user, allowedRoles = MANAGEMENT_ROLES) => {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((r) => allowedRoles.includes(r));
};

/**
 * Check department sign-off permission based on user roles
 */
const isAuthorizedForDepartment = (user, department, employeeManagerId) => {
  if (!user || !Array.isArray(user.roles)) return false;

  // Super Admin & CEO have global clearance sign-off authority
  if (user.roles.includes(ROLES.SUPER_ADMIN) || user.roles.includes(ROLES.CEO)) {
    return true;
  }

  const dept = department.toLowerCase().replace('-', '_');

  switch (dept) {
    case 'department_head':
      return (
        user.roles.includes(ROLES.DEPARTMENT_HEAD) ||
        user.roles.includes(ROLES.MANAGER) ||
        user.roles.includes(ROLES.COO) ||
        user.roles.includes(ROLES.CAO) ||
        user.roles.includes(ROLES.HR_MANAGER) ||
        (employeeManagerId && user.employeeId && user.employeeId.toString() === employeeManagerId.toString())
      );

    case 'store':
      return (
        user.roles.includes(ROLES.STOREKEEPER) ||
        user.roles.includes(ROLES.PURCHASING) ||
        user.roles.includes(ROLES.HR_MANAGER)
      );

    case 'it':
      return (
        user.roles.includes(ROLES.SUPER_ADMIN) ||
        user.roles.includes(ROLES.CEO) ||
        user.roles.includes(ROLES.COO) ||
        user.roles.includes(ROLES.CAO) ||
        user.roles.includes(ROLES.HR_MANAGER)
      );

    case 'finance':
      return (
        user.roles.includes(ROLES.FINANCE) ||
        user.roles.includes(ROLES.HR_MANAGER)
      );

    case 'hr':
      return (
        user.roles.includes(ROLES.HR_MANAGER) ||
        user.roles.includes(ROLES.HR_OFFICER)
      );

    default:
      return false;
  }
};

/**
 * @desc    Initiate an employee clearance process / resignation
 * @route   POST /api/clearances
 * @access  Private (Employee or HR/Admin)
 */
export const initiateClearance = async (req, res) => {
  try {
    const { employeeId, resignationDate, lastWorkingDay, reasonForLeaving, customDepartments } = req.body;

    if (!resignationDate || !lastWorkingDay || !reasonForLeaving) {
      return res.status(400).json({
        success: false,
        message: 'resignationDate, lastWorkingDay, and reasonForLeaving are required'
      });
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

    const employee = await Employee.findById(targetEmployeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check for existing active clearance
    const existing = await Clearance.findOne({
      employee: targetEmployeeId,
      overallClearanceStatus: { $in: ['pending', 'in_progress', 'approved'] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An active clearance process is already in progress (${existing.overallClearanceStatus}) for this employee`
      });
    }

    // Use default department clearances or custom merge
    const departmentsToInitialize = Array.isArray(customDepartments) && customDepartments.length >= 5
      ? customDepartments
      : JSON.parse(JSON.stringify(DEFAULT_DEPARTMENT_CLEARANCES));

    const clearance = await Clearance.create({
      employee: targetEmployeeId,
      resignationDate: new Date(resignationDate),
      lastWorkingDay: new Date(lastWorkingDay),
      reasonForLeaving,
      clearances: departmentsToInitialize,
      overallClearanceStatus: 'pending'
    });

    const populated = await Clearance.findById(clearance._id)
      .populate('employee', 'name employeeNumber jobTitle department email primaryPhone')
      .populate('clearances.approvedBy', 'email roles');

    return res.status(201).json({
      success: true,
      message: 'Clearance initiated successfully across all 5 departments',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all clearances with filters and pagination
 * @route   GET /api/clearances
 * @access  Private (Management/HR)
 */
export const getClearances = async (req, res) => {
  try {
    const { status, employeeId, department, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.overallClearanceStatus = status;
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

    const [total, clearances] = await Promise.all([
      Clearance.countDocuments(query),
      Clearance.find(query)
        .populate('employee', 'name employeeNumber jobTitle department email primaryPhone')
        .populate('clearances.approvedBy', 'email roles')
        .populate('completedBy', 'email roles')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      total,
      count: clearances.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: clearances
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get current user's clearance record
 * @route   GET /api/clearances/me
 * @access  Private
 */
export const getMyClearance = async (req, res) => {
  try {
    const selfEmployee = await Employee.findOne({ user: req.user._id });
    if (!selfEmployee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    const clearance = await Clearance.findOne({ employee: selfEmployee._id })
      .sort({ createdAt: -1 })
      .populate('employee', 'name employeeNumber jobTitle department email primaryPhone')
      .populate('clearances.approvedBy', 'email roles')
      .populate('completedBy', 'email roles');

    if (!clearance) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No clearance record found for your account'
      });
    }

    return res.status(200).json({
      success: true,
      data: clearance
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single clearance record by ID
 * @route   GET /api/clearances/:id
 * @access  Private
 */
export const getClearanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const clearance = await Clearance.findById(id)
      .populate('employee', 'name employeeNumber jobTitle department email primaryPhone manager')
      .populate('clearances.approvedBy', 'email roles')
      .populate('completedBy', 'email roles');

    if (!clearance) {
      return res.status(404).json({
        success: false,
        message: 'Clearance record not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: clearance
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Review and update a specific department's clearance status
 * @route   PATCH /api/clearances/:id/department/:department
 * @access  Private (Department Authorized Role)
 */
export const updateDepartmentClearance = async (req, res) => {
  try {
    const { id, department } = req.params;
    const { status, note, items } = req.body;

    const normalizedDept = department.toLowerCase().replace('-', '_');
    const validDepts = ['department_head', 'store', 'it', 'finance', 'hr'];

    if (!validDepts.includes(normalizedDept)) {
      return res.status(400).json({
        success: false,
        message: `Invalid clearance department '${department}'. Allowed: ${validDepts.join(', ')}`
      });
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'approved', 'rejected', or 'pending'"
      });
    }

    const clearance = await Clearance.findById(id).populate('employee');
    if (!clearance) {
      return res.status(404).json({
        success: false,
        message: 'Clearance record not found'
      });
    }

    if (clearance.overallClearanceStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Clearance has already been finalized and completed'
      });
    }

    // Role-based authorization for this specific department
    const employeeManager = clearance.employee?.manager;
    const authorized = isAuthorizedForDepartment(req.user, normalizedDept, employeeManager);

    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Your roles [${req.user.roles.join(', ')}] are not authorized to sign off on '${normalizedDept}' clearance`
      });
    }

    // Find the department entry
    let deptEntry = clearance.clearances.find((d) => d.department === normalizedDept);
    if (!deptEntry) {
      deptEntry = {
        department: normalizedDept,
        status: 'pending',
        items: []
      };
      clearance.clearances.push(deptEntry);
      deptEntry = clearance.clearances[clearance.clearances.length - 1];
    }

    deptEntry.status = status;
    deptEntry.approvedBy = req.user._id;
    deptEntry.approvedAt = new Date();
    if (note !== undefined) deptEntry.note = note;

    if (Array.isArray(items)) {
      deptEntry.items = items;
    }

    // Recalculate overall status
    clearance.recalculateOverallStatus();
    await clearance.save();

    const populated = await Clearance.findById(clearance._id)
      .populate('employee', 'name employeeNumber jobTitle department email primaryPhone')
      .populate('clearances.approvedBy', 'email roles');

    return res.status(200).json({
      success: true,
      message: `${normalizedDept} clearance status updated to '${status}'`,
      overallClearanceStatus: clearance.overallClearanceStatus,
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Finalize clearance, issue certificate, and complete employee offboarding
 * @route   POST /api/clearances/:id/finalize
 * @access  Private (HR/Admin)
 */
export const finalizeClearance = async (req, res) => {
  try {
    const { id } = req.params;
    let certificateUrl = req.body.certificateUrl;

    // Check if certificate was uploaded via multipart file
    if (req.file) {
      certificateUrl = formatFileUrl('clearances', req.file.filename);
    }

    const clearance = await Clearance.findById(id).populate('employee');
    if (!clearance) {
      return res.status(404).json({
        success: false,
        message: 'Clearance record not found'
      });
    }

    if (clearance.overallClearanceStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Clearance is already completed'
      });
    }

    // Ensure all 5 departments are approved
    const requiredDepts = ['department_head', 'store', 'it', 'finance', 'hr'];
    const unapprovedDepts = requiredDepts.filter((dept) => {
      const entry = clearance.clearances.find((d) => d.department === dept);
      return !entry || entry.status !== 'approved';
    });

    if (unapprovedDepts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot finalize clearance: The following departments are not yet approved: ${unapprovedDepts.join(', ')}`
      });
    }

    clearance.overallClearanceStatus = 'completed';
    clearance.completedBy = req.user._id;
    clearance.completedAt = new Date();
    if (certificateUrl) {
      clearance.clearanceCertificateUrl = certificateUrl;
    }

    await clearance.save();

    // Automatically update Employee status to 'resigned'
    if (clearance.employee) {
      const employee = await Employee.findById(clearance.employee._id);
      if (employee) {
        employee.employmentStatus = 'resigned';
        employee.contractEndDate = clearance.lastWorkingDay;
        await employee.save();

        // De-provision linked user account
        if (employee.user) {
          await User.findByIdAndUpdate(employee.user, {
            accountStatus: ACCOUNT_STATUS.INACTIVE
          });
        }
      }
    }

    const populated = await Clearance.findById(clearance._id)
      .populate('employee', 'name employeeNumber jobTitle department email primaryPhone employmentStatus')
      .populate('clearances.approvedBy', 'email roles')
      .populate('completedBy', 'email roles');

    return res.status(200).json({
      success: true,
      message: 'Employee clearance completed and signed off. Employee status marked as resigned.',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update clearance general details
 * @route   PATCH /api/clearances/:id
 * @access  Private (HR/Admin)
 */
export const updateClearance = async (req, res) => {
  try {
    const { id } = req.params;
    const { resignationDate, lastWorkingDay, reasonForLeaving } = req.body;

    const clearance = await Clearance.findById(id);
    if (!clearance) {
      return res.status(404).json({
        success: false,
        message: 'Clearance record not found'
      });
    }

    if (resignationDate) clearance.resignationDate = new Date(resignationDate);
    if (lastWorkingDay) clearance.lastWorkingDay = new Date(lastWorkingDay);
    if (reasonForLeaving) clearance.reasonForLeaving = reasonForLeaving;

    await clearance.save();

    return res.status(200).json({
      success: true,
      message: 'Clearance details updated successfully',
      data: clearance
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete clearance record
 * @route   DELETE /api/clearances/:id
 * @access  Private (Executive / Super Admin)
 */
export const deleteClearance = async (req, res) => {
  try {
    const { id } = req.params;
    const clearance = await Clearance.findById(id);
    if (!clearance) {
      return res.status(404).json({
        success: false,
        message: 'Clearance record not found'
      });
    }

    await Clearance.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Clearance record deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
