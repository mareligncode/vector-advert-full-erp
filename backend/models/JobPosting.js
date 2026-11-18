import mongoose from 'mongoose';

const jobPostingSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship', 'temporary'],
      default: 'full-time'
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
      default: 'mid'
    },
    jobDescription: {
      type: String,
      required: [true, 'Job description is required']
    },
    jobRequirements: [
      {
        type: String,
        trim: true
      }
    ],
    postingStatus: {
      type: String,
      enum: ['draft', 'published', 'closed', 'on_hold', 'archived'],
      default: 'draft'
    },
    numberOfOpenings: {
      type: Number,
      default: 1,
      min: 1
    },
    applicationDeadline: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

jobPostingSchema.virtual('applicationsCount', {
  ref: 'JobApplication',
  localField: '_id',
  foreignField: 'jobPosting',
  count: true
});

const JobPosting = mongoose.model('JobPosting', jobPostingSchema);
export default JobPosting;
