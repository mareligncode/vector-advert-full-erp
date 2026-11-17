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

