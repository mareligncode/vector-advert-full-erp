import mongoose from 'mongoose';
import {
  SITE_SERVICE_TYPE_ENUM,
  SITE_INSTALLATION_STATUS_ENUM,
  INSTALLATION_ACCESS_TYPE_ENUM,
  HANDOVER_CONDITION_ENUM
} from '../constants/operationsEnums.js';

const cargoItemSchema = new mongoose.Schema(
  {
    itemDescription: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    packagingType: {
      type: String,
      enum: ['wooden_crate', 'bubble_wrap_corrugated', 'steel_frame_cradle', 'carton_box'],
      default: 'bubble_wrap_corrugated'
    },
    verifiedLoaded: { type: Boolean, default: true }
  },
  { _id: true }
);

const siteInstallationSchema = new mongoose.Schema(
  {
    installationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    jobOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOrder',
      required: true,
      index: true
    },
    jobOrderNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    siteSurveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SiteSurvey'
    },
    serviceType: {
      type: String,
      enum: SITE_SERVICE_TYPE_ENUM,
      default: 'delivery_and_installation',
      index: true
    },
    status: {
      type: String,
      enum: SITE_INSTALLATION_STATUS_ENUM,
      default: 'scheduled',
      index: true
    },
    logistics: {
      vehicleType: {
        type: String,
        enum: [
          'pickup_truck',
          'flatbed_truck',
          'delivery_van',
          'closed_box_truck',
          'external_freight'
        ],
        default: 'pickup_truck'
      },
      plateNumber: { type: String, trim: true },
      assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
      workshopGatePassNumber: { type: String, trim: true },
      departureFromWorkshopTime: { type: Date },
      arrivalAtSiteTime: { type: Date },
      cargoManifest: [cargoItemSchema]
    },
    destination: {
      address: { type: String, required: true, trim: true },
      gpsCoordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      },
      siteContactPerson: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true }
      }
    },
    leadTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    electricianEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    crewMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    ],
    fieldVisitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FieldVisit'
    },
    accessEquipmentUsed: {
      type: String,
      enum: INSTALLATION_ACCESS_TYPE_ENUM,
      default: 'ground_level'
    },
    equipmentRentalDetails: {
      type: String,
      trim: true
    },
    generatorDeployed: {
      type: Boolean,
      default: false
    },
    checklist: {
      templateAlignedLevel: { type: Boolean, default: false },
      anchorsSecureTorqued: { type: Boolean, default: false },
      wiringConcealedProtected: { type: Boolean, default: false },
      transformersGroundedIP67: { type: Boolean, default: false },
      siliconeSealingComplete: { type: Boolean, default: false },
      polarityAndVoltageVerified: { type: Boolean, default: false },
      timerPhotocellCalibrated: { type: Boolean, default: false },
      siteCleanedDebrisRemoved: { type: Boolean, default: false }
    },
    illuminationTest: {
      testedAtNight: { type: Boolean, default: true },
      illuminationUniformity: {
        type: String,
        enum: ['perfect_no_hotspots', 'minor_shadow', 'uneven'],
        default: 'perfect_no_hotspots'
      },
      voltageMeasuredAtEndLetter: { type: Number },
      currentDrawAmperes: { type: Number },
      totalPowerWatts: { type: Number }
    },
    handoverCertificate: {
      clientRepresentativeName: { type: String, trim: true },
      clientRepresentativeTitle: { type: String, trim: true },
      clientRepresentativePhone: { type: String, trim: true },
      acceptanceDate: { type: Date, index: true },
      condition: {
        type: String,
        enum: HANDOVER_CONDITION_ENUM,
        default: 'accepted_flawless',
        index: true
      },
      clientComments: { type: String, trim: true },
      snagList: [{ type: String, trim: true }],
      snagResolutionDeadline: { type: Date },
      clientDigitalSignatureUrl: { type: String, trim: true },
      leadTechnicianSignatureUrl: { type: String, trim: true }
    },
    evidenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evidence'
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

siteInstallationSchema.index({ jobOrderId: 1, status: 1 });
siteInstallationSchema.index({ clientId: 1, status: 1 });
siteInstallationSchema.index({ leadTechnician: 1, status: 1 });
siteInstallationSchema.index({
  'handoverCertificate.condition': 1,
  'handoverCertificate.acceptanceDate': 1
});

export default mongoose.models.SiteInstallation ||
  mongoose.model('SiteInstallation', siteInstallationSchema);
