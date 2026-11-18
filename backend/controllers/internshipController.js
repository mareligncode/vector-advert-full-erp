import Internship from '../models/Internship.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { ROLES } from '../constants/roles.js';

// Helper to auto-generate internship number (e.g., INT-2026-0001)
const generateInternshipNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Internship.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `INT-${year}-${sequence}`;
};

// @desc    Get all internships with filtering, search, and pagination
// @route   GET /api/internships
// @access  Private (HR / Management)
export const getInternships = async (req, res) => {
  try {
    const {
      status,
      type,
      department,
      supervisorId,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (status) {
      query['placement.status'] = status;
    }

    if (type) {
      query.type = type;
    }

    if (department) {
      query['placement.assignedDepartment'] = new RegExp(department, 'i');
    }

    if (supervisorId) {
      query['placement.supervisor'] = supervisorId;
    }

    if (search) {
      query.$or = [
        { internshipNumber: { $regex: search, $options: 'i' } },
        { 'name.first': { $regex: search, $options: 'i' } },
        { 'name.last': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'academicProfile.university': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [internships, total] = await Promise.all([
      Internship.find(query)
        .populate('placement.supervisor', 'name employeeNumber jobTitle department email')
        .populate('user', 'email roles accountStatus')
        .populate('evaluations.evaluatedBy', 'name employeeNumber jobTitle')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Internship.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: internships,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve internships',
      error: error.message
    });
  }
};

// @desc    Get single internship by ID
// @route   GET /api/internships/:id
// @access  Private (HR / Supervisor / Intern themselves)
export const getInternshipById = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('placement.supervisor', 'name employeeNumber jobTitle department email phone')
      .populate('user', 'email roles accountStatus')
      .populate('evaluations.evaluatedBy', 'name employeeNumber jobTitle');

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: internship
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve internship record',
      error: error.message
    });
  }
};

// @desc    Register a new internship profile
// @route   POST /api/internships
// @access  Private (HR / Management)
export const createInternship = async (req, res) => {
  try {
    const {
      internshipNumber,
      name,
      gender,
      phone,
      email,
      address,
      emergencyContact,
      type,
      stipendAmount,
      academicProfile,
      placement,
      documents,
      notes,
      createUserAccount,
      password
    } = req.body;

    const finalNumber = internshipNumber || (await generateInternshipNumber());

    // Check if email already used in internships
    const existing = await Internship.findOne({
      $or: [{ email: email.toLowerCase() }, { internshipNumber: finalNumber }]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An intern with this email or internship number already exists'
      });
    }

    let createdUser = null;
    if (createUserAccount) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: `User account with email ${email} already exists`
        });
      }

      createdUser = await User.create({
        email: email.toLowerCase(),
        password: password || 'Intern@Vector2026',
        roles: [ROLES.INTERN],
        accountStatus: 'active'
      });
    }

    const internship = await Internship.create({
      internshipNumber: finalNumber,
      user: createdUser ? createdUser._id : undefined,
      name,
      gender,
      phone,
      email: email.toLowerCase(),
      address,
      emergencyContact,
      type: type || 'tutorial',
      stipendAmount: stipendAmount || 0,
      academicProfile,
      placement: {
        ...placement,
        status: placement?.status || 'active'
      },
      documents: Array.isArray(documents) ? documents : [],
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Internship record created successfully',
      data: internship
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create internship record',
      error: error.message
    });
  }
};

// @desc    Update internship details
// @route   PUT /api/internships/:id
// @access  Private (HR / Management)
export const updateInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship record not found'
      });
    }

    const updatedInternship = await Internship.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('placement.supervisor', 'name employeeNumber jobTitle')
      .populate('user', 'email roles');

    res.status(200).json({
      success: true,
      message: 'Internship updated successfully',
      data: updatedInternship
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update internship record',
      error: error.message
    });
  }
};

// @desc    Add document attachment to internship record (click add button)
// @route   POST /api/internships/:id/documents
// @access  Private (HR / Management)
export const addInternshipDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, originalName, fileUrl, fileType, fileSize, description } = req.body;

    if (!fileName || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'fileName and fileUrl are required'
      });
    }

    const internship = await Internship.findById(id);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship record not found'
      });
    }

    const newDoc = {
      fileName,
      originalName: originalName || fileName,
      fileUrl,
      fileType,
      fileSize,
      description,
      uploadedAt: new Date(),
      uploadedBy: req.user ? req.user._id : undefined
    };

    internship.documents.push(newDoc);
    await internship.save();

    res.status(201).json({
      success: true,
      message: 'Document attachment added successfully',
      data: internship.documents[internship.documents.length - 1],
      documents: internship.documents
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add document attachment',
      error: error.message
    });
  }
};

// @desc    Remove document attachment from internship record
// @route   DELETE /api/internships/:id/documents/:documentId
// @access  Private (HR / Management)
export const removeInternshipDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;
    const internship = await Internship.findById(id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship record not found'
      });
    }

    const doc = internship.documents.id(documentId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document attachment not found'
      });
    }

    doc.deleteOne();
    await internship.save();

    res.status(200).json({
      success: true,
      message: 'Document attachment deleted successfully',
      documents: internship.documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};

// @desc    Update placement and internship status (applied, active, completed, terminated, etc.)
// @route   PATCH /api/internships/:id/status
// @access  Private (HR / Management)
export const updateInternshipStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowed = ['applied', 'active', 'completed', 'terminated', 'withdrawn', 'converted_to_employee'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowed.join(', ')}`
      });
    }

    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship record not found'
      });
    }

    internship.placement.status = status;
    if (note) {
      internship.notes = internship.notes ? `${internship.notes}\n${note}` : note;
    }

    await internship.save();

    res.status(200).json({
      success: true,
      message: `Internship status changed to ${status}`,
      data: internship
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update internship status',
      error: error.message
    });
  }
};

// @desc    Add evaluation or performance review to internship
// @route   POST /api/internships/:id/evaluations
// @access  Private (HR / Supervisor)
export const addInternshipEvaluation = async (req, res) => {
  try {
    const { score, feedback, certificateIssued, certificateUrl, evaluatedBy, attachments } = req.body;

    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship record not found'
      });
    }

    const evaluation = {
      evaluationDate: new Date(),
      evaluatedBy: evaluatedBy || undefined,
      score: Number(score),
      feedback,
      certificateIssued: !!certificateIssued,
      certificateUrl,
      evaluationAttachments: Array.isArray(attachments) ? attachments : []
    };

    internship.evaluations.push(evaluation);
    await internship.save();

    const populated = await Internship.findById(internship._id).populate(
      'evaluations.evaluatedBy',
      'name employeeNumber jobTitle'
    );

    res.status(201).json({
      success: true,
      message: 'Evaluation added successfully',
      data: populated.evaluations[populated.evaluations.length - 1],
      internship: populated
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add evaluation',
      error: error.message
    });
  }
};

// @desc    Convert intern to full-time/probationary Employee
// @route   POST /api/internships/:id/convert-to-employee
// @access  Private (HR Manager / Executive)
export const convertInternToEmployee = async (req, res) => {
  try {
    const {
      employeeNumber,
      basicSalary,
      jobTitle,
      department,
      managerId,
      workLocation,
      branch,
      employmentType,
      probationEndDate
    } = req.body;

    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship record not found'
      });
    }

    const existingEmployee = await Employee.findOne({ employeeNumber });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: `Employee number ${employeeNumber} is already taken`
      });
    }

    // If intern has linked user account, upgrade roles
    let linkedUserId = internship.user;
    if (linkedUserId) {
      await User.findByIdAndUpdate(linkedUserId, {
        $addToSet: { roles: ROLES.EMPLOYEE },
        $pull: { roles: ROLES.INTERN }
      });
    }

    const employee = await Employee.create({
      employeeNumber,
      user: linkedUserId || undefined,
      name: internship.name,
      gender: internship.gender,
      email: internship.email,
      primaryPhone: internship.phone,
      homeAddress: internship.address,
      emergencyContacts: internship.emergencyContact?.name
        ? [internship.emergencyContact]
        : [],
      basicSalary: basicSalary || 0,
      department: department || internship.placement?.assignedDepartment || 'General',
      jobTitle: jobTitle || internship.placement?.internshipPosition || 'Junior Staff',
      manager: managerId || internship.placement?.supervisor || undefined,
      employmentStatus: 'probation',
      hireDate: new Date(),
      probationEndDate: probationEndDate || undefined,
      workLocation: workLocation || 'Head Office',
      branch: branch || 'Main Branch',
      employmentType: employmentType || 'full-time'
    });

    // Mark internship status as converted_to_employee
    internship.placement.status = 'converted_to_employee';
    await internship.save();

    res.status(201).json({
      success: true,
      message: 'Intern successfully converted into Employee',
      data: employee
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to convert intern to employee',
      error: error.message
    });
  }
};

// @desc    Delete internship record
// @route   DELETE /api/internships/:id
// @access  Private (HR Manager)
export const deleteInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship record not found'
      });
    }

    await internship.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Internship record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete internship record',
      error: error.message
    });
  }
};
