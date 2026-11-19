import Training from '../models/Training.js';
import Employee from '../models/Employee.js';

/**
 * @desc    Create a new training session
 * @route   POST /api/trainings
 * @access  Private (Management/HR)
 */
export const createTraining = async (req, res) => {
  try {
    const {
      title,
      description,
      trainingType = 'internal',
      trainerName,
      provider,
      department = [],
      location,
      startDate,
      endDate,
      duration,
      budget = 0,
      status = 'planned',
      attachments = [],
      note,
      participants = []
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'title, startDate, and endDate are required'
      });
    }

    const training = await Training.create({
      title,
      description,
      trainingType,
      trainerName,
      provider,
      department,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration,
      budget: Number(budget),
      status,
      attachments,
      note,
      participants
    });

    const populated = await Training.findById(training._id).populate(
      'participants.employee',
      'employeeNumber name department jobTitle'
    );

    res.status(201).json({
      success: true,
      message: 'Training created successfully',
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
 * @desc    Get all trainings (filterable)
 * @route   GET /api/trainings
 * @access  Private
 */
export const getTrainings = async (req, res) => {
  try {
    const { status, trainingType, department, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (trainingType) filter.trainingType = trainingType;
    if (department) filter.department = department;

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Training.find(filter)
        .populate('participants.employee', 'employeeNumber name department jobTitle')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Training.countDocuments(filter)
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
 * @desc    Get trainings where current employee is a participant
 * @route   GET /api/trainings/my-trainings
 * @access  Private (Employee)
 */
export const getMyTrainings = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found for this user'
      });
    }

    const trainings = await Training.find({ 'participants.employee': employee._id })
      .populate('participants.employee', 'employeeNumber name department jobTitle')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      data: trainings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single training by ID
 * @route   GET /api/trainings/:id
 * @access  Private
 */
export const getTrainingById = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id).populate(
      'participants.employee',
      'employeeNumber name department jobTitle'
    );

    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: training
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update training details
 * @route   PATCH /api/trainings/:id
 * @access  Private (Management/HR)
 */
export const updateTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training record not found'
      });
    }

    const allowedFields = [
      'title',
      'description',
      'trainingType',
      'trainerName',
      'provider',
      'department',
      'location',
      'startDate',
      'endDate',
      'duration',
      'budget',
      'status',
      'attachments',
      'note'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'startDate' || field === 'endDate') {
          training[field] = new Date(req.body[field]);
        } else {
          training[field] = req.body[field];
        }
      }
    });

    await training.save();

    const populated = await Training.findById(training._id).populate(
      'participants.employee',
      'employeeNumber name department jobTitle'
    );

    res.status(200).json({
      success: true,
      message: 'Training updated successfully',
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
 * @desc    Delete a training
 * @route   DELETE /api/trainings/:id
 * @access  Private (HR/Executive)
 */
export const deleteTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training record not found'
      });
    }

    await training.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Training deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Add a participant to training
 * @route   POST /api/trainings/:id/participants
 * @access  Private (Management/HR)
 */
export const addParticipant = async (req, res) => {
  try {
    const { employeeId, remarks } = req.body;
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'employeeId is required'
      });
    }

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training record not found'
      });
    }

    const alreadyAdded = training.participants.some(
      (p) => p.employee.toString() === employeeId.toString()
    );
    if (alreadyAdded) {
      return res.status(400).json({
        success: false,
        message: 'Employee is already enrolled in this training'
      });
    }

    training.participants.push({
      employee: employeeId,
      remarks,
      joinedAt: new Date()
    });

    await training.save();

    const populated = await Training.findById(training._id).populate(
      'participants.employee',
      'employeeNumber name department jobTitle'
    );

    res.status(200).json({
      success: true,
      message: 'Participant added successfully',
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
 * @desc    Update a participant's details, attendance, completion status, score, or certificate
 * @route   PATCH /api/trainings/:id/participants/:participantId
 * @access  Private (Management/HR)
 */
export const updateParticipant = async (req, res) => {
  try {
    const { completionStatus, certificateUrl, score, remarks, completedAt, attendanceItem } = req.body;

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training record not found'
      });
    }

    const participant = training.participants.id(req.params.participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant record not found'
      });
    }

    if (completionStatus !== undefined) participant.completionStatus = completionStatus;
    if (certificateUrl !== undefined) participant.certificateUrl = certificateUrl;
    if (score !== undefined) participant.score = Number(score);
    if (remarks !== undefined) participant.remarks = remarks;
    if (completedAt !== undefined) participant.completedAt = new Date(completedAt);

    // If adding an attendance record
    if (attendanceItem && attendanceItem.date) {
      participant.attendance.push({
        date: new Date(attendanceItem.date),
        status: attendanceItem.status || 'present'
      });
    }

    await training.save();

    const populated = await Training.findById(training._id).populate(
      'participants.employee',
      'employeeNumber name department jobTitle'
    );

    res.status(200).json({
      success: true,
      message: 'Participant updated successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
