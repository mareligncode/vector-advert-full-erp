import * as installationService from '../services/installationService.js';

export async function createInstallation(req, res, next) {
  try {
    const jobOrderId = req.body.jobOrderId || req.params.jobOrderId;
    const installation = await installationService.createSiteInstallation(jobOrderId, req.body, req.user);

    res.status(201).json({
      success: true,
      message: 'Site installation and field delivery scheduled successfully',
      data: installation
    });
  } catch (error) {
    next(error);
  }
}

export async function getInstallations(req, res, next) {
  try {
    const result = await installationService.getSiteInstallations(req.query, req.query);
    res.status(200).json({
      success: true,
      message: 'Site installation records retrieved successfully',
      data: result.installations,
      meta: {
        total: result.total,
        page: result.page,
        pages: result.pages
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getInstallationById(req, res, next) {
  try {
    const installation = await installationService.getSiteInstallationById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Site installation detail retrieved successfully',
      data: installation
    });
  } catch (error) {
    next(error);
  }
}

export async function dispatchCrew(req, res, next) {
  try {
    const installation = await installationService.dispatchInstallationCrew(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Installation vehicle gate pass issued and cargo in transit',
      data: installation
    });
  } catch (error) {
    next(error);
  }
}

export async function updateChecklist(req, res, next) {
  try {
    const installation = await installationService.recordInstallationProgress(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'On-site installation progress and checklist updated',
      data: installation
    });
  } catch (error) {
    next(error);
  }
}

export async function submitNightTest(req, res, next) {
  try {
    const installation = await installationService.submitNightIlluminationTest(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Nighttime illumination and electrical test results recorded',
      data: installation
    });
  } catch (error) {
    next(error);
  }
}

export async function signHandover(req, res, next) {
  try {
    const result = await installationService.signHandoverCertificate(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Client handover signed successfully; Contractual warranty activated on JobOrder',
      data: result
    });
  } catch (error) {
    next(error);
  }
}
