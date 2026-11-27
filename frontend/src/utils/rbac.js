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
  if (!user) return false;
  const userRoles = (
    Array.isArray(user.roles)
      ? user.roles
      : user.role
      ? [user.role]
      : []
  ).map((r) => String(r).toLowerCase().trim());

  const normalizedAllowed = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles])
    .flat(Infinity)
    .map((r) => String(r).toLowerCase().trim());

  return userRoles.some((r) => normalizedAllowed.includes(r));
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
export const canViewAllEmployees = (user) => hasAnyRole(user, MANAGEMENT_ROLES);
export const canViewAllAttendance = (user) => hasAnyRole(user, MANAGEMENT_ROLES);
export const canAdjustAttendance = (user) => hasAnyRole(user, HR_ADMIN_ROLES);
export const canConfigureAttendance = (user) => hasAnyRole(user, HR_ADMIN_ROLES);
export const canViewAllLeave = (user) => hasAnyRole(user, MANAGEMENT_ROLES);
export const canReviewLeave = (user) => hasAnyRole(user, MANAGEMENT_ROLES);
export const canAdjustLeaveBalance = (user) => hasAnyRole(user, HR_ADMIN_ROLES);
export const canInitializeLeave = (user) => hasAnyRole(user, HR_ADMIN_ROLES);
export const canViewAllOvertime = (user) => hasAnyRole(user, MANAGEMENT_ROLES);
export const canReviewOvertime = (user) => hasAnyRole(user, MANAGEMENT_ROLES);
export const canConfigureOvertime = (user) => hasAnyRole(user, HR_ADMIN_ROLES);
export const canManageFieldVisits = (user) => hasAnyRole(user, MANAGEMENT_ROLES);
export const canCreateFieldVisit = (user) => hasAnyRole(user, MANAGEMENT_ROLES);
export const canEditFieldVisit = (user) => hasAnyRole(user, MANAGEMENT_ROLES);
export const canDeleteFieldVisit = (user) => hasAnyRole(user, HR_ADMIN_ROLES);

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
  { value: 'active', label: 'Active', amLabel: 'ንቁ (Active)' },
  { value: 'probation', label: 'Probation', amLabel: 'የሙከራ ጊዜ (Probation)' },
  { value: 'suspended', label: 'Suspended', amLabel: 'የታገደ (Suspended)' },
  { value: 'on_leave', label: 'On Leave', amLabel: 'በፈቃድ ላይ (On Leave)' },
  { value: 'terminated', label: 'Terminated', amLabel: 'የተሰናበተ (Terminated)' },
  { value: 'resigned', label: 'Resigned', amLabel: 'የለቀቀ (Resigned)' }
];

export const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-Time', amLabel: 'ሙሉ ሰዓት (Full-Time)' },
  { value: 'part-time', label: 'Part-Time', amLabel: 'የትርፍ ሰዓት (Part-Time)' },
  { value: 'contract', label: 'Contract', amLabel: 'የውል (Contract)' },
  { value: 'freelance', label: 'Freelance', amLabel: 'ፍሪላንስ (Freelance)' },
  { value: 'internship', label: 'Internship', amLabel: 'ልምምድ (Internship)' }
];

export const RELIGIONS = [
  { value: 'Orthodox', label: 'Orthodox Christian', amLabel: 'ኦርቶዶክስ ተዋህዶ' },
  { value: 'Muslim', label: 'Muslim', amLabel: 'እስልምና' },
  { value: 'Protestant', label: 'Protestant', amLabel: 'ፕሮቴስታንት' },
  { value: 'Catholic', label: 'Catholic', amLabel: 'ካቶሊክ' },
  { value: 'Traditional', label: 'Traditional / Waaqeffanna', amLabel: 'ባህላዊ / ዋቄፈና' },
  { value: 'Other', label: 'Other', amLabel: 'ሌላ' }
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export const EDUCATION_LEVELS = [
  { value: 'High School', label: 'High School / 12th Grade', amLabel: 'የሁለተኛ ደረጃ' },
  { value: 'TVET / Diploma', label: 'TVET / Diploma (Level 1-4)', amLabel: 'ዲፕሎማ / ቴክኒክና ሙያ' },
  { value: "Bachelor's Degree", label: "Bachelor's Degree (BSc / BA)", amLabel: 'የመጀመሪያ ዲግሪ' },
  { value: "Master's Degree", label: "Master's Degree (MSc / MA / MBA)", amLabel: 'ሁለተኛ ዲግሪ (ማስተርስ)' },
  { value: 'PhD / Doctorate', label: 'PhD / Doctorate', amLabel: 'የዶክትሬት ዲግሪ' },
  { value: 'Professional Certificate', label: 'Professional Certificate', amLabel: 'የሙያ ማረጋገጫ ምስክር ወረቀት' },
  { value: 'Other', label: 'Other', amLabel: 'ሌላ' }
];

export const WORK_LOCATIONS = [
  { value: 'Headquarters (HQ)', label: 'Headquarters (HQ)', amLabel: 'ዋና መ/ቤት (HQ)' },
  { value: 'Printing & Production Plant', label: 'Printing & Production Plant', amLabel: 'ማተሚያና ማምረቻ ፋብሪካ' },
  { value: 'Design & Creative Studio', label: 'Design & Creative Studio', amLabel: 'ዲዛይንና ፈጠራ ስቱዲዮ' },
  { value: 'Central Warehouse & Store', label: 'Central Warehouse & Store', amLabel: 'ዋና መጋዘንና እቃ ግምጃ ቤት' },
  { value: 'Field / On-Site Operations', label: 'Field / On-Site Operations', amLabel: 'የሜዳና የውጭ ስራዎች' },
  { value: 'Remote / Work from Home', label: 'Remote / Work from Home', amLabel: 'ከቤት ሆኖ የሚሰራ' }
];

export const BRANCHES = [
  { value: 'Main Branch - Bole', label: 'Main Branch - Bole', amLabel: 'ዋና ቅርንጫፍ - ቦሌ' },
  { value: 'Mexico City Branch', label: 'Mexico City Branch', amLabel: 'ሜክሲኮ ቅርንጫፍ' },
  { value: 'Piazza Branch', label: 'Piazza Branch', amLabel: 'ፒያሳ ቅርንጫፍ' },
  { value: 'Megenagna Branch', label: 'Megenagna Branch', amLabel: 'መገናኛ ቅርንጫፍ' },
  { value: 'Kality Industrial Zone', label: 'Kality Industrial Zone', amLabel: 'ቃሊቲ ኢንዱስትሪ ዞን' },
  { value: 'Hawassa Branch', label: 'Hawassa Branch', amLabel: 'ሀዋሳ ቅርንጫፍ' },
  { value: 'Adama Branch', label: 'Adama Branch', amLabel: 'አዳማ ቅርንጫፍ' }
];

export const GUARANTOR_RELATIONSHIPS = [
  { value: 'Parent', label: 'Parent (Father/Mother)', amLabel: 'ወላጅ (አባት/እናት)' },
  { value: 'Spouse', label: 'Spouse (Husband/Wife)', amLabel: 'የትዳር አጋር' },
  { value: 'Sibling', label: 'Sibling (Brother/Sister)', amLabel: 'ወንድም / እህት' },
  { value: 'Relative', label: 'Relative / Family Member', amLabel: 'የቅርብ ዘመድ' },
  { value: 'Colleague', label: 'Colleague / Business Associate', amLabel: 'የስራ ባልደረባ' },
  { value: 'Friend', label: 'Friend / Guarantor', amLabel: 'ጓደኛ / ዋስ' },
  { value: 'Other', label: 'Other', amLabel: 'ሌላ' }
];

/**
 * Universal helper to safely format employee name from string or object { first, middle, last }
 */
export const getEmployeeFullName = (emp) => {
  if (!emp) return 'Staff Member';
  if (typeof emp === 'string') return emp;
  if (typeof emp.name === 'string') return emp.name;
  if (emp.name && typeof emp.name === 'object') {
    const full = `${emp.name.first || ''} ${emp.name.middle || ''} ${emp.name.last || ''}`.trim();
    if (full) return full;
  }
  return emp.employeeNumber || emp.email || 'Staff Member';
};

export const getEmployeeInitial = (emp) => {
  const name = getEmployeeFullName(emp);
  return name ? name.charAt(0).toUpperCase() : 'E';
};
