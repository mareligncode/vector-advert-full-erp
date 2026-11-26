import mongoose from 'mongoose';
import {
  SURVEY_STATUS_ENUM,
  WALL_SURFACE_TYPE_ENUM,
  INSTALLATION_ACCESS_TYPE_ENUM
} from '../constants/operationsEnums.js';

const siteSurveySchema = new mongoose.Schema(
  {
    surveyCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    targetEntity: {
      entityType: {
        type: String,
        enum: ['Lead', 'Client', 'ClientOrder', 'JobOrder'],
        required: true,
        index: true
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'targetEntity.entityType',
        index: true
      },
      referenceNumber: { type: String, trim: true },
      clientName: { type: String, trim: true }
    },
    surveyTitle: {
      type: String,
      required: true,
      trim: true
    },
    assignedSurveyor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    assistingCrew: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    ],
    scheduledDate: {
      type: Date,
      required: true,
      index: true
    },
    actualSurveyDate: {
      type: Date
    },
    status: {
      type: String,
      enum: SURVEY_STATUS_ENUM,
      default: 'scheduled',
      index: true
    },
    siteAddress: {
      city: { type: String, default: 'Addis Ababa', trim: true },
      subcity: { type: String, required: true, trim: true },
      woreda: { type: String, trim: true },
      specificLocation: { type: String, trim: true },
      gpsCoordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
      }
    },
    siteContactPerson: {
      name: { type: String, trim: true },
      phone: { type: String, required: true, trim: true }
    },
    workingHourRestrictions: {
      type: String,
      trim: true
    },
    measurements: {
      facadeWidthMeters: { type: Number, required: true, min: 0 },
      facadeHeightMeters: { type: Number, required: true, min: 0 },
      installationHeightFromGround: { type: Number, required: true, min: 0 },
      maximumSignWidthAllowed: { type: Number, min: 0 },
      maximumSignHeightAllowed: { type: Number, min: 0 },
      fasciaDepthCm: { type: Number, min: 0 },
      viewingDistanceMeters: { type: Number, min: 0 }
    },
    wallSurfaceType: {
      type: String,
      enum: WALL_SURFACE_TYPE_ENUM,
      required: true
    },
    wallConditionRating: {
      type: String,
      enum: ['sound_solid', 'moderate_weathered', 'crumbling_weak', 'requires_reinforcement'],
      default: 'sound_solid'
    },
    existingSignagePresent: {
      type: Boolean,
      default: false
    },
    dismantlingRequired: {
      type: Boolean,
      default: false
    },
    dismantlingDetails: {
      oldSignType: { type: String, trim: true },
      disposalMethod: { type: String, enum: ['client_keeps', 'vector_disposal_scrap'] },
      dismantlingFeeEstimate: { type: Number, default: 0, min: 0 }
    },
    electricalInspection: {
      powerSourceAvailable: { type: Boolean, default: true },
      powerSourceDistanceMeters: { type: Number, required: true, min: 0 },
      supplyVoltage: {
        type: String,
        enum: ['220V_single_phase', '380V_three_phase', 'none_needs_line_extension'],
        default: '220V_single_phase'
      },
      cableRoutingPath: {
        type: String,
        enum: [
          'concealed_behind_facade',
          'surface_mounted_pvc_conduit',
          'through_suspended_ceiling',
          'exposed'
        ],
        default: 'surface_mounted_pvc_conduit'
      },
      breakerDedicated: { type: Boolean, default: false },
      transformerMountingLocation: { type: String, trim: true },
      photocellOrTimerNeeded: { type: Boolean, default: true }
    },
    accessEquipmentRequired: {
      type: String,
      enum: INSTALLATION_ACCESS_TYPE_ENUM,
      required: true
    },
    scaffoldingHeightMeters: {
      type: Number,
      min: 0
    },
    boomLiftRoadPermitRequired: {
      type: Boolean,
      default: false
    },
    safetyPrecautions: [{ type: String, trim: true }],
    photosEvidenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evidence'
    },
    sketchesAndNotes: {
      type: String,
      trim: true
    },
    approvedBySupervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    approvalDate: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

siteSurveySchema.index({ 'targetEntity.entityType': 1, 'targetEntity.entityId': 1 });
siteSurveySchema.index({ status: 1, scheduledDate: 1 });
siteSurveySchema.index({ assignedSurveyor: 1, status: 1 });

export default mongoose.models.SiteSurvey || mongoose.model('SiteSurvey', siteSurveySchema);
