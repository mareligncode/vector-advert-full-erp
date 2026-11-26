import mongoose from 'mongoose';
import {
  CLIENT_TYPE_ENUM,
  INDUSTRY_ENUM,
  CUSTOMER_CREDIT_STATUS_ENUM
} from '../constants/operationsEnums.js';

const contactPersonSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    jobTitle: { type: String, trim: true },
    department: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    alternativePhone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    telegramUsername: { type: String, trim: true },
    whatsappNumber: { type: String, trim: true },
    isPrimaryDecisionMaker: { type: Boolean, default: false },
    hasFinancialSignOffAuthority: { type: Boolean, default: false },
    preferredContactMethod: {
      type: String,
      enum: ['phone', 'telegram', 'whatsapp', 'email', 'in_person'],
      default: 'phone'
    },
    notes: { type: String, trim: true }
  },
  { _id: true }
);

const guaranteeInstrumentSchema = new mongoose.Schema(
  {
    instrumentType: {
      type: String,
      enum: [
        'post_dated_cheque',
        'bank_guarantee',
        'corporate_commitment_letter',
        'personal_guarantor'
      ],
      required: true
    },
    instrumentReference: { type: String, trim: true },
    guaranteeAmount: { type: Number, min: 0 },
    expiryDate: { type: Date },
    evidenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }
  },
  { _id: true }
);

const clientSchema = new mongoose.Schema(
  {
    clientCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    legalName: {
      type: String,
      required: true,
      trim: true
    },
    clientType: {
      type: String,
      enum: CLIENT_TYPE_ENUM,
      required: true,
      default: 'corporate',
      index: true
    },
    industry: {
      type: String,
      enum: INDUSTRY_ENUM,
      required: true,
      default: 'other',
      index: true
    },
    companyScale: {
      type: String,
      enum: [
        'startup_sme',
        'mid_market',
        'large_enterprise',
        'multinational',
        'government_institution'
      ]
    },
    brandGuidelinesSummary: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    officialEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    primaryPhone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    alternativePhone: {
      type: String,
      trim: true
    },
    hotline: {
      type: String,
      trim: true
    },
    contactPersons: [contactPersonSchema],
    address: {
      country: { type: String, default: 'Ethiopia', trim: true },
      city: { type: String, default: 'Addis Ababa', trim: true },
      subcity: { type: String, required: true, trim: true },
      woreda: { type: String, trim: true },
      kebele: { type: String, trim: true },
      buildingName: { type: String, trim: true },
      floorNumber: { type: String, trim: true },
      officeNumber: { type: String, trim: true },
      landmark: { type: String, required: true, trim: true },
      gpsCoordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      },
      deliveryInstructions: { type: String, trim: true }
    },
    businessCompliance: {
      tin: {
        type: String,
        trim: true,
        sparse: true,
        unique: true,
        index: true
      },
      vatRegistrationNumber: { type: String, trim: true },
      isVatRegistered: { type: Boolean, default: true },
      businessLicenseNumber: { type: String, trim: true },
      licenseExpiryDate: { type: Date },
      isWithholdingExempt: { type: Boolean, default: false },
      withholdingExemptionCertificateNumber: { type: String, trim: true },
      complianceDocumentsEvidenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }
    },
    creditTerms: {
      allowCredit: { type: Boolean, default: false, index: true },
      creditLimit: { type: Number, default: 0, min: 0 },
      creditPeriodDays: { type: Number, default: 0, min: 0 },
      gracePeriodDays: { type: Number, default: 5, min: 0 },
      securityGuaranteeType: {
        type: String,
        enum: [
          'none',
          'bank_guarantee',
          'post_dated_cheque',
          'corporate_letter_of_commitment',
          'personal_guarantor'
        ],
        default: 'none'
      },
      securityGuaranteeReference: { type: String, trim: true },
      guaranteeInstruments: [guaranteeInstrumentSchema],
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvalDate: { type: Date },
      creditReviewDate: { type: Date },
      creditStatus: {
        type: String,
        enum: CUSTOMER_CREDIT_STATUS_ENUM,
        default: 'active_good_standing',
        index: true
      },
      isCreditHold: { type: Boolean, default: false, index: true },
      creditHoldReason: { type: String, trim: true }
    },
    financialMetrics: {
      currentOutstandingBalance: { type: Number, default: 0 },
      totalLifetimeInvoiced: { type: Number, default: 0 },
      totalLifetimePaid: { type: Number, default: 0 },
      totalJobsCompleted: { type: Number, default: 0 },
      averageJobValue: { type: Number, default: 0 }
    },
    accountTier: {
      type: String,
      enum: ['vip_platinum', 'gold', 'silver', 'standard'],
      default: 'standard',
      index: true
    },
    accountManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    relationshipStatus: {
      type: String,
      enum: ['active', 'on_hold', 'suspended', 'blacklisted', 'dormant'],
      default: 'active',
      index: true
    },
    statusReason: {
      type: String,
      trim: true
    },
    sourceLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

clientSchema.index({ relationshipStatus: 1, accountTier: 1 });
clientSchema.index({ industry: 1, clientType: 1 });
clientSchema.index({ 'creditTerms.allowCredit': 1, 'creditTerms.creditStatus': 1 });
clientSchema.index({ 'creditTerms.isCreditHold': 1, 'creditTerms.creditStatus': 1 });
clientSchema.index({ displayName: 1, 'address.city': 1 });

export default mongoose.models.Client || mongoose.model('Client', clientSchema);
