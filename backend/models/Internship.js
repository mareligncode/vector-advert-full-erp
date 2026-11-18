import mongoose from 'mongoose';
import { fileAttachmentSchema } from './JobApplication.js';

const internshipSchema = new mongoose.Schema(
  {
    internshipNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      sparse: true,
      required: false
    },
    name: {
      first: { type: String, required: true, trim: true },
      middle: { type: String, trim: true },
      last: { type: String, required: true, trim: true }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true }
    },
    type: {
      type: String,
      enum: ['tutorial', 'paid'],
      default: 'tutorial'
    },
    stipendAmount: {
      type: Number,
      default: 0
    },
    academicProfile: {
      university: { type: String, trim: true },
      faculty: { type: String, trim: true },
      departmentOfStudy: { type: String, trim: true },
      yearOfStudy: { type: Number, min: 1, max: 7 },
      studentId: {
        idNumber: { type: String, trim: true },
        frontImageUrl: { type: String },
        backImageUrl: { type: String }
      }
    },
    placement: {
      internshipPosition: { type: String, trim: true },
      assignedDepartment: { type: String, trim: true },
      supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      },
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date },
      status: {
        type: String,
        enum: ['applied', 'active', 'completed', 'terminated', 'withdrawn', 'converted_to_employee'],
        default: 'active'
      }
    },
    // Multiple documents support (application letters, recommendation letters, CV, university MoU, work reports, etc.)
    documents: [fileAttachmentSchema],
    notes: {
      type: String,
      trim: true
    },
    evaluations: [
      {
        evaluationDate: { type: Date, default: Date.now },
        evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        score: { type: Number, min: 0, max: 100 },
        feedback: { type: String, trim: true },
        certificateIssued: { type: Boolean, default: false },
        certificateUrl: { type: String },
        // Multiple evaluation attachments (e.g. grading forms, project review files)
        evaluationAttachments: [fileAttachmentSchema]
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

internshipSchema.virtual('fullName').get(function () {
  if (!this.name) return '';
  return [this.name.first, this.name.middle, this.name.last].filter(Boolean).join(' ');
});

const Internship = mongoose.model('Internship', internshipSchema);
export default Internship;
