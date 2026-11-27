import SiteInstallation from '../models/SiteInstallation.js';
import JobOrder from '../models/JobOrder.js';
import ClientOrder from '../models/ClientOrder.js';
import Client from '../models/Client.js';
import SiteSurvey from '../models/SiteSurvey.js';
import { generateCode, withTransaction } from '../utils/inventoryService.js';

// ==========================================
// 1. Site Installation & Logistics Services
// ==========================================

export async function createSiteInstallation(jobOrderId, installData, user) {
  const jobOrder = await JobOrder.findById(jobOrderId);
  if (!jobOrder) {
    const error = new Error('Referenced JobOrder does not exist');
    error.statusCode = 404;
    throw error;
  }

  const client = await Client.findById(jobOrder.clientId);
  const clientOrder = await ClientOrder.findById(jobOrder.orderId);
  const siteSurvey = clientOrder?.siteSurveyId ? await SiteSurvey.findById(clientOrder.siteSurveyId) : null;

  const installationCode = await generateCode('INS', SiteInstallation, 'installationCode');

  // Auto-inherit destination address & coordinates
  const address =
    installData.destination?.address ||
    clientOrder?.deliveryAddress ||
    [client?.address?.buildingName, client?.address?.subcity, client?.address?.city].filter(Boolean).join(', ') ||
    'Client installation site, Addis Ababa';

  const destination = {
    address,
    gpsCoordinates: installData.destination?.gpsCoordinates || siteSurvey?.siteLocation?.gpsCoordinates || client?.address?.gpsCoordinates || {},
    siteContactPerson: installData.destination?.siteContactPerson || {
      name: client?.contactPersons?.[0]?.name || client?.displayName,
      phone: client?.contactPersons?.[0]?.mobilePhone || client?.primaryPhone
    }
  };

  // Build cargo manifest
  const cargoManifest = (installData.logistics?.cargoManifest || []).length > 0
    ? installData.logistics.cargoManifest
    : (clientOrder?.requestedItems || []).map((item) => ({
        itemDescription: item.itemTitle || 'Finished Signage Element',
        quantity: item.quantity || 1,
        packagingType: jobOrder.workstationRouting?.packagingAndDispatch?.packagingType || 'bubble_wrap_corrugated',
        verifiedLoaded: true
      }));

  const siteInstallation = new SiteInstallation({
    installationCode,
    jobOrderId: jobOrder._id,
    jobOrderNumber: jobOrder.jobOrderNumber,
    clientId: jobOrder.clientId,
    siteSurveyId: siteSurvey?._id || clientOrder?.siteSurveyId || null,
    serviceType: installData.serviceType || 'delivery_and_installation',
    status: 'scheduled',
    logistics: {
      vehicleType: installData.logistics?.vehicleType || 'pickup_truck',
      plateNumber: installData.logistics?.plateNumber || '',
      assignedDriver: installData.logistics?.assignedDriver,
      workshopGatePassNumber: installData.logistics?.workshopGatePassNumber || '',
      cargoManifest
    },
    destination,
    leadTechnician: installData.leadTechnician || user?.employeeId || user?._id,
    electricianEmployeeId: installData.electricianEmployeeId || null,
    crewMembers: installData.crewMembers || [],
    accessEquipmentUsed: installData.accessEquipmentUsed || (siteSurvey?.installationAccess?.recommendedAccessEquipment?.[0] || 'ground_level'),
    equipmentRentalDetails: installData.equipmentRentalDetails || '',
    generatorDeployed: Boolean(installData.generatorDeployed),
    checklist: {
      templateAlignedLevel: false,
      anchorsSecureTorqued: false,
      wiringConcealedProtected: false,
      transformersGroundedIP67: false,
      siliconeSealingComplete: false,
      polarityAndVoltageVerified: false,
      timerPhotocellCalibrated: false,
      siteCleanedDebrisRemoved: false
    },
    illuminationTest: {
      testedAtNight: true,
      illuminationUniformity: 'perfect_no_hotspots'
    },
    completedBy: user?._id || user
  });

  const savedInstallation = await siteInstallation.save();

  // Link to JobOrder
  jobOrder.fulfillment.siteInstallationId = savedInstallation._id;
  await jobOrder.save();

  return savedInstallation;
}

export async function getSiteInstallations(filters = {}, pagination = {}) {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.jobOrderId) query.jobOrderId = filters.jobOrderId;
  if (filters.clientId) query.clientId = filters.clientId;
  if (filters.serviceType) query.serviceType = filters.serviceType;
  if (filters.leadTechnician) query.leadTechnician = filters.leadTechnician;
  if (filters.assignedDriver) query['logistics.assignedDriver'] = filters.assignedDriver;

  if (filters.search) {
    const term = filters.search.trim();
    query.$or = [
      { installationCode: { $regex: term, $options: 'i' } },
      { jobOrderNumber: { $regex: term, $options: 'i' } },
      { 'destination.address': { $regex: term, $options: 'i' } },
      { 'destination.siteContactPerson.name': { $regex: term, $options: 'i' } }
    ];
  }

  const page = parseInt(pagination.page, 10) || 1;
  const limit = parseInt(pagination.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const sort = pagination.sort || { createdAt: -1 };

  const [installations, total] = await Promise.all([
    SiteInstallation.find(query)
      .populate('jobOrderId', 'jobOrderNumber projectTitle status priority')
      .populate('clientId', 'clientCode displayName legalName primaryPhone')
      .populate('logistics.assignedDriver', 'name firstName lastName primaryPhone')
      .populate('leadTechnician', 'name firstName lastName primaryPhone')
      .populate('electricianEmployeeId', 'name firstName lastName primaryPhone')
      .populate('crewMembers', 'name firstName lastName')
      .populate('completedBy', 'name username role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    SiteInstallation.countDocuments(query)
  ]);

  return {
    installations,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

export async function getSiteInstallationById(id) {
  const installation = await SiteInstallation.findById(id)
    .populate('jobOrderId')
    .populate('clientId')
    .populate('siteSurveyId')
    .populate('logistics.assignedDriver')
    .populate('leadTechnician')
    .populate('electricianEmployeeId')
    .populate('crewMembers')
    .populate('completedBy', 'name username role');

  if (!installation) {
    const error = new Error('SiteInstallation not found');
    error.statusCode = 404;
    throw error;
  }

  return installation;
}

export async function dispatchInstallationCrew(installationId, dispatchData = {}, user) {
  const installation = await SiteInstallation.findById(installationId);
  if (!installation) {
    const error = new Error('SiteInstallation not found');
    error.statusCode = 404;
    throw error;
  }

  const gatePass = dispatchData.workshopGatePassNumber || (await generateCode('GP', SiteInstallation, 'logistics.workshopGatePassNumber'));

  installation.logistics.plateNumber = dispatchData.plateNumber || installation.logistics.plateNumber;
  installation.logistics.workshopGatePassNumber = gatePass;
  installation.logistics.departureFromWorkshopTime = dispatchData.departureFromWorkshopTime || new Date();
  installation.status = 'cargo_loaded_in_transit';
  await installation.save();

  // Update JobOrder status
  const jobOrder = await JobOrder.findById(installation.jobOrderId);
  if (jobOrder) {
    jobOrder.status = 'out_for_delivery_or_installation';
    await jobOrder.save();
  }

  return installation;
}

export async function recordInstallationProgress(installationId, progressData = {}, user) {
  const installation = await SiteInstallation.findById(installationId);
  if (!installation) {
    const error = new Error('SiteInstallation not found');
    error.statusCode = 404;
    throw error;
  }

  if (progressData.arrivalAtSiteTime) {
    installation.logistics.arrivalAtSiteTime = new Date(progressData.arrivalAtSiteTime);
    installation.status = 'on_site_arrived_and_prep';
  }

  if (progressData.status) {
    installation.status = progressData.status;
  }

  if (progressData.checklist) {
    installation.checklist = {
      ...installation.checklist?.toObject(),
      ...progressData.checklist
    };
  }

  return await installation.save();
}

export async function submitNightIlluminationTest(installationId, testData = {}, user) {
  const installation = await SiteInstallation.findById(installationId);
  if (!installation) {
    const error = new Error('SiteInstallation not found');
    error.statusCode = 404;
    throw error;
  }

  installation.illuminationTest = {
    testedAtNight: true,
    illuminationUniformity: testData.illuminationUniformity || 'perfect_no_hotspots',
    voltageMeasuredAtEndLetter: Number(testData.voltageMeasuredAtEndLetter) || 12.0,
    currentDrawAmperes: Number(testData.currentDrawAmperes) || 0,
    totalPowerWatts: Number(testData.totalPowerWatts) || 0
  };

  installation.status = 'testing_illumination';
  return await installation.save();
}

export async function signHandoverCertificate(installationId, handoverData, user) {
  return await withTransaction(async (session) => {
    const installation = await SiteInstallation.findById(installationId).session(session);
    if (!installation) {
      const error = new Error('SiteInstallation not found');
      error.statusCode = 404;
      throw error;
    }

    const acceptanceDate = handoverData.acceptanceDate ? new Date(handoverData.acceptanceDate) : new Date();
    const condition = handoverData.condition || 'accepted_flawless';

    installation.handoverCertificate = {
      clientRepresentativeName: handoverData.clientRepresentativeName,
      clientRepresentativeTitle: handoverData.clientRepresentativeTitle || 'Authorized Client Representative',
      clientRepresentativePhone: handoverData.clientRepresentativePhone,
      acceptanceDate,
      condition,
      clientComments: handoverData.clientComments || '',
      snagList: handoverData.snagList || [],
      snagResolutionDeadline: handoverData.snagResolutionDeadline || null,
      clientDigitalSignatureUrl: handoverData.clientDigitalSignatureUrl,
      leadTechnicianSignatureUrl: handoverData.leadTechnicianSignatureUrl || ''
    };

    installation.status = 'handover_signed';
    await installation.save({ session });

    // Find linked JobOrder
    const jobOrder = await JobOrder.findById(installation.jobOrderId).session(session);
    if (!jobOrder) {
      const error = new Error('Referenced JobOrder not found');
      error.statusCode = 404;
      throw error;
    }

    // Rule 1 Warranty Activation:
    // When installation is accepted, activate warranty and compute 4 component expiration dates
    if (['accepted_flawless', 'conditional_acceptance_minor_snags'].includes(condition)) {
      const coverage = jobOrder.warranty?.coverageDurationsMonths || {
        ledModulesMonths: 24,
        powerSupplyTransformerMonths: 12,
        siliconeNeonFlexMonths: 12,
        acrylicAndStructureMonths: 36
      };

      const addMonths = (date, months) => {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
      };

      jobOrder.warranty.status = 'active_under_warranty';
      jobOrder.warranty.warrantyStartDate = acceptanceDate;
      jobOrder.warranty.expirationDeadlines = {
        transformerExpiry: addMonths(acceptanceDate, coverage.powerSupplyTransformerMonths || 12),
        neonFlexExpiry: addMonths(acceptanceDate, coverage.siliconeNeonFlexMonths || 12),
        ledModulesExpiry: addMonths(acceptanceDate, coverage.ledModulesMonths || 24),
        structuralExpiry: addMonths(acceptanceDate, coverage.acrylicAndStructureMonths || 36)
      };

      const warrantyCode = jobOrder.warranty.warrantyCode || (await generateCode('WAR', JobOrder, 'warranty.warrantyCode'));
      jobOrder.warranty.warrantyCode = warrantyCode;
      jobOrder.warranty.scannableQrCodeUrl = `https://warranty.vector.et/verify/${warrantyCode}`;

      jobOrder.fulfillment.handoverSignOffDate = acceptanceDate;
      jobOrder.actualCompletionDate = acceptanceDate;
      jobOrder.status = 'installation_completed';
      await jobOrder.save({ session });

      // Update ClientOrder
      const clientOrder = await ClientOrder.findById(jobOrder.orderId).session(session);
      if (clientOrder) {
        clientOrder.actualCompletedDate = acceptanceDate;
        clientOrder.status = 'completed';
        await clientOrder.save({ session });
      }
    }

    return {
      installation,
      jobOrder
    };
  });
}
