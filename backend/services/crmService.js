import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import FollowUp from '../models/FollowUp.js';
import SiteSurvey from '../models/SiteSurvey.js';
import { generateCode, withTransaction } from '../utils/inventoryService.js';

// ==========================================
// 1. Lead Services
// ==========================================

export async function createLead(leadData, userId) {
  const primaryPhone = leadData?.phone?.primary?.trim();
  if (!primaryPhone) {
    throw new Error('Primary phone number is required');
  }

  // Check for duplicate active lead with same primary phone
  const existingLead = await Lead.findOne({
    'phone.primary': primaryPhone,
    status: { $nin: ['lost', 'disqualified'] }
  });

  if (existingLead) {
    const error = new Error(`An active lead already exists with phone number ${primaryPhone} (${existingLead.leadNumber})`);
    error.statusCode = 409;
    throw error;
  }

  const leadNumber = await generateCode('LEAD', Lead, 'leadNumber');

  const lead = new Lead({
    ...leadData,
    leadNumber,
    createdBy: userId
  });

  return await lead.save();
}

export async function getLeads(filters = {}, pagination = {}) {
  const {
    source,
    status,
    qualificationRating,
    assignedTo,
    search,
    startDate,
    endDate
  } = filters;

  const { page = 1, limit = 20, sort = { createdAt: -1 } } = pagination;
  const query = {};

  if (source) query.source = source;
  if (status) query.status = status;
  if (qualificationRating) query.qualificationRating = qualificationRating;
  if (assignedTo) query.assignedTo = assignedTo;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { leadNumber: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { 'pointOfContact.name': { $regex: search, $options: 'i' } },
      { 'phone.primary': { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    Lead.find(query)
      .populate('assignedTo', 'firstName lastName email role employeeCode')
      .populate('createdBy', 'name email role')
      .populate('convertedClient.clientId', 'clientCode displayName legalName')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Lead.countDocuments(query)
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
}

export async function getLeadById(leadId) {
  const lead = await Lead.findById(leadId)
    .populate('assignedTo', 'firstName lastName email role employeeCode department')
    .populate('createdBy', 'name email role')
    .populate('convertedClient.clientId', 'clientCode displayName legalName primaryPhone')
    .populate('siteSurveyDetails.surveyorEmployeeId', 'firstName lastName phone');

  if (!lead) {
    const error = new Error('Lead not found');
    error.statusCode = 404;
    throw error;
  }

  return lead;
}

export async function updateLead(leadId, updateData, userId) {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    const error = new Error('Lead not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent modifying critical system flags directly through updateLead
  delete updateData.leadNumber;
  delete updateData.createdBy;
  delete updateData.convertedClient;

  // If primary phone is being changed, check uniqueness
  if (updateData?.phone?.primary && updateData.phone.primary !== lead.phone.primary) {
    const duplicate = await Lead.findOne({
      _id: { $ne: leadId },
      'phone.primary': updateData.phone.primary.trim(),
      status: { $nin: ['lost', 'disqualified'] }
    });
    if (duplicate) {
      const error = new Error(`Phone number already in use by lead ${duplicate.leadNumber}`);
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(lead, updateData);
  return await lead.save();
}

export async function deleteLead(leadId) {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    const error = new Error('Lead not found');
    error.statusCode = 404;
    throw error;
  }

  if (lead.convertedClient?.isConverted) {
    const error = new Error('Cannot delete a lead that has already been converted to a client');
    error.statusCode = 400;
    throw error;
  }

  return await Lead.findByIdAndDelete(leadId);
}

export async function convertLeadToClient(leadId, clientData, userId) {
  return await withTransaction(async (session) => {
    const lead = await Lead.findById(leadId).session(session);
    if (!lead) {
      const error = new Error('Lead not found');
      error.statusCode = 404;
      throw error;
    }

    if (lead.convertedClient?.isConverted) {
      const error = new Error(`Lead is already converted to client`);
      error.statusCode = 400;
      throw error;
    }

    const clientCode = await generateCode('CL', Client, 'clientCode');

    // Build client document using payload combined with lead data defaults
    const newClientPayload = {
      clientCode,
      displayName: clientData.displayName || lead.companyName || lead.name,
      legalName: clientData.legalName || lead.companyName || lead.name,
      clientType: clientData.clientType || 'corporate',
      industry: clientData.industry || 'other',
      companyScale: clientData.companyScale,
      primaryPhone: clientData.primaryPhone || lead.phone?.primary,
      alternativePhone: clientData.alternativePhone || lead.phone?.alternative,
      officialEmail: clientData.officialEmail || lead.email,
      website: clientData.website,
      contactPersons: clientData.contactPersons || [
        {
          fullName: lead.pointOfContact?.name || lead.name,
          jobTitle: lead.pointOfContact?.jobTitle || 'Representative',
          phone: lead.phone?.primary,
          email: lead.email,
          isPrimaryDecisionMaker: lead.pointOfContact?.isDecisionMaker || true
        }
      ],
      address: clientData.address || {
        city: lead.address?.city || 'Addis Ababa',
        subcity: lead.address?.subcity || 'Bole',
        woreda: lead.address?.woreda,
        landmark: lead.address?.specificLocation || 'Main Office',
        gpsCoordinates: lead.address?.coordinates
      },
      businessCompliance: clientData.businessCompliance || {},
      creditTerms: clientData.creditTerms || {
        allowCredit: false,
        creditLimit: 0,
        creditPeriodDays: 0,
        gracePeriodDays: 5,
        creditStatus: 'active_good_standing'
      },
      sourceLeadId: lead._id,
      accountManager: clientData.accountManager || lead.assignedTo,
      createdBy: userId
    };

    const clientDocs = await Client.create([newClientPayload], { session });
    const createdClient = clientDocs[0];

    lead.status = 'won_converted';
    lead.convertedClient = {
      isConverted: true,
      convertedAt: new Date(),
      clientId: createdClient._id
    };
    await lead.save({ session });

    return createdClient;
  });
}

// ==========================================
// 2. Client Profile & Credit Services
// ==========================================

export async function getClients(filters = {}, pagination = {}) {
  const {
    clientType,
    industry,
    creditStatus,
    isCreditHold,
    search,
    accountManager
  } = filters;

  const { page = 1, limit = 20, sort = { createdAt: -1 } } = pagination;
  const query = {};

  if (clientType) query.clientType = clientType;
  if (industry) query.industry = industry;
  if (accountManager) query.accountManager = accountManager;
  if (creditStatus) query['creditTerms.creditStatus'] = creditStatus;
  if (typeof isCreditHold === 'boolean') query['creditTerms.isCreditHold'] = isCreditHold;

  if (search) {
    query.$or = [
      { clientCode: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
      { legalName: { $regex: search, $options: 'i' } },
      { primaryPhone: { $regex: search, $options: 'i' } },
      { 'businessCompliance.tin': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    Client.find(query)
      .populate('accountManager', 'firstName lastName email role employeeCode')
      .populate('createdBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Client.countDocuments(query)
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
}

export async function getClientById(clientId) {
  const client = await Client.findById(clientId)
    .populate('accountManager', 'firstName lastName email role employeeCode department')
    .populate('sourceLeadId', 'leadNumber name source createdAt')
    .populate('createdBy', 'name email role');

  if (!client) {
    const error = new Error('Client not found');
    error.statusCode = 404;
    throw error;
  }

  return client;
}

export async function createClient(clientData, userId) {
  const clientCode = await generateCode('CL', Client, 'clientCode');

  // Verify unique TIN if provided
  if (clientData?.businessCompliance?.tin) {
    const existingTin = await Client.findOne({
      'businessCompliance.tin': clientData.businessCompliance.tin.trim()
    });
    if (existingTin) {
      const error = new Error(`Client with TIN ${clientData.businessCompliance.tin} already exists (${existingTin.clientCode})`);
      error.statusCode = 409;
      throw error;
    }
  }

  const client = new Client({
    ...clientData,
    clientCode,
    createdBy: userId
  });

  return await client.save();
}

export async function updateClient(clientId, updateData, userId) {
  const client = await Client.findById(clientId);
  if (!client) {
    const error = new Error('Client not found');
    error.statusCode = 404;
    throw error;
  }

  delete updateData.clientCode;
  delete updateData.createdBy;
  delete updateData.creditTerms; // Credit terms must be updated via updateClientCreditTerms

  // Check TIN uniqueness if changing
  if (updateData?.businessCompliance?.tin && updateData.businessCompliance.tin !== client.businessCompliance?.tin) {
    const duplicateTin = await Client.findOne({
      _id: { $ne: clientId },
      'businessCompliance.tin': updateData.businessCompliance.tin.trim()
    });
    if (duplicateTin) {
      const error = new Error(`TIN ${updateData.businessCompliance.tin} already registered to ${duplicateTin.clientCode}`);
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(client, updateData);
  return await client.save();
}

export async function updateClientCreditTerms(clientId, creditTermsData, userId) {
  const client = await Client.findById(clientId);
  if (!client) {
    const error = new Error('Client not found');
    error.statusCode = 404;
    throw error;
  }

  client.creditTerms = {
    ...client.creditTerms.toObject(),
    ...creditTermsData,
    approvedBy: userId,
    approvedAt: new Date()
  };

  return await client.save();
}

// ==========================================
// 3. Follow-Up Touchpoints & Scheduled Tasks
// ==========================================

export async function recordFollowUp(followUpData, userId) {
  const followUpCode = await generateCode('FOL', FollowUp, 'followUpCode');

  const followUp = new FollowUp({
    ...followUpData,
    followUpCode,
    createdBy: userId
  });

  const saved = await followUp.save();

  // If a scheduled task is specified on a lead, update the lead's status if relevant
  if (followUp.targetEntity.entityType === 'Lead' && followUp.targetEntity.entityId) {
    await Lead.findByIdAndUpdate(followUp.targetEntity.entityId, {
      $set: { status: 'contacted' }
    });
  }

  return saved;
}

export async function getFollowUps(filters = {}, pagination = {}) {
  const {
    entityType,
    entityId,
    channel,
    taskStatus,
    assignedTo,
    scheduledBefore,
    scheduledAfter
  } = filters;

  const { page = 1, limit = 20, sort = { createdAt: -1 } } = pagination;
  const query = {};

  if (entityType) query['targetEntity.entityType'] = entityType;
  if (entityId) query['targetEntity.entityId'] = entityId;
  if (channel) query['interaction.channel'] = channel;
  if (taskStatus) query['task.status'] = taskStatus;
  if (assignedTo) query['task.assignedTo'] = assignedTo;

  if (scheduledBefore || scheduledAfter) {
    query['task.scheduledDateTime'] = {};
    if (scheduledAfter) query['task.scheduledDateTime'].$gte = new Date(scheduledAfter);
    if (scheduledBefore) query['task.scheduledDateTime'].$lte = new Date(scheduledBefore);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    FollowUp.find(query)
      .populate('interaction.conductedBy', 'firstName lastName email role employeeCode')
      .populate('task.assignedTo', 'firstName lastName email role employeeCode')
      .populate('createdBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    FollowUp.countDocuments(query)
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
}

export async function completeFollowUpTask(followUpId, completionData, userId) {
  const followUp = await FollowUp.findById(followUpId);
  if (!followUp) {
    const error = new Error('Follow-up record not found');
    error.statusCode = 404;
    throw error;
  }

  if (!followUp.hasScheduledTask) {
    const error = new Error('This follow-up record does not have an active scheduled task');
    error.statusCode = 400;
    throw error;
  }

  followUp.task.status = 'completed';
  followUp.task.completedAt = new Date();
  followUp.task.completionNotes = completionData.notes || 'Task completed';
  followUp.task.completedBy = completionData.completedBy || userId;
  followUp.updatedBy = userId;

  return await followUp.save();
}

// ==========================================
// 4. On-Site Technical Feasibility Survey Services
// ==========================================

export async function scheduleSiteSurvey(surveyData, userId) {
  const surveyCode = await generateCode('SRV', SiteSurvey, 'surveyCode');

  const survey = new SiteSurvey({
    ...surveyData,
    surveyCode,
    status: surveyData.status || 'scheduled',
    createdBy: userId
  });

  const saved = await survey.save();

  // If attached to a lead, update the lead's survey status
  if (survey.targetEntity.entityType === 'Lead' && survey.targetEntity.entityId) {
    await Lead.findByIdAndUpdate(survey.targetEntity.entityId, {
      $set: {
        siteSurveyRequired: true,
        status: 'site_survey_scheduled',
        'siteSurveyDetails.scheduledDate': survey.scheduledDate,
        'siteSurveyDetails.surveyorEmployeeId': survey.assignedSurveyor,
        'siteSurveyDetails.surveyStatus': 'pending'
      }
    });
  }

  return saved;
}

export async function getSiteSurveys(filters = {}, pagination = {}) {
  const {
    status,
    assignedSurveyor,
    entityType,
    entityId,
    wallSurfaceType,
    accessEquipmentRequired,
    search
  } = filters;

  const { page = 1, limit = 20, sort = { scheduledDate: -1 } } = pagination;
  const query = {};

  if (status) query.status = status;
  if (assignedSurveyor) query.assignedSurveyor = assignedSurveyor;
  if (entityType) query['targetEntity.entityType'] = entityType;
  if (entityId) query['targetEntity.entityId'] = entityId;
  if (wallSurfaceType) query.wallSurfaceType = wallSurfaceType;
  if (accessEquipmentRequired) query.accessEquipmentRequired = accessEquipmentRequired;

  if (search) {
    query.$or = [
      { surveyCode: { $regex: search, $options: 'i' } },
      { surveyTitle: { $regex: search, $options: 'i' } },
      { 'targetEntity.clientName': { $regex: search, $options: 'i' } },
      { 'siteAddress.specificLocation': { $regex: search, $options: 'i' } },
      { 'siteContactPerson.name': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    SiteSurvey.find(query)
      .populate('assignedSurveyor', 'firstName lastName phone email role employeeCode')
      .populate('assistingCrew', 'firstName lastName phone role')
      .populate('approvedBySupervisor', 'firstName lastName role')
      .populate('createdBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    SiteSurvey.countDocuments(query)
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
}

export async function getSiteSurveyById(surveyId) {
  const survey = await SiteSurvey.findById(surveyId)
    .populate('assignedSurveyor', 'firstName lastName phone email role employeeCode department')
    .populate('assistingCrew', 'firstName lastName phone role')
    .populate('approvedBySupervisor', 'firstName lastName phone role')
    .populate('photosEvidenceId')
    .populate('createdBy', 'name email role');

  if (!survey) {
    const error = new Error('Site survey not found');
    error.statusCode = 404;
    throw error;
  }

  return survey;
}

export async function completeSiteSurvey(surveyId, resultsData, userId) {
  const survey = await SiteSurvey.findById(surveyId);
  if (!survey) {
    const error = new Error('Site survey not found');
    error.statusCode = 404;
    throw error;
  }

  if (survey.status === 'completed') {
    const error = new Error('Site survey is already marked completed');
    error.statusCode = 400;
    throw error;
  }

  // Assign measurements and technical specs
  if (resultsData.measurements) {
    survey.measurements = { ...survey.measurements?.toObject(), ...resultsData.measurements };
  }
  if (resultsData.wallSurfaceType) survey.wallSurfaceType = resultsData.wallSurfaceType;
  if (resultsData.wallConditionRating) survey.wallConditionRating = resultsData.wallConditionRating;
  if (resultsData.electricalInspection) {
    survey.electricalInspection = {
      ...survey.electricalInspection?.toObject(),
      ...resultsData.electricalInspection
    };
  }
  if (resultsData.accessEquipmentRequired) survey.accessEquipmentRequired = resultsData.accessEquipmentRequired;
  if (resultsData.scaffoldingHeightMeters !== undefined) survey.scaffoldingHeightMeters = resultsData.scaffoldingHeightMeters;
  if (resultsData.boomLiftRoadPermitRequired !== undefined) survey.boomLiftRoadPermitRequired = resultsData.boomLiftRoadPermitRequired;
  if (resultsData.existingSignagePresent !== undefined) survey.existingSignagePresent = resultsData.existingSignagePresent;
  if (resultsData.dismantlingRequired !== undefined) survey.dismantlingRequired = resultsData.dismantlingRequired;
  if (resultsData.dismantlingDetails) survey.dismantlingDetails = resultsData.dismantlingDetails;
  if (resultsData.safetyPrecautions) survey.safetyPrecautions = resultsData.safetyPrecautions;
  if (resultsData.photosEvidenceId) survey.photosEvidenceId = resultsData.photosEvidenceId;
  if (resultsData.sketchesAndNotes) survey.sketchesAndNotes = resultsData.sketchesAndNotes;

  survey.actualSurveyDate = resultsData.actualSurveyDate || new Date();
  survey.status = 'completed';

  const saved = await survey.save();

  // If attached to a lead, update lead status
  if (survey.targetEntity.entityType === 'Lead' && survey.targetEntity.entityId) {
    await Lead.findByIdAndUpdate(survey.targetEntity.entityId, {
      $set: {
        status: 'measurement_taken',
        'siteSurveyDetails.surveyStatus': 'completed',
        'siteSurveyDetails.evidenceId': survey.photosEvidenceId
      }
    });
  }

  return saved;
}

export async function approveSiteSurvey(surveyId, supervisorEmployeeId, userId) {
  const survey = await SiteSurvey.findById(surveyId);
  if (!survey) {
    const error = new Error('Site survey not found');
    error.statusCode = 404;
    throw error;
  }

  if (survey.status !== 'completed') {
    const error = new Error('Only completed surveys can be approved');
    error.statusCode = 400;
    throw error;
  }

  survey.approvedBySupervisor = supervisorEmployeeId;
  survey.approvalDate = new Date();

  return await survey.save();
}
