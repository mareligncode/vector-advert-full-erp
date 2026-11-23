/**
 * Vector Advert ERP - Role-Based Access Control (RBAC) Definitions & Helpers
 */

export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  CEO: 'ceo',
  CAO: 'cao',
  COO: 'coo',
  HR_MANAGER: 'hrmanager',
  HR_OFFICER: 'hrofficer',
  DEPARTMENT_HEAD: 'departmenthead',
  MANAGER: 'manager',
  FINANCE: 'finance',
  PURCHASING: 'purchasing',
  STOREKEEPER: 'storekeeper',
  DESIGNER: 'designer',
  FRONTDESK: 'frontdesk',
  EMPLOYEE: 'employee',
  INTERN: 'intern'
};

export const ALL_ROLES = Object.values(ROLES);

// HR Administrators: Full administrative access to HR subsystem
export const HR_ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.CEO,
  ROLES.CAO,
  ROLES.COO,
  ROLES.HR_MANAGER,
  ROLES.HR_OFFICER
];

// Executive Leadership: Authorized for destructive actions (e.g. employee deletion)
export const EXECUTIVE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.CEO,
  ROLES.CAO,
  ROLES.COO,
  ROLES.HR_MANAGER
];

// Management: Department heads and operational managers
export const MANAGEMENT_ROLES = [
  ...HR_ADMIN_ROLES,
  ROLES.DEPARTMENT_HEAD,
  ROLES.MANAGER
];

// Financial Privacy: Authorized to view and manage salaries and bank accounts
export const FINANCIAL_VIEW_ROLES = [
  ...HR_ADMIN_ROLES,
  ROLES.FINANCE
];

/**
 * Check if the user has any of the specified roles
 */
export const hasAnyRole = (user, allowedRoles) => {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((r) => allowedRoles.includes(r));
};

/**
 * Granular RBAC Permissions for the Employee Subsystem
 */
export const canCreateEmployee = (user) => hasAnyRole(user, HR_ADMIN_ROLES);
export const canEditEmployee = (user) => hasAnyRole(user, HR_ADMIN_ROLES);
export const canDeleteEmployee = (user) => hasAnyRole(user, EXECUTIVE_ROLES);
export const canChangeEmploymentStatus = (user) => hasAnyRole(user, HR_ADMIN_ROLES);
export const canManageUserAccount = (user) => hasAnyRole(user, HR_ADMIN_ROLES);
export const canApproveNationalId = (user) => hasAnyRole(user, HR_ADMIN_ROLES);
export const canApproveDocuments = (user) => hasAnyRole(user, HR_ADMIN_ROLES);
export const canViewFinancials = (user) => hasAnyRole(user, FINANCIAL_VIEW_ROLES);

export const DEPARTMENTS = [
  'Executive Leadership',
  'Human Resources',
  'Finance & Accounting',
  'Purchasing & Logistics',
  'Creative & Design',
  'Printing & Production',
  'Operations & Quality',
  'Sales & Marketing',
  'Front Desk & Customer Support',
  'IT & Systems Control'
];

export const EMPLOYMENT_STATUSES = [
  { value: 'active', label: 'Active', color: 'emerald' },
  { value: 'probation', label: 'Probation', color: 'amber' },
  { value: 'suspended', label: 'Suspended', color: 'rose' },
  { value: 'on_leave', label: 'On Leave', color: 'blue' },
  { value: 'terminated', label: 'Terminated', color: 'slate' },
  { value: 'resigned', label: 'Resigned', color: 'purple' }
];

export const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-Time' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' }
];
