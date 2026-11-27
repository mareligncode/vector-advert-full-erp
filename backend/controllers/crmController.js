import * as crmService from '../services/crmService.js';

// ==========================================
// 1. Lead Controllers
// ==========================================

export async function createLead(req, res, next) {
  try {
    const lead = await crmService.createLead(req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: lead,
      message: `Lead ${lead.leadNumber} created successfully`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function getLeads(req, res, next) {
  try {
    const filters = {
      source: req.query.source,
      status: req.query.status,
      qualificationRating: req.query.qualificationRating,
      assignedTo: req.query.assignedTo,
      search: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const pagination = {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 }
    };

    const result = await crmService.getLeads(filters, pagination);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
}

export async function getLeadById(req, res, next) {
  try {
    const lead = await crmService.getLeadById(req.params.id);
    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function updateLead(req, res, next) {
  try {
    const lead = await crmService.updateLead(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      data: lead,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function deleteLead(req, res, next) {
  try {
    await crmService.deleteLead(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function convertLeadToClient(req, res, next) {
  try {
    const client = await crmService.convertLeadToClient(req.params.id, req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: client,
      message: `Lead successfully converted to Client ${client.clientCode}`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

// ==========================================
// 2. Client Profile & Credit Controllers
// ==========================================

export async function getClients(req, res, next) {
  try {
    const filters = {
      clientType: req.query.clientType,
      industry: req.query.industry,
      creditStatus: req.query.creditStatus,
      isCreditHold: req.query.isCreditHold !== undefined ? req.query.isCreditHold === 'true' : undefined,
      search: req.query.search,
      accountManager: req.query.accountManager
    };

    const pagination = {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 }
    };

    const result = await crmService.getClients(filters, pagination);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
}

export async function getClientById(req, res, next) {
  try {
    const client = await crmService.getClientById(req.params.id);
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function createClient(req, res, next) {
  try {
    const client = await crmService.createClient(req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: client,
      message: `Client ${client.clientCode} registered successfully`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function updateClient(req, res, next) {
  try {
    const client = await crmService.updateClient(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      data: client,
      message: 'Client profile updated successfully'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function updateClientCreditTerms(req, res, next) {
  try {
    const client = await crmService.updateClientCreditTerms(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      data: client,
      message: 'Credit terms and limit updated successfully'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

// ==========================================
// 3. Follow-Up Touchpoint Controllers
// ==========================================

export async function recordFollowUp(req, res, next) {
  try {
    const followUp = await crmService.recordFollowUp(req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: followUp,
      message: `Follow-up interaction ${followUp.followUpCode} logged`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function getFollowUps(req, res, next) {
  try {
    const filters = {
      entityType: req.query.entityType,
      entityId: req.query.entityId,
      channel: req.query.channel,
      taskStatus: req.query.taskStatus,
      assignedTo: req.query.assignedTo,
      scheduledBefore: req.query.scheduledBefore,
      scheduledAfter: req.query.scheduledAfter
    };

    const pagination = {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 }
    };

    const result = await crmService.getFollowUps(filters, pagination);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
}

export async function completeFollowUpTask(req, res, next) {
  try {
    const followUp = await crmService.completeFollowUpTask(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      data: followUp,
      message: 'Follow-up task marked completed'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

// ==========================================
// 4. Site Survey Controllers
// ==========================================

export async function scheduleSiteSurvey(req, res, next) {
  try {
    const survey = await crmService.scheduleSiteSurvey(req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: survey,
      message: `Site survey ${survey.surveyCode} scheduled successfully`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function getSiteSurveys(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      assignedSurveyor: req.query.assignedSurveyor,
      entityType: req.query.entityType,
      entityId: req.query.entityId,
      wallSurfaceType: req.query.wallSurfaceType,
      accessEquipmentRequired: req.query.accessEquipmentRequired,
      search: req.query.search
    };

    const pagination = {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort ? JSON.parse(req.query.sort) : { scheduledDate: -1 }
    };

    const result = await crmService.getSiteSurveys(filters, pagination);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
}

export async function getSiteSurveyById(req, res, next) {
  try {
    const survey = await crmService.getSiteSurveyById(req.params.id);
    res.status(200).json({
      success: true,
      data: survey
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function completeSiteSurvey(req, res, next) {
  try {
    const survey = await crmService.completeSiteSurvey(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      data: survey,
      message: `Site survey ${survey.surveyCode} measurements and specs saved as completed`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function approveSiteSurvey(req, res, next) {
  try {
    const supervisorId = req.body.supervisorEmployeeId || req.user._id;
    const survey = await crmService.approveSiteSurvey(req.params.id, supervisorId, req.user._id);
    res.status(200).json({
      success: true,
      data: survey,
      message: `Site survey ${survey.surveyCode} approved by supervisor`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}
