import JobApplication from '../models/JobApplication.js';
import JobPosting from '../models/JobPosting.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Evidence from '../models/Evidence.js';
import { ROLES } from '../constants/roles.js';
import { deleteLocalFile, formatFileUrl } from '../utils/fileUtils.js';

// @desc    Submit a job application
// @route   POST /api/recruitment/applications
// @access  Public (Applicants apply directly)
export const submitJobApplication = async (req, res) => {
  try {
    const {
      jobPostingId,
      portfolioLink,
      linkedInLink,
      coverLetter,
      yearsOfExperience,
      attachments
    } = req.body;

    const category = req.uploadCategory || 'recruitment';
    const uploadedFiles = Array.isArray(req.files)
      ? req.files
      : req.file
      ? [req.file]
      : [];

    let resume = req.body.resume;
    const primaryResumeFile =
      uploadedFiles.find((f) => f.fieldname === 'resumeFile') || uploadedFiles[0];

    if (primaryResumeFile) {
      resume = formatFileUrl(category, primaryResumeFile.filename);
    }

    // Parse applicantName if sent as JSON string or individual fields in FormData
    let parsedName = req.body.applicantName;
    if (typeof parsedName === 'string') {
      try {
        parsedName = JSON.parse(parsedName);
      } catch {}
    }
    if (!parsedName || typeof parsedName !== 'object') {
      parsedName = {
        first: req.body.firstName || req.body['applicantName.first'] || req.body.first || '',
        middle: req.body.middleName || req.body['applicantName.middle'] || req.body.middle || '',
        last: req.body.lastName || req.body['applicantName.last'] || req.body.last || ''
      };
    }

    // Parse applicantContact if sent as JSON string or individual fields in FormData
    let parsedContact = req.body.applicantContact;
    if (typeof parsedContact === 'string') {
      try {
        parsedContact = JSON.parse(parsedContact);
      } catch {}
    }
    if (!parsedContact || typeof parsedContact !== 'object') {
      parsedContact = {
        email: req.body.email || req.body['applicantContact.email'] || '',
        phoneNumber: req.body.phoneNumber || req.body.phone || req.body['applicantContact.phoneNumber'] || '',
        telegramUsername: req.body.telegramUsername || req.body['applicantContact.telegramUsername'] || ''
      };
    }

    if (!jobPostingId) {
      return res.status(400).json({
        success: false,
        message: 'jobPostingId is required'
      });
    }

    if (!parsedName.first || !parsedName.last) {
      return res.status(400).json({
        success: false,
        message: 'Applicant first and last names are required'
      });
    }

    if (!parsedContact.email || !parsedContact.phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Applicant email and phone number are required'
      });
    }

    if (!resume) {
      return res.status(400).json({
        success: false,
        message: 'Resume document/CV (file upload or URL) is required'
      });
    }

    // Validate job posting exists and is open for applications
    const job = await JobPosting.findById(jobPostingId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    if (job.postingStatus !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'This job posting is not accepting applications at this time'
      });
    }

    if (job.applicationDeadline) {
      const deadlineEnd = new Date(job.applicationDeadline);
      deadlineEnd.setHours(23, 59, 59, 999);
      if (deadlineEnd < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'The deadline for applying to this job posting has passed'
        });
      }
    }

    // Check if duplicate application with same email for this job
    const existingApplication = await JobApplication.findOne({
      jobPosting: jobPostingId,
      'applicantContact.email': parsedContact.email.toLowerCase()
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'An application with this email address has already been submitted for this position'
      });
    }

    const fileAttachments = uploadedFiles.map((f) => ({
      fileName: f.filename,
      originalName: f.originalname,
      fileUrl: formatFileUrl(category, f.filename),
      fileType: f.mimetype,
      fileSize: f.size,
      uploadedAt: new Date(),
      uploadedBy: req.user?._id || null,
      description: f.fieldname === 'resumeFile' ? 'Primary Resume / CV' : 'Supporting Application Document'
    }));

    const parsedBodyAttachments = Array.isArray(attachments) ? attachments : [];

    const application = await JobApplication.create({
      jobPosting: jobPostingId,
      applicantName: parsedName,
      applicantContact: parsedContact,
      resume,
      portfolioLink: portfolioLink || null,
      linkedInLink: linkedInLink || null,
      coverLetter: coverLetter || '',
      yearsOfExperience: Number(yearsOfExperience) || 0,
      attachments: [...fileAttachments, ...parsedBodyAttachments],
      applicationStatus: 'submitted'
    });

    // Save all uploaded documents (and external resume link if provided) into the centralized Evidence table
    const evidenceAttachments = uploadedFiles.map((f) => ({
      title: f.fieldname === 'resumeFile' ? `Resume / CV: ${f.originalname}` : f.originalname,
      description:
        f.fieldname === 'resumeFile'
          ? 'Primary Resume / CV submitted via Public Careers Portal'
          : 'Supporting document submitted via Public Careers Portal',
      fileUrl: formatFileUrl(category, f.filename),
      fileName: f.originalname,
      mimeType: f.mimetype,
      fileSize: f.size,
      uploadedBy: req.user?._id || null,
      status: 'pending'
    }));

    if (evidenceAttachments.length === 0 && resume) {
      evidenceAttachments.push({
        title: 'Resume / CV Link',
        description: 'External Resume / CV URL submitted via Public Careers Portal',
        fileUrl: resume,
        fileName: 'Resume Link',
        uploadedBy: req.user?._id || null,
        status: 'pending'
      });
    }

    if (evidenceAttachments.length > 0) {
      await Evidence.findOneAndUpdate(
        { entityType: 'JobApplication', entityId: application._id },
        {
          $setOnInsert: {
            entityType: 'JobApplication',
            entityId: application._id,
            entityOwner: req.user?._id || null
          },
          $push: { attachments: { $each: evidenceAttachments } }
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Your job application has been submitted successfully',
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

// @desc    Get all job applications with filtering and search
// @route   GET /api/recruitment/applications
// @access  Private (HR / Management)
export const getJobApplications = async (req, res) => {
  try {
    const {
      jobPostingId,
      status,
      search,
      rating,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (jobPostingId) {
      query.jobPosting = jobPostingId;
    }

    if (status) {
      query.applicationStatus = status;
    }

    if (rating) {
      query.applicantRating = { $gte: Number(rating) };
    }

    if (search) {
      query.$or = [
        { 'applicantName.first': { $regex: search, $options: 'i' } },
        { 'applicantName.last': { $regex: search, $options: 'i' } },
        { 'applicantContact.email': { $regex: search, $options: 'i' } },
        { 'applicantContact.phoneNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [applications, total] = await Promise.all([
      JobApplication.find(query)
        .populate('jobPosting', 'jobTitle department location postingStatus')
        .populate('interviews.interviewer', 'name employeeNumber jobTitle department email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      JobApplication.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: applications,
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
      message: 'Failed to retrieve applications',
      error: error.message
    });
  }
};

// @desc    Get single application by ID
// @route   GET /api/recruitment/applications/:id
// @access  Private (HR / Management)
export const getJobApplicationById = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id)
      .populate('jobPosting')
      .populate('interviews.interviewer', 'name employeeNumber jobTitle department email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve application',
      error: error.message
    });
  }
};

// @desc    Update application status, notes, or rating (Tracking)
// @route   PATCH /api/recruitment/applications/:id/status
// @access  Private (HR / Management)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationStatus, applicantRating, applicationNotes } = req.body;

    const allowedStatuses = [
      'submitted',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'interviewed',
      'offered',
      'hired',
      'rejected',
      'withdrawn'
    ];

    const updateFields = {};

    if (applicationStatus) {
      if (!allowedStatuses.includes(applicationStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
        });
      }
      updateFields.applicationStatus = applicationStatus;
    }

    if (applicantRating !== undefined) {
      updateFields.applicantRating = applicantRating;
    }

    if (applicationNotes !== undefined) {
      updateFields.applicationNotes = applicationNotes;
    }

    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate('jobPosting', 'jobTitle department location')
      .populate('interviews.interviewer', 'name employeeNumber jobTitle department');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
};

// @desc    Add file attachment(s) to existing application (click add button)
// @route   POST /api/recruitment/applications/:id/attachments
// @access  Public (with application context) or Private (HR)
export const addApplicationAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    let { fileName, originalName, fileUrl, fileType, fileSize, description } = req.body;

    if (req.file) {
      const category = req.uploadCategory || 'recruitment';
      fileUrl = formatFileUrl(category, req.file.filename);
      fileName = req.file.filename;
      originalName = req.file.originalname;
      fileType = req.file.mimetype;
      fileSize = req.file.size;
    }

    if (!fileName || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File or (fileName and fileUrl) are required'
      });
    }

    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      });
    }

    const newAttachment = {
      fileName,
      originalName: originalName || fileName,
      fileUrl,
      fileType,
      fileSize,
      description,
      uploadedAt: new Date(),
      uploadedBy: req.user ? req.user._id : undefined
    };

    application.attachments.push(newAttachment);
    await application.save();

    res.status(201).json({
      success: true,
      message: 'Attachment added successfully',
      data: application.attachments[application.attachments.length - 1],
      attachments: application.attachments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add attachment',
      error: error.message
    });
  }
};

// @desc    Remove file attachment from job application
// @route   DELETE /api/recruitment/applications/:id/attachments/:attachmentId
// @access  Private (HR / Management)
export const removeApplicationAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const application = await JobApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      });
    }

    const attachment = application.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    if (attachment.fileUrl) {
      deleteLocalFile(attachment.fileUrl);
    }

    attachment.deleteOne();
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Attachment removed successfully',
      attachments: application.attachments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove attachment',
      error: error.message
    });
  }
};

// @desc    Convert hired applicant into an Employee record (Full ERP relationship)
// @route   POST /api/recruitment/applications/:id/convert-to-employee
// @access  Private (HR Manager / Executive)
export const convertApplicantToEmployee = async (req, res) => {
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
      probationEndDate,
      createUserAccount,
      password
    } = req.body;

    const application = await JobApplication.findById(req.params.id).populate('jobPosting');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      });
    }

    // Check if employeeNumber already taken
    const existingEmployee = await Employee.findOne({ employeeNumber });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: `Employee number '${employeeNumber}' is already assigned to another employee`
      });
    }

    let createdUser = null;
    if (createUserAccount) {
      const email = application.applicantContact.email;
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: `User account with email ${email} already exists`
        });
      }

      createdUser = await User.create({
        email,
        password: password || 'Vector@2026',
        roles: [ROLES.EMPLOYEE],
        accountStatus: 'active'
      });
    }

    const employee = await Employee.create({
      employeeNumber,
      user: createdUser ? createdUser._id : undefined,
      name: {
        first: application.applicantName.first,
        middle: application.applicantName.middle || '',
        last: application.applicantName.last
      },
      email: application.applicantContact.email,
      primaryPhone: application.applicantContact.phoneNumber,
      basicSalary: basicSalary || 0,
      department: department || application.jobPosting?.department || 'General',
      jobTitle: jobTitle || application.jobPosting?.jobTitle || 'Staff',
      manager: managerId || undefined,
      employmentStatus: 'probation',
      hireDate: new Date(),
      probationEndDate: probationEndDate || undefined,
      workLocation: workLocation || application.jobPosting?.location,
      branch: branch || 'Main Branch',
      employmentType: employmentType || application.jobPosting?.employmentType || 'full-time'
    });

    // Mark application as hired
    application.applicationStatus = 'hired';
    await application.save();

    res.status(201).json({
      success: true,
      message: 'Applicant successfully converted to Employee',
      data: {
        employee,
        userAccountCreated: !!createdUser
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to convert applicant to employee',
      error: error.message
    });
  }
};

// @desc    Delete job application
// @route   DELETE /api/recruitment/applications/:id
// @access  Private (HR Manager)
export const deleteJobApplication = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      });
    }

    await application.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job application deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message
    });
  }
};
