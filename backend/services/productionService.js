import JobOrder from '../models/JobOrder.js';
import ProductionMachine from '../models/ProductionMachine.js';
import ProductionRequest from '../models/ProductionRequest.js';
import ClientOrder from '../models/ClientOrder.js';
import DesignProof from '../models/DesignProof.js';
import { generateCode, withTransaction } from '../utils/inventoryService.js';

// ==========================================
// 1. Job Order Services (Manufacturing Traveler)
// ==========================================

export async function releaseJobOrder(clientOrderId, user, options = {}) {
  const clientOrder = await ClientOrder.findById(clientOrderId);
  if (!clientOrder) {
    const error = new Error('Referenced ClientOrder does not exist');
    error.statusCode = 404;
    throw error;
  }

  if (clientOrder.spawnedJobOrderId) {
    const error = new Error(`JobOrder already released for this order (${clientOrder.spawnedJobOrderId})`);
    error.statusCode = 409;
    throw error;
  }

  // Manufacturing Release Gate Validation
  const hasAgreedProof = Boolean(clientOrder.designTask?.agreedDesignProofId);
  const financialStatus = clientOrder.productionClearance?.financialClearanceStatus;
  const isFinancialCleared =
    clientOrder.productionClearance?.isProductionAuthorized === true ||
    ['cleared_for_production', 'corporate_credit_approved', 'advance_deposit_cleared', 'fully_prepaid'].includes(financialStatus);

  if (!hasAgreedProof || !isFinancialCleared) {
    const error = new Error(
      `Manufacturing release gate not satisfied: both design proof lock and financial clearance (advance deposit or credit approval) are strictly required. Current state - Design Proof: ${hasAgreedProof ? 'Locked' : 'Pending'}, Financial Clearance: ${financialStatus || 'Pending'}`
    );
    error.statusCode = 422;
    throw error;
  }

  // Generate unique JobOrder & Warranty tracking numbers
  const jobOrderNumber = await generateCode('JOB', JobOrder, 'jobOrderNumber');
  const warrantyCode = await generateCode('WAR', JobOrder, 'warranty.warrantyCode');

  const scheduledStartDate = options.scheduledStartDate ? new Date(options.scheduledStartDate) : new Date();
  const targetCompletionDate = options.targetCompletionDate
    ? new Date(options.targetCompletionDate)
    : clientOrder.estimatedCompletionDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const workshopSupervisor = options.workshopSupervisor || user?.employeeId || user?._id;
  const assignedCrew = Array.isArray(options.assignedCrew) ? options.assignedCrew : [];

  const jobOrder = new JobOrder({
    jobOrderNumber,
    orderId: clientOrder._id,
    clientId: clientOrder.clientId,
    approvedDesignProofId: clientOrder.designTask.agreedDesignProofId,
    projectTitle: clientOrder.projectTitle,
    status: 'queued_for_materials',
    priority: clientOrder.priority || 'normal',
    materialRequisition: {
      materialsAllocated: false,
      actualMaterialCostETB: 0
    },
    workstationRouting: {
      machineFabrication: {
        status: 'pending',
        machineRunHours: 0
      },
      assemblyAndFinishing: {
        status: 'pending'
      },
      electricalAndQC: {
        status: 'pending',
        insulationResistanceTestPassed: false,
        illuminationBurnInTestHours: 0
      },
      packagingAndDispatch: {
        isPackaged: false,
        packagingType: options.packagingType || 'bubble_wrap_corrugated'
      }
    },
    scheduledStartDate,
    targetCompletionDate,
    actualStartDate: scheduledStartDate,
    fulfillment: {
      deliveryMethod: clientOrder.fulfillmentMethod || 'on_site_installation'
    },
    warranty: {
      warrantyCode,
      status: 'pending_activation',
      coverageDurationsMonths: {
        ledModulesMonths: 24,
        powerSupplyTransformerMonths: 12,
        siliconeNeonFlexMonths: 12,
        acrylicAndStructureMonths: 36
      },
      isVoided: false
    },
    workshopSupervisor,
    assignedCrew,
    authorizedBy: user?._id || user
  });

  const savedJobOrder = await jobOrder.save();

  // Link back to ClientOrder
  clientOrder.spawnedJobOrderId = savedJobOrder._id;
  clientOrder.status = 'in_production';
  await clientOrder.save();

  return {
    jobOrder: savedJobOrder,
    clientOrder
  };
}

export async function getJobOrders(filters = {}, pagination = {}) {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.clientId) query.clientId = filters.clientId;
  if (filters.orderId) query.orderId = filters.orderId;
  if (filters.materialsAllocated !== undefined) {
    query['materialRequisition.materialsAllocated'] = filters.materialsAllocated === 'true' || filters.materialsAllocated === true;
  }

  if (filters.search) {
    const term = filters.search.trim();
    query.$or = [
      { jobOrderNumber: { $regex: term, $options: 'i' } },
      { projectTitle: { $regex: term, $options: 'i' } }
    ];
  }

  const page = parseInt(pagination.page, 10) || 1;
  const limit = parseInt(pagination.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const sort = pagination.sort || { createdAt: -1 };

  const [jobOrders, total] = await Promise.all([
    JobOrder.find(query)
      .populate('clientId', 'clientCode displayName legalName primaryPhone')
      .populate('orderId', 'orderNumber orderType priority fulfillmentMethod')
      .populate('approvedDesignProofId', 'proofCode versionNumber presentationMedia productionFiles')
      .populate('workshopSupervisor', 'name firstName lastName primaryPhone')
      .populate('authorizedBy', 'name username role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    JobOrder.countDocuments(query)
  ]);

  return {
    jobOrders,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

export async function getJobOrderById(id) {
  const jobOrder = await JobOrder.findById(id)
    .populate('clientId')
    .populate('orderId')
    .populate('approvedDesignProofId')
    .populate('workshopSupervisor')
    .populate('assignedCrew')
    .populate('authorizedBy', 'name username role');

  if (!jobOrder) {
    const error = new Error('JobOrder not found');
    error.statusCode = 404;
    throw error;
  }

  const productionRequests = await ProductionRequest.find({ jobOrderId: jobOrder._id })
    .populate('machineSelection.machineId', 'machineCode machineName machineType')
    .populate('machineSelection.assignedOperator', 'name firstName lastName')
    .populate('finishingTasks.assignedCraftsman', 'name firstName lastName')
    .sort({ createdAt: -1 });

  return {
    jobOrder,
    productionRequests
  };
}

export async function updateJobOrderStatus(id, updateData, user) {
  const jobOrder = await JobOrder.findById(id);
  if (!jobOrder) {
    const error = new Error('JobOrder not found');
    error.statusCode = 404;
    throw error;
  }

  if (updateData.status) {
    jobOrder.status = updateData.status;
    if (['installation_completed', 'closed'].includes(updateData.status)) {
      jobOrder.actualCompletionDate = new Date();
    }
  }

  if (updateData.workstationRouting) {
    jobOrder.workstationRouting = {
      ...jobOrder.workstationRouting.toObject(),
      ...updateData.workstationRouting
    };
  }

  return await jobOrder.save();
}

// ==========================================
// 2. Production Machine Asset Registry
// ==========================================

export async function registerProductionMachine(machineData, user) {
  const machineCode = machineData.machineCode || (await generateCode('MCH', ProductionMachine, 'machineCode'));

  const machine = new ProductionMachine({
    ...machineData,
    machineCode
  });

  return await machine.save();
}

export async function getProductionMachines(filters = {}, pagination = {}) {
  const query = {};

  if (filters.machineType) query.machineType = filters.machineType;
  if (filters.currentOperationalStatus) query.currentOperationalStatus = filters.currentOperationalStatus;

  if (filters.search) {
    const term = filters.search.trim();
    query.$or = [
      { machineCode: { $regex: term, $options: 'i' } },
      { machineName: { $regex: term, $options: 'i' } }
    ];
  }

  const page = parseInt(pagination.page, 10) || 1;
  const limit = parseInt(pagination.limit, 10) || 50;
  const skip = (page - 1) * limit;
  const sort = pagination.sort || { machineCode: 1 };

  const [machines, total] = await Promise.all([
    ProductionMachine.find(query)
      .populate('assignedLeadOperator', 'name firstName lastName primaryPhone')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    ProductionMachine.countDocuments(query)
  ]);

  return {
    machines,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

export async function getProductionMachineById(id) {
  const machine = await ProductionMachine.findById(id).populate('assignedLeadOperator');
  if (!machine) {
    const error = new Error('Production machine not found');
    error.statusCode = 404;
    throw error;
  }
  return machine;
}

export async function updateMachineStatus(id, statusData, user) {
  const machine = await ProductionMachine.findById(id);
  if (!machine) {
    const error = new Error('Production machine not found');
    error.statusCode = 404;
    throw error;
  }

  if (statusData.currentOperationalStatus || statusData.status) {
    machine.currentOperationalStatus = statusData.currentOperationalStatus || statusData.status;
  }

  if (statusData.additionalOperatingHours) {
    machine.totalOperatingHours = (machine.totalOperatingHours || 0) + Number(statusData.additionalOperatingHours);
  }

  if (statusData.maintenanceSchedule) {
    machine.maintenanceSchedule = {
      ...machine.maintenanceSchedule?.toObject(),
      ...statusData.maintenanceSchedule
    };
  }

  return await machine.save();
}

// ==========================================
// 3. Production Request Travelers & Shop-Floor Execution
// ==========================================

export async function createProductionRequest(jobOrderId, requestData, user) {
  const jobOrder = await JobOrder.findById(jobOrderId);
  if (!jobOrder) {
    const error = new Error('Referenced JobOrder does not exist');
    error.statusCode = 404;
    throw error;
  }

  const proof = await DesignProof.findById(jobOrder.approvedDesignProofId);
  if (!proof) {
    const error = new Error('Referenced DesignProof for JobOrder does not exist');
    error.statusCode = 404;
    throw error;
  }

  const productionRequestCode = await generateCode('PRQ', ProductionRequest, 'productionRequestCode');

  // Auto-extract sizing from proof if not explicitly provided
  const widthCm = Number(requestData.submittedDimensions?.finishedDimensions?.widthCm) || Number(proof.engineeringSpecs?.overallWidthCm) || 100;
  const heightCm = Number(requestData.submittedDimensions?.finishedDimensions?.heightCm) || Number(proof.engineeringSpecs?.overallHeightCm) || 100;
  const depthReturnCm = Number(requestData.submittedDimensions?.finishedDimensions?.depthReturnCm) || Number(proof.engineeringSpecs?.returnDepthCm) || 10;
  const quantityUnits = Number(requestData.submittedDimensions?.quantityUnits) || 1;
  const totalFabricatedAreaSqM = Number(requestData.submittedDimensions?.finishedDimensions?.totalFabricatedAreaSqM) || Math.round(((widthCm * heightCm * quantityUnits) / 10000) * 100) / 100;

  const toolpathCutFileUrl =
    requestData.machineSelection?.toolpathCutFileUrl ||
    proof.productionFiles?.cncLaserVectorCutUrl ||
    proof.productionFiles?.letterFaceCutPath ||
    proof.presentationMedia?.technicalDrawingPdfUrl ||
    'https://cdn.vector.et/cut-files/default.dxf';

  const productionRequest = new ProductionRequest({
    productionRequestCode,
    jobOrderId: jobOrder._id,
    jobOrderNumber: jobOrder.jobOrderNumber,
    clientOrderId: jobOrder.orderId,
    designProofId: proof._id,
    requestTitle: requestData.requestTitle || `${jobOrder.projectTitle} - Shopfloor Traveler`,
    priority: requestData.priority || jobOrder.priority || 'normal',
    status: 'submitted_to_shopfloor',
    submittedDimensions: {
      finishedDimensions: {
        widthCm,
        heightCm,
        depthReturnCm,
        totalFabricatedAreaSqM
      },
      thicknessSpecifications: {
        faceThicknessMm: Number(requestData.submittedDimensions?.thicknessSpecifications?.faceThicknessMm) || Number(proof.engineeringSpecs?.acrylicThicknessMm) || 3,
        backerThicknessMm: Number(requestData.submittedDimensions?.thicknessSpecifications?.backerThicknessMm) || Number(proof.engineeringSpecs?.backerThicknessMm) || 10,
        metalReturnGaugeMm: Number(requestData.submittedDimensions?.thicknessSpecifications?.metalReturnGaugeMm) || 1,
        neonChannelDepthMm: Number(requestData.submittedDimensions?.thicknessSpecifications?.neonChannelDepthMm) || 12
      },
      quantityUnits,
      machineBedNestingLayout: requestData.submittedDimensions?.machineBedNestingLayout || {
        rawSheetWidthCm: 122,
        rawSheetLengthCm: 244,
        sheetsRequiredCount: 1,
        estimatedNestingYieldPercentage: 85
      }
    },
    submittedMaterials: requestData.submittedMaterials || [],
    machineSelection: {
      ...requestData.machineSelection,
      toolpathCutFileUrl,
      machiningExecution: {
        operationStatus: 'idle_awaiting_job',
        ...requestData.machineSelection?.machiningExecution
      }
    },
    finishingTasks: (requestData.finishingTasks || []).map((task, idx) => ({
      ...task,
      taskNumber: task.taskNumber || `FT-${String(idx + 1).padStart(2, '0')}`,
      status: task.status || 'assigned'
    })),
    qualityClearance: {
      isQcPassed: false,
      illuminationBurnInTestHours: 4,
      illuminationUniformityVerified: false,
      weatherproofSiliconeSealed: false,
      acrylicSurfaceFreeOfScratches: false
    },
    workshopSupervisor: requestData.workshopSupervisor || jobOrder.workshopSupervisor,
    submittedBy: user?._id || user,
    scheduledTargetDate: requestData.scheduledTargetDate ? new Date(requestData.scheduledTargetDate) : jobOrder.targetCompletionDate
  });

  return await productionRequest.save();
}

export async function getProductionRequests(filters = {}, pagination = {}) {
  const query = {};

  if (filters.jobOrderId) query.jobOrderId = filters.jobOrderId;
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.machineId) query['machineSelection.machineId'] = filters.machineId;

  if (filters.search) {
    const term = filters.search.trim();
    query.$or = [
      { productionRequestCode: { $regex: term, $options: 'i' } },
      { jobOrderNumber: { $regex: term, $options: 'i' } },
      { requestTitle: { $regex: term, $options: 'i' } }
    ];
  }

  const page = parseInt(pagination.page, 10) || 1;
  const limit = parseInt(pagination.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const sort = pagination.sort || { createdAt: -1 };

  const [productionRequests, total] = await Promise.all([
    ProductionRequest.find(query)
      .populate('jobOrderId', 'jobOrderNumber projectTitle status priority')
      .populate('designProofId', 'proofCode versionNumber presentationMedia')
      .populate('machineSelection.machineId', 'machineCode machineName machineType')
      .populate('machineSelection.assignedOperator', 'name firstName lastName')
      .populate('workshopSupervisor', 'name firstName lastName')
      .populate('submittedBy', 'name username role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    ProductionRequest.countDocuments(query)
  ]);

  return {
    productionRequests,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

export async function getProductionRequestById(id) {
  const request = await ProductionRequest.findById(id)
    .populate('jobOrderId')
    .populate('clientOrderId')
    .populate('designProofId')
    .populate('machineSelection.machineId')
    .populate('machineSelection.assignedOperator')
    .populate('finishingTasks.assignedCraftsman')
    .populate('qualityClearance.inspectedBy')
    .populate('workshopSupervisor')
    .populate('submittedBy', 'name username role');

  if (!request) {
    const error = new Error('ProductionRequest not found');
    error.statusCode = 404;
    throw error;
  }

  return request;
}

export async function recordMachineExecution(requestId, executionData, user) {
  const request = await ProductionRequest.findById(requestId);
  if (!request) {
    const error = new Error('ProductionRequest not found');
    error.statusCode = 404;
    throw error;
  }

  const machineRunMinutes = Number(executionData.machineRunMinutes) || 0;
  const linearCutMeters = Number(executionData.linearCutMeters) || 0;
  const operationStatus = executionData.operationStatus === 'machine_completed' ? 'completed' : (executionData.operationStatus || 'completed');

  request.machineSelection.machiningExecution = {
    ...request.machineSelection.machiningExecution?.toObject(),
    operationStatus,
    toolingSpecs: executionData.toolingSpecs || request.machineSelection.machiningExecution?.toolingSpecs,
    actualStartTime: executionData.actualStartTime || request.machineSelection.machiningExecution?.actualStartTime || new Date(),
    actualEndTime: executionData.actualEndTime || new Date(),
    machineRunMinutes,
    linearCutMeters,
    scrapAndWaste: executionData.scrapAndWaste || request.machineSelection.machiningExecution?.scrapAndWaste || {},
    operatorNotes: executionData.operatorNotes || request.machineSelection.machiningExecution?.operatorNotes || ''
  };

  if (operationStatus === 'completed') {
    request.status = request.finishingTasks?.length > 0 ? 'finishing_in_progress' : 'machine_completed';
  } else if (operationStatus === 'running_cutting') {
    request.status = 'machine_in_progress';
  }

  await request.save();

  // Update machine operating hours
  if (request.machineSelection?.machineId && machineRunMinutes > 0) {
    const machine = await ProductionMachine.findById(request.machineSelection.machineId);
    if (machine) {
      const addedHours = Math.round((machineRunMinutes / 60) * 100) / 100;
      machine.totalOperatingHours = (machine.totalOperatingHours || 0) + addedHours;
      machine.currentOperationalStatus = operationStatus === 'running_cutting' ? 'in_production' : 'idle';
      await machine.save();
    }
  }

  // Update JobOrder routing status
  const jobOrder = await JobOrder.findById(request.jobOrderId);
  if (jobOrder) {
    jobOrder.workstationRouting.machineFabrication.status =
      operationStatus === 'completed' ? 'completed' : 'in_progress';
    jobOrder.workstationRouting.machineFabrication.machineRunHours =
      (jobOrder.workstationRouting.machineFabrication.machineRunHours || 0) + Math.round((machineRunMinutes / 60) * 100) / 100;

    if (operationStatus === 'completed') {
      jobOrder.workstationRouting.assemblyAndFinishing.status = 'in_progress';
      jobOrder.status = 'in_assembly_and_wiring';
    } else {
      jobOrder.status = 'in_machine_cutting';
    }
    await jobOrder.save();
  }

  return request;
}

export async function updateFinishingTaskStatus(requestId, taskIdentifier, statusData, user) {
  const request = await ProductionRequest.findById(requestId);
  if (!request) {
    const error = new Error('ProductionRequest not found');
    error.statusCode = 404;
    throw error;
  }

  const task = request.finishingTasks.find(
    (t) => t.taskNumber === taskIdentifier || t._id.toString() === taskIdentifier
  );

  if (!task) {
    const error = new Error(`Finishing task ${taskIdentifier} not found`);
    error.statusCode = 404;
    throw error;
  }

  if (statusData.status) task.status = statusData.status;
  if (statusData.durationMinutes) task.durationMinutes = Number(statusData.durationMinutes);
  if (statusData.craftsmanNotes) task.craftsmanNotes = statusData.craftsmanNotes;
  if (statusData.verificationPhotoUrl) task.verificationPhotoUrl = statusData.verificationPhotoUrl;

  if (statusData.benchElectricalCheck) {
    task.benchElectricalCheck = {
      ...task.benchElectricalCheck?.toObject(),
      ...statusData.benchElectricalCheck,
      testedOnBench: true
    };
  }

  if (task.status === 'completed' && !task.completedAt) {
    task.completedAt = new Date();
  }

  // Check if all finishing tasks are completed
  const allTasksCompleted = request.finishingTasks.every((t) => t.status === 'completed');
  if (allTasksCompleted) {
    request.status = 'finishing_completed';
  }

  await request.save();

  // Update JobOrder routing status
  const jobOrder = await JobOrder.findById(request.jobOrderId);
  if (jobOrder) {
    if (allTasksCompleted) {
      jobOrder.workstationRouting.assemblyAndFinishing.status = 'completed';
      jobOrder.workstationRouting.electricalAndQC.status = 'in_progress';
      jobOrder.status = 'in_electrical_and_qc_testing';
    } else {
      jobOrder.workstationRouting.assemblyAndFinishing.status = 'in_progress';
    }
    await jobOrder.save();
  }

  return request;
}

export async function submitQualityControlClearance(requestId, qcData, user) {
  const request = await ProductionRequest.findById(requestId);
  if (!request) {
    const error = new Error('ProductionRequest not found');
    error.statusCode = 404;
    throw error;
  }

  const burnInHours = Number(qcData.illuminationBurnInTestHours);
  if (isNaN(burnInHours) || burnInHours < 4) {
    const error = new Error('Minimum 4 hours electrical burn-in testing is mandatory for QC sign-off');
    error.statusCode = 400;
    throw error;
  }

  const megaOhms = Number(qcData.insulationResistanceTestMegaOhms);
  if (isNaN(megaOhms) || megaOhms < 2.0) {
    const error = new Error('Insulation resistance Megger test must be at least 2.0 MΩ (Megohms) for factory clearance');
    error.statusCode = 400;
    throw error;
  }

  if (!qcData.illuminationUniformityVerified) {
    const error = new Error('Illumination uniformity verification is required for optical quality clearance');
    error.statusCode = 400;
    throw error;
  }

  request.qualityClearance = {
    isQcPassed: true,
    inspectedBy: qcData.inspectedBy || user?.employeeId || user?._id,
    inspectedAt: new Date(),
    illuminationBurnInTestHours: burnInHours,
    illuminationUniformityVerified: true,
    insulationResistanceTestMegaOhms: megaOhms,
    weatherproofSiliconeSealed: Boolean(qcData.weatherproofSiliconeSealed),
    acrylicSurfaceFreeOfScratches: Boolean(qcData.acrylicSurfaceFreeOfScratches),
    qcInspectorNotes: qcData.qcInspectorNotes || 'Passed all electrical, thermal, and optical QC clearance tests',
    evidenceId: qcData.evidenceId || null
  };

  request.status = 'qc_cleared';
  request.actualCompletedDate = new Date();
  await request.save();

  // Update JobOrder
  const jobOrder = await JobOrder.findById(request.jobOrderId);
  if (jobOrder) {
    jobOrder.workstationRouting.electricalAndQC.status = 'passed';
    jobOrder.workstationRouting.electricalAndQC.insulationResistanceTestPassed = true;
    jobOrder.workstationRouting.electricalAndQC.illuminationBurnInTestHours = burnInHours;
    jobOrder.workstationRouting.electricalAndQC.qcSignOffDate = new Date();
    jobOrder.workstationRouting.electricalAndQC.inspector = qcData.inspectedBy || user?.employeeId;

    jobOrder.workstationRouting.packagingAndDispatch.isPackaged = true;
    jobOrder.workstationRouting.packagingAndDispatch.readyForDispatchDate = new Date();
    jobOrder.status = 'ready_for_dispatch';

    await jobOrder.save();
  }

  return {
    productionRequest: request,
    jobOrder
  };
}
