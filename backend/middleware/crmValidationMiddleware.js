import mongoose from 'mongoose';
import {
  LEAD_SOURCE_ENUM,
  LEAD_STATUS_ENUM,
  CLIENT_TYPE_ENUM,
  INDUSTRY_ENUM,
  FOLLOWUP_CHANNEL_ENUM,
  FOLLOWUP_ACTION_TYPE_ENUM,
  WALL_SURFACE_TYPE_ENUM,
  INSTALLATION_ACCESS_TYPE_ENUM
} from '../constants/operationsEnums.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export function validateLeadInput(req, res, next) {
  const { name, pointOfContact, phone, source, status } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Lead name is required');
  }

  if (!pointOfContact || !pointOfContact.name || typeof pointOfContact.name !== 'string' || !pointOfContact.name.trim()) {
    errors.push('Point of contact name is required');
  }

  if (!phone || !phone.primary || typeof phone.primary !== 'string' || !phone.primary.trim()) {
    errors.push('Primary phone number is required');
  }

  if (source && !LEAD_SOURCE_ENUM.includes(source)) {
    errors.push(`Invalid lead source. Allowed values: ${LEAD_SOURCE_ENUM.join(', ')}`);
  }

  if (status && !LEAD_STATUS_ENUM.includes(status)) {
    errors.push(`Invalid lead status. Allowed values: ${LEAD_STATUS_ENUM.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

export function validateClientInput(req, res, next) {
  const { displayName, legalName, primaryPhone, clientType, industry, address } = req.body;
  const errors = [];

  if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
    errors.push('Client display name is required');
  }

  if (!legalName || typeof legalName !== 'string' || !legalName.trim()) {
    errors.push('Client legal name is required');
  }

  if (!primaryPhone || typeof primaryPhone !== 'string' || !primaryPhone.trim()) {
    errors.push('Primary phone number is required');
  }

  if (clientType && !CLIENT_TYPE_ENUM.includes(clientType)) {
    errors.push(`Invalid client type. Allowed values: ${CLIENT_TYPE_ENUM.join(', ')}`);
  }

  if (industry && !INDUSTRY_ENUM.includes(industry)) {
    errors.push(`Invalid industry. Allowed values: ${INDUSTRY_ENUM.join(', ')}`);
  }

  if (!address || typeof address !== 'object') {
    errors.push('Client address is required');
  } else {
    if (!address.subcity || !address.subcity.trim()) {
      errors.push('Address subcity is required');
    }
    if (!address.landmark || !address.landmark.trim()) {
      errors.push('Address landmark is required');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

export function validateFollowUpInput(req, res, next) {
  const { targetEntity, interaction, task } = req.body;
  const errors = [];

  if (!targetEntity || typeof targetEntity !== 'object') {
    errors.push('Target entity information is required');
  } else {
    if (!['Lead', 'Client', 'ClientOrder', 'JobOrder'].includes(targetEntity.entityType)) {
      errors.push("Target entityType must be one of: 'Lead', 'Client', 'ClientOrder', 'JobOrder'");
    }
    if (!targetEntity.entityId || !isValidObjectId(targetEntity.entityId)) {
      errors.push('Valid target entityId is required');
    }
  }

  if (!interaction || typeof interaction !== 'object') {
    errors.push('Interaction details are required');
  } else {
    if (!interaction.channel || !FOLLOWUP_CHANNEL_ENUM.includes(interaction.channel)) {
      errors.push(`Invalid interaction channel. Allowed: ${FOLLOWUP_CHANNEL_ENUM.join(', ')}`);
    }
    if (!interaction.conductedBy || !isValidObjectId(interaction.conductedBy)) {
      errors.push('Valid conductedBy employee ObjectId is required');
    }
    if (!interaction.summary || typeof interaction.summary !== 'string' || !interaction.summary.trim()) {
      errors.push('Interaction summary is required');
    }
  }

  if (task && task.actionType && !FOLLOWUP_ACTION_TYPE_ENUM.includes(task.actionType)) {
    errors.push(`Invalid task actionType. Allowed: ${FOLLOWUP_ACTION_TYPE_ENUM.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

export function validateSiteSurveyScheduleInput(req, res, next) {
  const { targetEntity, surveyTitle, assignedSurveyor, scheduledDate, siteAddress, siteContactPerson } = req.body;
  const errors = [];

  if (!targetEntity || !['Lead', 'Client', 'ClientOrder', 'JobOrder'].includes(targetEntity.entityType)) {
    errors.push("Valid targetEntity with entityType ('Lead', 'Client', 'ClientOrder', 'JobOrder') is required");
  }
  if (!targetEntity?.entityId || !isValidObjectId(targetEntity.entityId)) {
    errors.push('Valid target entityId is required');
  }

  if (!surveyTitle || typeof surveyTitle !== 'string' || !surveyTitle.trim()) {
    errors.push('Survey title is required');
  }

  if (!assignedSurveyor || !isValidObjectId(assignedSurveyor)) {
    errors.push('Valid assignedSurveyor employee ObjectId is required');
  }

  if (!scheduledDate || isNaN(new Date(scheduledDate).getTime())) {
    errors.push('Valid scheduled date is required');
  }

  if (!siteAddress?.subcity || !siteAddress.subcity.trim()) {
    errors.push('Site address subcity is required');
  }

  if (!siteContactPerson?.phone || !siteContactPerson.phone.trim()) {
    errors.push('Site contact person phone is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

export function validateSiteSurveyCompletionInput(req, res, next) {
  const { measurements, wallSurfaceType, electricalInspection, accessEquipmentRequired } = req.body;
  const errors = [];

  if (!measurements || typeof measurements !== 'object') {
    errors.push('Physical measurements are required');
  } else {
    if (measurements.facadeWidthMeters === undefined || Number(measurements.facadeWidthMeters) <= 0) {
      errors.push('facadeWidthMeters must be greater than 0');
    }
    if (measurements.facadeHeightMeters === undefined || Number(measurements.facadeHeightMeters) <= 0) {
      errors.push('facadeHeightMeters must be greater than 0');
    }
    if (measurements.installationHeightFromGround === undefined || Number(measurements.installationHeightFromGround) < 0) {
      errors.push('installationHeightFromGround cannot be negative');
    }
  }

  if (!wallSurfaceType || !WALL_SURFACE_TYPE_ENUM.includes(wallSurfaceType)) {
    errors.push(`wallSurfaceType is required. Allowed: ${WALL_SURFACE_TYPE_ENUM.join(', ')}`);
  }

  if (!electricalInspection || typeof electricalInspection !== 'object') {
    errors.push('electricalInspection details are required');
  } else {
    if (electricalInspection.powerSourceDistanceMeters === undefined || Number(electricalInspection.powerSourceDistanceMeters) < 0) {
      errors.push('powerSourceDistanceMeters cannot be negative');
    }
  }

  if (!accessEquipmentRequired || !INSTALLATION_ACCESS_TYPE_ENUM.includes(accessEquipmentRequired)) {
    errors.push(`accessEquipmentRequired is required. Allowed: ${INSTALLATION_ACCESS_TYPE_ENUM.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}
