import ProfessionalUpgrade from '../models/ProfessionalUpgrade.js';
import Employee from '../models/Employee.js';
import { HR_ADMIN_ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';

const isPrivileged = (user) => {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((r) => MANAGEMENT_ROLES.includes(r));
};

/**
 * @desc    Submit a new professional upgrade request
 * @route   POST /api/professional-upgrades
 * @access  Private (Employee / HR)
 */
export const createProfessionalUpgrade = async (req, res) => {
  try {
    const {
      employeeId,
      upgradeType,
      upgradeTitle,
      institution,
      fieldOfStudy,
      startDate,
      expectedCompletionDate,
      estimatedCost = 0,
      companySponsorshipRequested = false,
      supportingDocuments = []
    } = req.body;

    let targetEmployeeId = employeeId;

    if (!targetEmployeeId || !isPrivileged(req.user)) {
      const myEmployee = await Employee.findOne({ user: req.user._id });
      if (!myEmployee) {
        return res.status(400).json({
          success: false,
          message: 'No employee profile linked to your user account'
        });
      }
      targetEmployeeId = myEmployee._id;
    }

    if (!upgradeType || !upgradeTitle || !institution || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'upgradeType, upgradeTitle, institution, and startDate are required'
      });
    }

    const upgrade = await ProfessionalUpgrade.create({
      employee: targetEmployeeId,
      upgradeType,
      upgradeTitle,
      institution,
      fieldOfStudy,
      startDate: new Date(startDate),
      expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : undefined,
      estimatedCost: Number(estimatedCost),
      companySponsorshipRequested: Boolean(companySponsorshipRequested),
      supportingDocuments,
      requestStatus: 'pending'
    });

    const populated = await ProfessionalUpgrade.findById(upgrade._id)
      .populate('employee', 'employeeNumber name department jobTitle')
      .populate('reviewer', 'email roles');

    res.status(201).json({
      success: true,
      message: 'Professional upgrade request submitted successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all professional upgrades (filterable)
 * @route   GET /api/professional-upgrades
 * @access  Private (Management/HR)
 */
export const getProfessionalUpgrades = async (req, res) => {
  try {
    const { employee, status, upgradeType, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (employee) filter.employee = employee;
    if (status) filter.requestStatus = status;
    if (upgradeType) filter.upgradeType = upgradeType;

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      ProfessionalUpgrade.find(filter)
        .populate('employee', 'employeeNumber name department jobTitle')
        .populate('reviewer', 'email roles')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ProfessionalUpgrade.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get professional upgrades of logged-in employee
 * @route   GET /api/professional-upgrades/me
 * @access  Private (Authenticated Employee)
 */
export const getMyProfessionalUpgrades = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found for this user'
      });
    }

    const upgrades = await ProfessionalUpgrade.find({ employee: employee._id })
      .populate('reviewer', 'email roles')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: upgrades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single professional upgrade by ID
 * @route   GET /api/professional-upgrades/:id
 * @access  Private
 */
export const getProfessionalUpgradeById = async (req, res) => {
  try {
    const upgrade = await ProfessionalUpgrade.findById(req.params.id)
      .populate('employee', 'employeeNumber name department jobTitle')
      .populate('reviewer', 'email roles');

    if (!upgrade) {
      return res.status(404).json({
        success: false,
        message: 'Professional upgrade record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: upgrade
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Review/Decision on professional upgrade (approve, reject, update status)
 * @route   PATCH /api/professional-upgrades/:id/review
 * @access  Private (Management/HR)
 */
export const reviewProfessionalUpgrade = async (req, res) => {
  try {
    const { status, reviewNotes, completionDate } = req.body;

    const validStatuses = ['approved', 'rejected', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const upgrade = await ProfessionalUpgrade.findById(req.params.id);
    if (!upgrade) {
      return res.status(404).json({
        success: false,
        message: 'Professional upgrade record not found'
      });
    }

    upgrade.requestStatus = status;
    upgrade.reviewer = req.user._id;
    upgrade.reviewedAt = new Date();
    if (reviewNotes !== undefined) upgrade.reviewNotes = reviewNotes;
    if (completionDate) upgrade.completionDate = new Date(completionDate);

    await upgrade.save();

    const populated = await ProfessionalUpgrade.findById(upgrade._id)
      .populate('employee', 'employeeNumber name department jobTitle')
      .populate('reviewer', 'email roles');

    res.status(200).json({
      success: true,
      message: `Professional upgrade status updated to ${status}`,
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update a professional upgrade
 * @route   PATCH /api/professional-upgrades/:id
 * @access  Private (Owner or Management)
 */
export const updateProfessionalUpgrade = async (req, res) => {
  try {
    const upgrade = await ProfessionalUpgrade.findById(req.params.id);
    if (!upgrade) {
      return res.status(404).json({
        success: false,
        message: 'Professional upgrade record not found'
      });
    }

    const allowedUpdates = [
      'upgradeType',
      'upgradeTitle',
      'institution',
      'fieldOfStudy',
      'startDate',
      'expectedCompletionDate',
      'completionDate',
      'estimatedCost',
      'companySponsorshipRequested',
      'supportingDocuments',
      'reviewNotes'
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        upgrade[field] = req.body[field];
      }
    });

    await upgrade.save();

    const populated = await ProfessionalUpgrade.findById(upgrade._id)
      .populate('employee', 'employeeNumber name department jobTitle')
      .populate('reviewer', 'email roles');

    res.status(200).json({
      success: true,
      message: 'Professional upgrade updated successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete a professional upgrade record
 * @route   DELETE /api/professional-upgrades/:id
 * @access  Private (HR/Executive)
 */
export const deleteProfessionalUpgrade = async (req, res) => {
  try {
    const upgrade = await ProfessionalUpgrade.findById(req.params.id);
    if (!upgrade) {
      return res.status(404).json({
        success: false,
        message: 'Professional upgrade record not found'
      });
    }

    await upgrade.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Professional upgrade record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
