import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeNumber: {
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
    dateOfBirth: {
      type: Date
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    primaryPhone: {
      type: String,
      required: true,
      trim: true
    },
    alternativePhone: {
      type: String,
      trim: true
    },
    profilePhoto: {
      type: String
    },
    nationalId: {
      fanNumber: { type: String, trim: true },
      finNumber: { type: String, trim: true },
      frontImageUrl: { type: String },
      backImageUrl: { type: String },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
      rejectionReason: { type: String, trim: true }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed']
    },
    nationality: {
      type: String,
      default: 'Ethiopian'
    },
    homeAddress: {
      type: String
    },
    emergencyContacts: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        relationship: { type: String }
      }
    ],
    guarantors: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        nationalId: {
          fanNumber: { type: String },
          finNumber: { type: String },
          frontImageUrl: { type: String },
          backImageUrl: { type: String },
          status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
          },
          approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          approvedAt: { type: Date },
          rejectionReason: { type: String, trim: true }
        }
      }
    ],
    bankAccounts: [
      {
        bankName: { type: String, required: true },
        holderName: { type: String, required: true },
        accountNumber: { type: String, required: true },
        isPrimary: { type: Boolean, default: false }
      }
    ],
    basicSalary: {
      type: Number,
      default: 0
    },
    department: {
      type: String,
      trim: true
    },
    jobTitle: {
      type: String,
      trim: true
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    employmentStatus: {
      type: String,
      enum: ['active', 'probation', 'suspended', 'terminated', 'resigned', 'on_leave'],
      default: 'probation'
    },
    hireDate: {
      type: Date,
      default: Date.now
    },
    contractEndDate: {
      type: Date
    },
    probationEndDate: {
      type: Date
    },
    workLocation: {
      type: String
    },
    branch: {
      type: String
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
      default: 'full-time'
    },
    employeeDocuments: [
      {
        title: { type: String, required: true },
        type: { type: String },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        approvedAt: { type: Date },
        rejectionReason: { type: String, trim: true }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for full name
employeeSchema.virtual('fullName').get(function () {
  if (!this.name) return '';
  return [this.name.first, this.name.middle, this.name.last].filter(Boolean).join(' ');
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
