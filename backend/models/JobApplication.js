import mongoose from 'mongoose';

// Standard attachment sub-schema for multiple file attachments across the ERP
export const fileAttachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, trim: true },
    originalName: { type: String, trim: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, trim: true },
    fileSize: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, trim: true }
  },
  { _id: true }
);

const interviewSubSchema = new mongoose.Schema(
  {
    interviewFormat: {
      type: String,
      enum: ['in-person', 'online', 'phone'],
      default: 'in-person'
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    interviewLocation: {
      type: String,
      trim: true
    },
    onlineMeetingLink: {
      type: String,
      trim: true
    },
    meetingLinkSendingStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    interviewStatus: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'],
      default: 'scheduled'
    },
    interviewFeedback: {
      type: String,
      trim: true
    },
    hiringDecision: {
      type: String,
      enum: ['pending', 'recommended', 'rejected', 'on_hold', 'proceed_to_next_round'],
      default: 'pending'
    },
    interviewScore: {
      type: Number,
      min: 0,
      max: 100
    },
    // Multiple file attachments per interview round (e.g. assessment sheets, test submissions)
    interviewAttachments: [fileAttachmentSchema]
  },
  {
    timestamps: true
  }
);

const jobApplicationSchema = new mongoose.Schema(
  {
    jobPosting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: [true, 'Related job posting is required']
    },
    applicantName: {
      first: { type: String, required: true, trim: true },
      middle: { type: String, trim: true },
      last: { type: String, required: true, trim: true }
    },
    applicantContact: {
      email: {
        type: String,
        required: [true, 'Applicant email is required'],
        lowercase: true,
        trim: true
      },
      phoneNumber: {
        type: String,
        required: [true, 'Applicant phone number is required'],
        trim: true
      },
      telegramUsername: {
        type: String,
        trim: true
      }
    },
    resume: {
      type: String,
      required: [true, 'Resume document link/path is required'],
      trim: true
    },
    portfolioLink: {
      type: String,
      trim: true
    },
    linkedInLink: {
      type: String,
      trim: true
    },
    coverLetter: {
      type: String,
      trim: true
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0
    },
    applicationStatus: {
      type: String,
      enum: [
        'submitted',
        'under_review',
        'shortlisted',
        'interview_scheduled',
        'interviewed',
        'offered',
        'hired',
        'rejected',
        'withdrawn'
      ],
      default: 'submitted'
    },
    applicantRating: {
      type: Number,
      min: 1,
      max: 5
    },
    applicationNotes: {
      type: String,
      trim: true
    },
    // Multiple file attachments (certificates, reference letters, design files, portfolios, test projects)
    attachments: [fileAttachmentSchema],
    interviews: [interviewSubSchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

jobApplicationSchema.virtual('fullName').get(function () {
  if (!this.applicantName) return '';
  return [this.applicantName.first, this.applicantName.middle, this.applicantName.last]
    .filter(Boolean)
    .join(' ');
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
export default JobApplication;
