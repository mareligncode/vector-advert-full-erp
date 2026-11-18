import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import { ALL_ROLES, ROLES, HR_ADMIN_ROLES } from '../constants/roles.js';
import { deleteLocalFile, formatFileUrl } from '../utils/fileUtils.js';

/**
 * Helper: Generate next sequential employee number (e.g., EMP-0001)
 */
const generateEmployeeNumber = async () => {
  const latestEmployee = await Employee.findOne({ employeeNumber: /^EMP-\d+$/ })
    .sort({ createdAt: -1 })
    .select('employeeNumber');

  if (latestEmployee && latestEmployee.employeeNumber) {
    const match = latestEmployee.employeeNumber.match(/^EMP-(\d+)$/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `EMP-${String(nextNum).padStart(4, '0')}`;
    }
  }

  const count = await Employee.countDocuments();
  return `EMP-${String(count + 1).padStart(4, '0')}`;
};

/**
 * Helper: Check if user has HR or Admin privileges
 */
const isHrOrAdmin = (user) => {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((role) => HR_ADMIN_ROLES.includes(role));
};

/**
 * @desc    Create a new employee profile
 * @route   POST /api/employees
 * @access  Private (HR/Admin)
 */
export const createEmployee = async (req, res) => {
  try {
    let { employeeNumber, ...employeeData } = req.body;

    if (!employeeData.name || !employeeData.name.first || !employeeData.name.last) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
    }

    if (!employeeData.primaryPhone) {
      return res.status(400).json({
        success: false,
        message: 'Primary phone number is required'
      });
    }

    // Auto-generate employee number if not provided
    if (!employeeNumber || employeeNumber.trim() === '') {
      employeeNumber = await generateEmployeeNumber();
    } else {
      const existing = await Employee.findOne({ employeeNumber: employeeNumber.trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Employee number '${employeeNumber}' already exists`
        });
      }
      employeeNumber = employeeNumber.trim();
    }

    // Validate linked user if supplied
    if (employeeData.user) {
      const userExists = await User.findById(employeeData.user);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'The specified user account does not exist'
        });
      }

      const alreadyLinked = await Employee.findOne({ user: employeeData.user });
      if (alreadyLinked) {
        return res.status(400).json({
          success: false,
          message: `This user account is already linked to employee ${alreadyLinked.employeeNumber}`
        });
      }
    }

    // Optional inline user provisioning
    let createdUser = null;
    if (req.body.createUser) {
      const { password, roles } = req.body.createUser;
      const userEmail = req.body.createUser.email || employeeData.email;

      if (!userEmail || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required to create a user account for this employee'
        });
      }

      const existingUser = await User.findOne({ email: userEmail.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `A user account with email '${userEmail}' already exists`
        });
      }

      let userRoles = [ROLES.EMPLOYEE];
      if (roles && Array.isArray(roles) && roles.length > 0) {
        const invalidRoles = roles.filter((r) => !ALL_ROLES.includes(r));
        if (invalidRoles.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid role(s): ${invalidRoles.join(', ')}`
          });
        }
        userRoles = roles;
      }

      createdUser = await User.create({
        email: userEmail.toLowerCase(),
        password,
        roles: userRoles
      });

      employeeData.user = createdUser._id;
    }

    const employee = await Employee.create({
      ...employeeData,
      employeeNumber
    });

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('user', 'email roles accountStatus lastLoginTime')
      .populate('manager', 'name employeeNumber jobTitle department email');

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: populatedEmployee,
      createdUser: createdUser ? { _id: createdUser._id, email: createdUser.email, roles: createdUser.roles } : undefined
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all employees with pagination, search, and filtering
 * @route   GET /api/employees
 * @access  Private (Authenticated users - financial data redacted for non-HR)
 */
export const getEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      department,
      jobTitle,
      employmentStatus,
      employmentType,
      branch,
      workLocation,
      isLinked,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (department) {
      query.department = new RegExp(department, 'i');
    }

    if (jobTitle) {
      query.jobTitle = new RegExp(jobTitle, 'i');
    }

    if (employmentStatus) {
      query.employmentStatus = employmentStatus;
    }

    if (employmentType) {
      query.employmentType = employmentType;
    }

    if (branch) {
      query.branch = new RegExp(branch, 'i');
    }

    if (workLocation) {
      query.workLocation = new RegExp(workLocation, 'i');
    }

    if (isLinked === 'true') {
      query.user = { $ne: null };
    } else if (isLinked === 'false') {
      query.user = null;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { employeeNumber: searchRegex },
        { 'name.first': searchRegex },
        { 'name.middle': searchRegex },
        { 'name.last': searchRegex },
        { email: searchRegex },
        { primaryPhone: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Financial privacy: redact salary and bank accounts for non-HR users
    const hasHrPrivileges = isHrOrAdmin(req.user);
    let selectFields = '';
    if (!hasHrPrivileges) {
      selectFields = '-basicSalary -bankAccounts';
    }

    const [total, employees] = await Promise.all([
      Employee.countDocuments(query),
      Employee.find(query)
        .select(selectFields)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'email roles accountStatus')
        .populate('manager', 'name employeeNumber jobTitle')
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      count: employees.length,
      data: employees
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get currently logged-in user's employee profile
 * @route   GET /api/employees/me
 * @access  Private (Authenticated)
 */
export const getMeEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
      .populate('user', 'email roles accountStatus lastLoginTime')
      .populate('manager', 'name employeeNumber jobTitle department email primaryPhone')
      .populate('nationalId.approvedBy', 'email roles')
      .populate('guarantors.nationalId.approvedBy', 'email roles')
      .populate('employeeDocuments.approvedBy', 'email roles');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile is currently linked to your user account'
      });
    }

    return res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single employee by ID or employeeNumber
 * @route   GET /api/employees/:id
 * @access  Private (Authenticated)
 */
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const query = isObjectId ? { _id: id } : { employeeNumber: id };

    let employeeQuery = Employee.findOne(query)
      .populate('user', 'email roles accountStatus lastLoginTime')
      .populate('manager', 'name employeeNumber jobTitle department email primaryPhone')
      .populate('nationalId.approvedBy', 'email roles')
      .populate('guarantors.nationalId.approvedBy', 'email roles')
      .populate('employeeDocuments.approvedBy', 'email roles');

    const hasHrPrivileges = isHrOrAdmin(req.user);

    const employee = await employeeQuery;
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if requester is self or has HR privileges
    const isSelf = employee.user && employee.user._id.toString() === req.user._id.toString();
    if (!hasHrPrivileges && !isSelf) {
      employee.basicSalary = undefined;
      employee.bankAccounts = undefined;
    }

    return res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update employee details
 * @route   PUT /api/employees/:id
 * @access  Private (HR/Admin)
 */
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Prevent changing employeeNumber to an already occupied number
    if (req.body.employeeNumber && req.body.employeeNumber !== employee.employeeNumber) {
      const existing = await Employee.findOne({ employeeNumber: req.body.employeeNumber });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Employee number '${req.body.employeeNumber}' is already in use`
        });
      }
    }

    // Prevent changing user link to a user that is linked to another employee
    if (req.body.user && req.body.user.toString() !== (employee.user ? employee.user.toString() : '')) {
      const userAssigned = await Employee.findOne({
        user: req.body.user,
        _id: { $ne: employee._id }
      });
      if (userAssigned) {
        return res.status(400).json({
          success: false,
          message: `User is already linked to employee ${userAssigned.employeeNumber}`
        });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    )
      .populate('user', 'email roles accountStatus')
      .populate('manager', 'name employeeNumber jobTitle department email');

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update employment status
 * @route   PATCH /api/employees/:id/status
 * @access  Private (HR/Admin)
 */
export const updateEmploymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, contractEndDate, probationEndDate } = req.body;

    const allowedStatuses = ['active', 'probation', 'suspended', 'terminated', 'resigned', 'on_leave'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
      });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    employee.employmentStatus = status;
    if (contractEndDate) employee.contractEndDate = contractEndDate;
    if (probationEndDate) employee.probationEndDate = probationEndDate;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: `Employment status updated to '${status}'`,
      data: employee
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete employee profile
 * @route   DELETE /api/employees/:id
 * @access  Private (Executive / HR Manager / Super Admin)
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await Employee.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Employee ${employee.employeeNumber} deleted successfully`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Link an existing User account to an Employee profile
 * @route   POST /api/employees/:id/link-user
 * @access  Private (HR/Admin)
 */
export const linkUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    const [employee, targetUser] = await Promise.all([
      Employee.findById(id),
      User.findById(userId)
    ]);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // Verify user is not already linked to another employee
    const existingLink = await Employee.findOne({
      user: userId,
      _id: { $ne: employee._id }
    });

    if (existingLink) {
      return res.status(400).json({
        success: false,
        message: `This user account is already linked to employee ${existingLink.employeeNumber}`
      });
    }

    employee.user = targetUser._id;
    await employee.save();

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('user', 'email roles accountStatus lastLoginTime');

    return res.status(200).json({
      success: true,
      message: 'User account linked to employee successfully',
      data: populatedEmployee
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Create a new User account and link it directly to this Employee
 * @route   POST /api/employees/:id/create-user
 * @access  Private (HR/Admin)
 */
export const createAndLinkUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, roles } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee.user) {
      return res.status(400).json({
        success: false,
        message: 'This employee already has a linked user account'
      });
    }

    const email = req.body.email || employee.email;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required to create a user account'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `A user account with email '${email}' already exists`
      });
    }

    let userRoles = [ROLES.EMPLOYEE];
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const invalidRoles = roles.filter((r) => !ALL_ROLES.includes(r));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid role(s): ${invalidRoles.join(', ')}`
        });
      }
      userRoles = roles;
    }

    const newUser = await User.create({
      email: email.toLowerCase(),
      password,
      roles: userRoles
    });

    employee.user = newUser._id;
    await employee.save();

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('user', 'email roles accountStatus lastLoginTime');

    return res.status(201).json({
      success: true,
      message: 'User account created and linked successfully',
      data: populatedEmployee,
      user: {
        _id: newUser._id,
        email: newUser.email,
        roles: newUser.roles,
        accountStatus: newUser.accountStatus
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Unlink user account from employee profile
 * @route   POST /api/employees/:id/unlink-user
 * @access  Private (HR/Admin)
 */
export const unlinkUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (!employee.user) {
      return res.status(400).json({
        success: false,
        message: 'This employee does not have any linked user account'
      });
    }

    employee.user = null;
    await employee.save();

    return res.status(200).json({
      success: true,
      message: 'User account unlinked successfully',
      data: employee
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Upload or update employee profile photo
 * @route   POST /api/employees/:id/profile-photo
 * @access  Private (HR/Admin or Self)
 */
export const uploadProfilePhoto = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const isSelf = employee.user && employee.user.toString() === req.user._id.toString();
    if (!isHrOrAdmin(req.user) && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this employee profile photo'
      });
    }

    let fileUrl = req.body.fileUrl;
    if (req.file) {
      const category = req.uploadCategory || 'employees';
      fileUrl = formatFileUrl(category, req.file.filename);
    }

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Photo file or fileUrl is required'
      });
    }

    // Delete existing old profile photo if local
    if (employee.profilePhoto && employee.profilePhoto.startsWith('/uploads/')) {
      deleteLocalFile(employee.profilePhoto);
    }

    employee.profilePhoto = fileUrl;
    await employee.save();

    return res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully',
      data: {
        profilePhoto: employee.profilePhoto
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Remove employee profile photo
 * @route   DELETE /api/employees/:id/profile-photo
 * @access  Private (HR/Admin or Self)
 */
export const removeProfilePhoto = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const isSelf = employee.user && employee.user.toString() === req.user._id.toString();
    if (!isHrOrAdmin(req.user) && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this employee profile photo'
      });
    }

    if (employee.profilePhoto) {
      deleteLocalFile(employee.profilePhoto);
      employee.profilePhoto = undefined;
      await employee.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Profile photo removed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Upload front & back photos for Employee National ID
 * @route   POST /api/employees/:id/national-id/photos
 * @access  Private (HR/Admin or Self)
 */
export const uploadNationalIdPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const isSelf = employee.user && employee.user.toString() === req.user._id.toString();
    if (!isHrOrAdmin(req.user) && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload National ID for this employee'
      });
    }

    if (!employee.nationalId) {
      employee.nationalId = {};
    }

    if (req.files) {
      if (req.files.frontImage && req.files.frontImage[0]) {
        if (employee.nationalId.frontImageUrl) deleteLocalFile(employee.nationalId.frontImageUrl);
        employee.nationalId.frontImageUrl = formatFileUrl('national-ids', req.files.frontImage[0].filename);
      }
      if (req.files.backImage && req.files.backImage[0]) {
        if (employee.nationalId.backImageUrl) deleteLocalFile(employee.nationalId.backImageUrl);
        employee.nationalId.backImageUrl = formatFileUrl('national-ids', req.files.backImage[0].filename);
      }
    }

    if (req.body.frontImageUrl) employee.nationalId.frontImageUrl = req.body.frontImageUrl;
    if (req.body.backImageUrl) employee.nationalId.backImageUrl = req.body.backImageUrl;
    if (req.body.fanNumber) employee.nationalId.fanNumber = req.body.fanNumber;
    if (req.body.finNumber) employee.nationalId.finNumber = req.body.finNumber;

    employee.nationalId.status = 'pending';
    employee.nationalId.approvedBy = undefined;
    employee.nationalId.approvedAt = undefined;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: 'National ID photos uploaded successfully and awaiting review',
      data: employee.nationalId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Add a document to employee profile
 * @route   POST /api/employees/:id/documents
 * @access  Private (HR/Admin or Self)
 */
export const addDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type } = req.body;

    let fileUrl = req.body.fileUrl;
    if (req.file) {
      const category = req.uploadCategory || 'employees';
      fileUrl = formatFileUrl(category, req.file.filename);
    }

    if (!title || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title and file (or fileUrl) are required'
      });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Permission: HR/Admin or self
    const isSelf = employee.user && employee.user.toString() === req.user._id.toString();
    if (!isHrOrAdmin(req.user) && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to upload documents for this employee'
      });
    }

    const newDoc = {
      title,
      type,
      fileUrl,
      uploadedAt: new Date(),
      status: 'pending'
    };

    employee.employeeDocuments.push(newDoc);
    await employee.save();

    const createdDoc = employee.employeeDocuments[employee.employeeDocuments.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully and awaiting review',
      data: createdDoc
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete a document from employee profile
 * @route   DELETE /api/employees/:id/documents/:documentId
 * @access  Private (HR/Admin)
 */
export const removeDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const docIndex = employee.employeeDocuments.findIndex(
      (d) => d._id.toString() === documentId
    );

    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const doc = employee.employeeDocuments[docIndex];
    if (doc && doc.fileUrl) {
      deleteLocalFile(doc.fileUrl);
    }

    employee.employeeDocuments.splice(docIndex, 1);
    await employee.save();

    return res.status(200).json({
      success: true,
      message: 'Document removed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Approve or reject an employee document
 * @route   PATCH /api/employees/:id/documents/:documentId/approve
 * @access  Private (HR/Admin)
 */
export const approveDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'"
      });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const doc = employee.employeeDocuments.id(documentId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    doc.status = status;
    doc.approvedBy = req.user._id;
    doc.approvedAt = new Date();
    doc.rejectionReason = status === 'rejected' ? rejectionReason || 'Document rejected by reviewer' : null;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: `Document has been ${status}`,
      data: doc
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Approve or reject employee's Fayda National ID
 * @route   PATCH /api/employees/:id/national-id/approve
 * @access  Private (HR/Admin)
 */
export const approveNationalId = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'"
      });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (!employee.nationalId) {
      return res.status(400).json({
        success: false,
        message: 'Employee has no National ID details recorded'
      });
    }

    employee.nationalId.status = status;
    employee.nationalId.approvedBy = req.user._id;
    employee.nationalId.approvedAt = new Date();
    employee.nationalId.rejectionReason = status === 'rejected' ? rejectionReason || 'National ID rejected by reviewer' : null;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: `National ID has been ${status}`,
      data: employee.nationalId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Approve or reject a guarantor's National ID
 * @route   PATCH /api/employees/:id/guarantors/:guarantorId/national-id/approve
 * @access  Private (HR/Admin)
 */
export const approveGuarantorNationalId = async (req, res) => {
  try {
    const { id, guarantorId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'"
      });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const guarantor = employee.guarantors.id(guarantorId);
    if (!guarantor) {
      return res.status(404).json({
        success: false,
        message: 'Guarantor not found'
      });
    }

    if (!guarantor.nationalId) {
      return res.status(400).json({
        success: false,
        message: 'Guarantor has no National ID details recorded'
      });
    }

    guarantor.nationalId.status = status;
    guarantor.nationalId.approvedBy = req.user._id;
    guarantor.nationalId.approvedAt = new Date();
    guarantor.nationalId.rejectionReason = status === 'rejected' ? rejectionReason || 'Guarantor National ID rejected' : null;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: `Guarantor National ID has been ${status}`,
      data: guarantor.nationalId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
