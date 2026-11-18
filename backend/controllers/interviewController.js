import JobApplication from '../models/JobApplication.js';
import Employee from '../models/Employee.js';

// @desc    Schedule an interview for an applicant
// @route   POST /api/recruitment/applications/:id/interviews
// @access  Private (HR / Management)
export const scheduleInterview = async (req, res) => {
  try {
    const {
      interviewFormat,
      scheduledDate,
      interviewLocation,
      onlineMeetingLink,
      meetingLinkSendingStatus,
      interviewerId,
      interviewNotes
    } = req.body;

    const application = await JobApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      });
    }

    if (interviewerId) {
      const interviewer = await Employee.findById(interviewerId);
      if (!interviewer) {
        return res.status(400).json({
          success: false,
          message: 'Specified interviewer employee record does not exist'
        });
      }
    }

    const newInterview = {
      interviewFormat: interviewFormat || 'in-person',
      scheduledDate: new Date(scheduledDate),
      interviewLocation,
      onlineMeetingLink,
      meetingLinkSendingStatus: meetingLinkSendingStatus || 'pending',
      interviewer: interviewerId || undefined,
      interviewStatus: 'scheduled',
      interviewFeedback: interviewNotes || ''
    };

    application.interviews.push(newInterview);
    application.applicationStatus = 'interview_scheduled';
    await application.save();

    const populatedApp = await JobApplication.findById(application._id)
      .populate('interviews.interviewer', 'name employeeNumber jobTitle department email');

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: populatedApp.interviews[populatedApp.interviews.length - 1],
      application: populatedApp
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to schedule interview',
      error: error.message
    });
  }
};

// @desc    Get all interviews across all candidates (interview calendar / dashboard)
// @route   GET /api/recruitment/interviews
// @access  Private (HR / Management)
export const getAllInterviews = async (req, res) => {
  try {
    const { status, interviewerId, startDate, endDate } = req.query;

    const pipeline = [
      { $unwind: '$interviews' },
      {
        $lookup: {
          from: 'jobpostings',
          localField: 'jobPosting',
          foreignField: '_id',
          as: 'jobPosting'
        }
      },
      { $unwind: { path: '$jobPosting', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'employees',
          localField: 'interviews.interviewer',
          foreignField: '_id',
          as: 'interviewer'
        }
      },
      { $unwind: { path: '$interviewer', preserveNullAndEmptyArrays: true } }
    ];

    const matchConditions = {};

    if (status) {
      matchConditions['interviews.interviewStatus'] = status;
    }

    if (interviewerId) {
      matchConditions['interviews.interviewer'] = interviewerId;
    }

    if (startDate || endDate) {
      matchConditions['interviews.scheduledDate'] = {};
      if (startDate) matchConditions['interviews.scheduledDate'].$gte = new Date(startDate);
      if (endDate) matchConditions['interviews.scheduledDate'].$lte = new Date(endDate);
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    pipeline.push({
      $project: {
        applicationId: '$_id',
        applicantName: '$applicantName',
        applicantContact: '$applicantContact',
        jobPosting: {
          _id: '$jobPosting._id',
          jobTitle: '$jobPosting.jobTitle',
          department: '$jobPosting.department'
        },
        interview: '$interviews',
        interviewer: {
          _id: '$interviewer._id',
          name: '$interviewer.name',
          employeeNumber: '$interviewer.employeeNumber',
          jobTitle: '$interviewer.jobTitle',
          email: '$interviewer.email'
        }
      }
    });

    pipeline.push({ $sort: { 'interview.scheduledDate': 1 } });

    const interviews = await JobApplication.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve interviews',
      error: error.message
    });
  }
};

// @desc    Update interview details (reschedule, send link, etc.)
// @route   PUT /api/recruitment/applications/:applicationId/interviews/:interviewId
// @access  Private (HR / Management)
export const updateInterview = async (req, res) => {
  try {
    const { applicationId, interviewId } = req.params;
    const application = await JobApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      });
    }

    const interview = application.interviews.id(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview round not found'
      });
    }

    const {
      interviewFormat,
      scheduledDate,
      interviewLocation,
      onlineMeetingLink,
      meetingLinkSendingStatus,
      interviewerId,
      interviewStatus
    } = req.body;

    if (interviewFormat !== undefined) interview.interviewFormat = interviewFormat;
    if (scheduledDate !== undefined) interview.scheduledDate = new Date(scheduledDate);
    if (interviewLocation !== undefined) interview.interviewLocation = interviewLocation;
    if (onlineMeetingLink !== undefined) interview.onlineMeetingLink = onlineMeetingLink;
    if (meetingLinkSendingStatus !== undefined) interview.meetingLinkSendingStatus = meetingLinkSendingStatus;
    if (interviewerId !== undefined) interview.interviewer = interviewerId;
    if (interviewStatus !== undefined) interview.interviewStatus = interviewStatus;

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Interview updated successfully',
      data: interview
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update interview',
      error: error.message
    });
  }
};

// @desc    Submit interview evaluation & hiring feedback
// @route   PATCH /api/recruitment/applications/:applicationId/interviews/:interviewId/feedback
// @access  Private (HR / Management / Assigned Interviewer)
export const submitInterviewFeedback = async (req, res) => {
  try {
    const { applicationId, interviewId } = req.params;
    const { interviewFeedback, hiringDecision, interviewScore, interviewStatus, attachments } = req.body;

    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      });
    }

    const interview = application.interviews.id(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interviewFeedback !== undefined) interview.interviewFeedback = interviewFeedback;
    if (hiringDecision !== undefined) interview.hiringDecision = hiringDecision;
    if (interviewScore !== undefined) interview.interviewScore = Number(interviewScore);
    if (Array.isArray(attachments)) {
      interview.interviewAttachments.push(...attachments);
    }
    interview.interviewStatus = interviewStatus || 'completed';

    // Synchronize overall application status based on hiring decision
    if (hiringDecision === 'recommended') {
      application.applicationStatus = 'offered';
    } else if (hiringDecision === 'rejected') {
      application.applicationStatus = 'rejected';
    } else {
      application.applicationStatus = 'interviewed';
    }

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Interview evaluation submitted successfully',
      data: interview,
      applicationStatus: application.applicationStatus
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to submit interview feedback',
      error: error.message
    });
  }
};

// @desc    Add attachment to an interview round
// @route   POST /api/recruitment/applications/:applicationId/interviews/:interviewId/attachments
// @access  Private (HR / Interviewer)
export const addInterviewAttachment = async (req, res) => {
  try {
    const { applicationId, interviewId } = req.params;
    const { fileName, originalName, fileUrl, fileType, fileSize, description } = req.body;

    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      });
    }

    const interview = application.interviews.id(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    interview.interviewAttachments.push({
      fileName,
      originalName: originalName || fileName,
      fileUrl,
      fileType,
      fileSize,
      description,
      uploadedAt: new Date(),
      uploadedBy: req.user ? req.user._id : undefined
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Interview attachment added successfully',
      data: interview.interviewAttachments[interview.interviewAttachments.length - 1],
      attachments: interview.interviewAttachments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add interview attachment',
      error: error.message
    });
  }
};

// @desc    Delete an interview round
// @route   DELETE /api/recruitment/applications/:applicationId/interviews/:interviewId
// @access  Private (HR Management)
export const deleteInterview = async (req, res) => {
  try {
    const { applicationId, interviewId } = req.params;
    const application = await JobApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      });
    }

    const interview = application.interviews.id(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview round not found'
      });
    }

    interview.deleteOne();
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Interview deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete interview',
      error: error.message
    });
  }
};
