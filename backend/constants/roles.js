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

export const HR_ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.CEO,
  ROLES.CAO,
  ROLES.COO,
  ROLES.HR_MANAGER,
  ROLES.HR_OFFICER
];

export const EXECUTIVE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.CEO,
  ROLES.CAO,
  ROLES.COO,
  ROLES.HR_MANAGER
];

export const MANAGEMENT_ROLES = [
  ...HR_ADMIN_ROLES,
  ROLES.DEPARTMENT_HEAD,
  ROLES.MANAGER
];

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
};

/**
 * Hierarchical Registration Permissions
 * - CEO can register: CEO, CAO, COO
 * - CAO can register: HR Manager, Purchaser, Storekeeper, Finance, HR Officer, Frontdesk
 * - COO can register: Department Head, Manager, Designer
 * - HR Manager can register: Employee, Intern with details
 */
export const ROLE_REGISTRATION_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ALL_ROLES,
  [ROLES.CEO]: [ROLES.CEO, ROLES.CAO, ROLES.COO],
  [ROLES.CAO]: [
    ROLES.HR_MANAGER,
    ROLES.HR_OFFICER,
    ROLES.PURCHASING,
    ROLES.STOREKEEPER,
    ROLES.FINANCE,
    ROLES.FRONTDESK
  ],
  [ROLES.COO]: [
    ROLES.DEPARTMENT_HEAD,
    ROLES.MANAGER,
    ROLES.DESIGNER
  ],
  [ROLES.HR_MANAGER]: [
    ROLES.EMPLOYEE,
    ROLES.INTERN,
    ROLES.DESIGNER
  ],
  [ROLES.HR_OFFICER]: [
    ROLES.EMPLOYEE,
    ROLES.INTERN
  ]
};

/**
 * Get all roles that a given set of user roles is allowed to register
 * @param {string[]} userRoles - Array of roles held by the registering user
 * @returns {string[]} Array of distinct roles the user is permitted to create
 */
export const getAllowedRegistrationRoles = (userRoles) => {
  if (!userRoles || !Array.isArray(userRoles)) return [];
  const allowedSet = new Set();
  for (const role of userRoles) {
    const permissions = ROLE_REGISTRATION_PERMISSIONS[role];
    if (permissions && Array.isArray(permissions)) {
      permissions.forEach((r) => allowedSet.add(r));
    }
  }
  return Array.from(allowedSet);
};


