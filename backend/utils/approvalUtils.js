import Employee from '../models/Employee.js';
import { ROLES, HR_ADMIN_ROLES, EXECUTIVE_ROLES } from '../constants/roles.js';

/**
 * Check if a user is the direct manager of an employee
 * @param {string|mongoose.Types.ObjectId} userId - Current user's _id
 * @param {Object|string|mongoose.Types.ObjectId} employee - Employee document or employee _id
 * @returns {Promise<boolean>}
 */
export const isDirectManager = async (userId, employee) => {
  if (!employee) return false;

  let empDoc = employee;
  if (!empDoc.manager && typeof employee === 'string' || employee._id) {
    empDoc = await Employee.findById(employee._id || employee).select('manager user');
  }

  if (!empDoc || !empDoc.manager) return false;

  const managerEmp = await Employee.findById(empDoc.manager).select('user');
  if (!managerEmp || !managerEmp.user) return false;

  return String(managerEmp.user) === String(userId);
};

/**
 * Check if user is eligible to perform the Stage 1 Manager Approval
 * Allowed:
 * 1. Assigned direct manager
 * 2. Department Head
 * 3. HR Manager / Executive (as company fallback when manager is absent or not assigned)
 *
 * @param {Object} user - req.user
 * @param {Object|string|mongoose.Types.ObjectId} employee - Employee document or employee _id
 * @returns {Promise<{ allowed: boolean, roleTitle?: string, message?: string }>}
 */
export const canApproveAsManager = async (user, employee) => {
  if (!user || !user.roles) {
    return { allowed: false, message: 'Unauthorized user credentials' };
  }

  let empDoc = employee;
  if (!empDoc.user || !empDoc.manager) {
    empDoc = await Employee.findById(employee._id || employee).select('user manager department');
  }

  // Prevent self-approval
  if (empDoc && empDoc.user && String(empDoc.user) === String(user._id)) {
    return {
      allowed: false,
      message: 'Employees cannot approve their own requests'
    };
  }

  // 1. Direct manager check
  const isDirect = await isDirectManager(user._id, empDoc);
  if (isDirect) {
    return { allowed: true, roleTitle: 'Manager' };
  }

  // 2. Department Head check
  if (user.roles.includes(ROLES.DEPARTMENT_HEAD)) {
    return { allowed: true, roleTitle: 'Department Head' };
  }

  // 3. Fallback: HR Manager or Executives
  const isExecutiveOrHRManager =
    user.roles.includes(ROLES.HR_MANAGER) ||
    user.roles.includes(ROLES.SUPER_ADMIN) ||
    user.roles.includes(ROLES.CEO) ||
    user.roles.includes(ROLES.COO) ||
    user.roles.includes(ROLES.CAO);

  if (isExecutiveOrHRManager) {
    return { allowed: true, roleTitle: 'HR Manager / Executive' };
  }

  return {
    allowed: false,
    message: 'Only the assigned direct manager, Department Head, or HR Manager can approve the manager stage'
  };
};

/**
 * Check if user is eligible to perform the Stage 2 HR Approval
 * Allowed:
 * HR Officer, HR Manager, or Executives
 *
 * @param {Object} user - req.user
 * @param {Object|string|mongoose.Types.ObjectId} employee - Employee document or employee _id
 * @returns {{ allowed: boolean, roleTitle?: string, message?: string }}
 */
export const canApproveAsHR = (user, employee) => {
  if (!user || !user.roles) {
    return { allowed: false, message: 'Unauthorized user credentials' };
  }

  // Prevent self-approval even if HR
  if (employee && employee.user && String(employee.user) === String(user._id)) {
    return {
      allowed: false,
      message: 'Employees cannot approve their own requests'
    };
  }

  const isHROrExecutive =
    user.roles.includes(ROLES.HR_OFFICER) ||
    user.roles.includes(ROLES.HR_MANAGER) ||
    user.roles.includes(ROLES.SUPER_ADMIN) ||
    user.roles.includes(ROLES.CEO) ||
    user.roles.includes(ROLES.COO) ||
    user.roles.includes(ROLES.CAO);

  if (!isHROrExecutive) {
    return {
      allowed: false,
      message: 'Only an HR Officer, HR Manager, or Executive can approve the HR stage'
    };
  }

  let roleTitle = 'HR Officer';
  if (user.roles.includes(ROLES.HR_MANAGER)) {
    roleTitle = 'HR Manager';
  } else if (
    user.roles.includes(ROLES.SUPER_ADMIN) ||
    user.roles.includes(ROLES.CEO) ||
    user.roles.includes(ROLES.COO) ||
    user.roles.includes(ROLES.CAO)
  ) {
    roleTitle = 'Executive';
  }

  return { allowed: true, roleTitle };
};
