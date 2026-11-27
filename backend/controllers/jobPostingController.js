import JobPosting from '../models/JobPosting.js';
import JobApplication from '../models/JobApplication.js';

// @desc    Get all job postings (filterable by status, department, employmentType, search)
// @route   GET /api/recruitment/jobs
// @access  Public (for published) / Private for HR management
export const getJobPostings = async (req, res) => {
  try {
    const { status, department, employmentType, experienceLevel, search, page = 1, limit = 20 } = req.query;

    const query = {};

    // If unauthenticated public request, force published status
    if (!req.user) {
      query.postingStatus = 'published';
    } else if (status) {
      query.postingStatus = status;
    }

    if (department) {
      query.department = new RegExp(department, 'i');
    }

    if (employmentType) {
      query.employmentType = employmentType;
    }

    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    if (search) {
      query.$or = [
        { jobTitle: { $regex: search, $options: 'i' } },
        { jobDescription: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, total] = await Promise.all([
      JobPosting.find(query)
        .populate('createdBy', 'email roles')
        .populate('applicationsCount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      JobPosting.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: jobs,
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
      message: 'Failed to retrieve job postings',
      error: error.message
    });
  }
};

// @desc    Get single job posting by ID
// @route   GET /api/recruitment/jobs/:id
// @access  Public / HR Management
export const getJobPostingById = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id)
      .populate('createdBy', 'email roles')
      .populate('applicationsCount');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Public users cannot see drafts or archived posts unless published
    if (!req.user && job.postingStatus !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to unpublished job posting'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job posting',
      error: error.message
    });
  }
};

// @desc    Create new job posting
// @route   POST /api/recruitment/jobs
// @access  Private (HR / Management)
export const createJobPosting = async (req, res) => {
  try {
    const {
      jobTitle,
      department,
      location,
      employmentType,
      experienceLevel,
      jobDescription,
      jobRequirements,
      postingStatus,
      numberOfOpenings,
      applicationDeadline
    } = req.body;

    const job = await JobPosting.create({
      jobTitle,
      department,
      location,
      employmentType,
      experienceLevel,
      jobDescription,
      jobRequirements: Array.isArray(jobRequirements) ? jobRequirements : [],
      postingStatus: postingStatus || 'draft',
      numberOfOpenings: numberOfOpenings || 1,
      applicationDeadline,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create job posting',
      error: error.message
    });
  }
};

// @desc    Update job posting
// @route   PUT /api/recruitment/jobs/:id
// @access  Private (HR / Management)
export const updateJobPosting = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const updatedJob = await JobPosting.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('createdBy', 'email roles');

    res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      data: updatedJob
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update job posting',
      error: error.message
    });
  }
};

// @desc    Change status of job posting (publish, close, hold, archive)
// @route   PATCH /api/recruitment/jobs/:id/status
// @access  Private (HR / Management)
export const updateJobPostingStatus = async (req, res) => {
  try {
    const status = req.body.status || req.body.postingStatus;
    const allowedStatuses = ['draft', 'published', 'closed', 'on_hold', 'archived'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const job = await JobPosting.findByIdAndUpdate(
      req.params.id,
      { postingStatus: status },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Job posting status changed to ${status}`,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

// @desc    Delete job posting
// @route   DELETE /api/recruitment/jobs/:id
// @access  Private (HR Manager / Executive)
export const deleteJobPosting = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Cascade delete associated job applications
    await JobApplication.deleteMany({ jobPosting: job._id });
    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job posting and its related applications removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete job posting',
      error: error.message
    });
  }
};
