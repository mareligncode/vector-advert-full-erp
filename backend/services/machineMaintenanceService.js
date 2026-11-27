import MachineMaintenanceSchedule from '../models/MachineMaintenanceSchedule.js';
import MachineMaintenanceLog from '../models/MachineMaintenanceLog.js';
import MachineRepairOrder from '../models/MachineRepairOrder.js';
import ProductionMachine from '../models/ProductionMachine.js';
import StockItem from '../models/StockItem.js';
import Employee from '../models/Employee.js';

/**
 * Auto-generate code helpers
 */
const generateScheduleCode = async () => {
  const year = new Date().getFullYear();
  const count = await MachineMaintenanceSchedule.countDocuments();
  return `MMS-${year}-${String(count + 1).padStart(4, '0')}`;
};

const generateLogCode = async () => {
  const year = new Date().getFullYear();
  const count = await MachineMaintenanceLog.countDocuments();
  return `MML-${year}-${String(count + 1).padStart(4, '0')}`;
};

const generateRepairOrderCode = async () => {
  const year = new Date().getFullYear();
  const count = await MachineRepairOrder.countDocuments();
  return `MRO-${year}-${String(count + 1).padStart(4, '0')}`;
};

/**
 * 1. Create Maintenance Schedule Template
 */
export const createMaintenanceSchedule = async (scheduleData) => {
  const machine = await ProductionMachine.findById(scheduleData.machineId);
  if (!machine) {
    const error = new Error(`Production machine not found with ID: ${scheduleData.machineId}`);
    error.statusCode = 404;
    throw error;
  }

  const scheduleCode = scheduleData.scheduleCode || (await generateScheduleCode());

  const schedule = await MachineMaintenanceSchedule.create({
    scheduleCode,
    machineId: machine._id,
    machineType: scheduleData.machineType || machine.machineType,
    frequency: scheduleData.frequency,
    scheduleTitle: scheduleData.scheduleTitle,
    estimatedDurationMinutes: scheduleData.estimatedDurationMinutes || 30,
    checklistTemplate: scheduleData.checklistTemplate || [],
    assignedRole: scheduleData.assignedRole || 'machine_operator',
    isActive: scheduleData.isActive !== undefined ? scheduleData.isActive : true
  });

  return schedule;
};

/**
 * 2. Get Maintenance Schedules
 */
export const getMaintenanceSchedules = async (query = {}) => {
  const filter = {};
  if (query.machineId) filter.machineId = query.machineId;
  if (query.machineType) filter.machineType = query.machineType;
  if (query.frequency) filter.frequency = query.frequency;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true' || query.isActive === true;

  const schedules = await MachineMaintenanceSchedule.find(filter)
    .populate('machineId', 'machineCode machineName machineType currentOperationalStatus')
    .sort({ createdAt: -1 });

  return schedules;
};

/**
 * 3. Record Maintenance Log
 * Captures operator checklist, numeric parameters, and updates machine maintenance schedule.
 * If supervisorCertified is passed or certified later, Rule 1 interlock unlocks machine to 'idle'.
 */
export const recordMaintenanceLog = async (logData, user) => {
  const machine = await ProductionMachine.findById(logData.machineId);
  if (!machine) {
    const error = new Error(`Machine not found with ID: ${logData.machineId}`);
    error.statusCode = 404;
    throw error;
  }

  const logCode = logData.logCode || (await generateLogCode());
  const performedDate = logData.performedDate ? new Date(logData.performedDate) : new Date();

  let conductedBy = logData.conductedBy || user?.employeeId;
  if (!conductedBy && user?.email) {
    const emp = await Employee.findOne({ email: user.email });
    if (emp) conductedBy = emp._id;
  }

  let supervisorEmployeeId = logData.supervisorEmployeeId;
  if (!supervisorEmployeeId && logData.supervisorCertified && user?.email) {
    const emp = await Employee.findOne({ email: user.email });
    if (emp) supervisorEmployeeId = emp._id;
  }

  const maintenanceLog = await MachineMaintenanceLog.create({
    logCode,
    machineId: machine._id,
    scheduleId: logData.scheduleId || null,
    frequency: logData.frequency || 'daily_pre_shift',
    machineOperatingHoursAtLog: logData.machineOperatingHoursAtLog || machine.totalOperatingHours || 0,
    conductedBy,
    performedDate,
    shift: logData.shift || 'morning_pre_shift',
    checklistResults: logData.checklistResults || [],
    environmentalParameters: logData.environmentalParameters || {},
    supervisorCertified: Boolean(logData.supervisorCertified),
    supervisorEmployeeId,
    certifiedAt: logData.supervisorCertified ? new Date() : null,
    overallResult: logData.overallResult || 'passed_ready_for_production',
    supervisorNotes: logData.supervisorNotes || '',
    evidenceId: logData.evidenceId || null
  });

  // Calculate next maintenance due date
  const nextDueDate = new Date(performedDate);
  switch (logData.frequency) {
    case 'daily_pre_shift':
    case 'daily_post_shift':
      nextDueDate.setDate(nextDueDate.getDate() + 1);
      break;
    case 'weekly':
      nextDueDate.setDate(nextDueDate.getDate() + 7);
      break;
    case 'monthly':
      nextDueDate.setDate(nextDueDate.getDate() + 30);
      break;
    case 'quarterly':
      nextDueDate.setDate(nextDueDate.getDate() + 90);
      break;
    case 'semi_annual':
      nextDueDate.setDate(nextDueDate.getDate() + 180);
      break;
    case 'annual_overhaul':
      nextDueDate.setDate(nextDueDate.getDate() + 365);
      break;
    default:
      nextDueDate.setDate(nextDueDate.getDate() + 1);
  }

  machine.maintenanceSchedule = {
    lastMaintenanceDate: performedDate,
    nextMaintenanceDueDate: nextDueDate,
    maintenanceNotes: `Last serviced under log ${logCode}`
  };

  // Rule 1: If supervisor certified and passed, unlock machine to 'idle'
  if (maintenanceLog.supervisorCertified && maintenanceLog.overallResult === 'passed_ready_for_production') {
    if (machine.currentOperationalStatus === 'maintenance_hold') {
      machine.currentOperationalStatus = 'idle';
    }
  } else if (maintenanceLog.overallResult === 'failed_locked_for_repair') {
    machine.currentOperationalStatus = 'maintenance_hold';
  }

  await machine.save();

  return { maintenanceLog, machine };
};

/**
 * 4. Certify Maintenance Log (Supervisor verification & machine unlock)
 */
export const certifyMaintenanceLog = async (logId, certificationData, user) => {
  const maintenanceLog = await MachineMaintenanceLog.findById(logId);
  if (!maintenanceLog) {
    const error = new Error(`Maintenance log not found with ID: ${logId}`);
    error.statusCode = 404;
    throw error;
  }

  const machine = await ProductionMachine.findById(maintenanceLog.machineId);
  if (!machine) {
    const error = new Error(`Associated machine not found with ID: ${maintenanceLog.machineId}`);
    error.statusCode = 404;
    throw error;
  }

  let supervisorEmployeeId = certificationData.supervisorEmployeeId || user?.employeeId;
  if (!supervisorEmployeeId && user?.email) {
    const emp = await Employee.findOne({ email: user.email });
    if (emp) supervisorEmployeeId = emp._id;
  }

  maintenanceLog.supervisorCertified = true;
  maintenanceLog.supervisorEmployeeId = supervisorEmployeeId || null;
  maintenanceLog.certifiedAt = new Date();
  if (certificationData.overallResult) {
    maintenanceLog.overallResult = certificationData.overallResult;
  }
  if (certificationData.supervisorNotes) {
    maintenanceLog.supervisorNotes = certificationData.supervisorNotes;
  }

  // Rule 1: If passed ready for production, flip machine status to idle
  if (maintenanceLog.overallResult === 'passed_ready_for_production') {
    if (machine.currentOperationalStatus === 'maintenance_hold') {
      machine.currentOperationalStatus = 'idle';
    }
  } else if (maintenanceLog.overallResult === 'failed_locked_for_repair') {
    machine.currentOperationalStatus = 'maintenance_hold';
  }

  await maintenanceLog.save();
  await machine.save();

  return { maintenanceLog, machine };
};

/**
 * 5. Query Maintenance Logs
 */
export const getMaintenanceLogs = async (query = {}) => {
  const filter = {};
  if (query.machineId) filter.machineId = query.machineId;
  if (query.frequency) filter.frequency = query.frequency;
  if (query.overallResult) filter.overallResult = query.overallResult;
  if (query.supervisorCertified !== undefined) {
    filter.supervisorCertified = query.supervisorCertified === 'true' || query.supervisorCertified === true;
  }

  const logs = await MachineMaintenanceLog.find(filter)
    .populate('machineId', 'machineCode machineName machineType currentOperationalStatus')
    .populate('conductedBy', 'name employeeNumber email position')
    .populate('supervisorEmployeeId', 'name employeeNumber email position')
    .sort({ performedDate: -1 });

  return logs;
};

export const getMaintenanceLogById = async (logId) => {
  const log = await MachineMaintenanceLog.findById(logId)
    .populate('machineId')
    .populate('scheduleId')
    .populate('conductedBy')
    .populate('supervisorEmployeeId');

  if (!log) {
    const error = new Error(`Maintenance log not found with ID: ${logId}`);
    error.statusCode = 404;
    throw error;
  }

  return log;
};

/**
 * 6. Report Machine Breakdown (Create Machine Repair Order)
 * Rule 2 Breakdown Status: Immediately switches ProductionMachine.currentOperationalStatus = 'breakdown'.
 */
export const reportMachineBreakdown = async (repairData, user) => {
  const machine = await ProductionMachine.findById(repairData.machineId);
  if (!machine) {
    const error = new Error(`Machine not found with ID: ${repairData.machineId}`);
    error.statusCode = 404;
    throw error;
  }

  const repairOrderCode = repairData.repairOrderCode || (await generateRepairOrderCode());

  let reportedBy = repairData.reportedBy || user?.employeeId;
  if (!reportedBy && user?.email) {
    const emp = await Employee.findOne({ email: user.email });
    if (emp) reportedBy = emp._id;
  }

  // Rule 2: Immediately set machine status to breakdown
  machine.currentOperationalStatus = 'breakdown';
  await machine.save();

  const repairOrder = await MachineRepairOrder.create({
    repairOrderCode,
    machineId: machine._id,
    reportedBy,
    breakdownTimestamp: repairData.breakdownTimestamp ? new Date(repairData.breakdownTimestamp) : new Date(),
    urgency: repairData.urgency || 'high_urgent',
    status: 'reported_pending_diagnosis',
    interruptedProduction: repairData.interruptedProduction || {},
    breakdownSymptoms: repairData.breakdownSymptoms,
    errorCodesLogged: repairData.errorCodesLogged || [],
    leadTechnician: repairData.leadTechnician || null
  });

  return { repairOrder, machine };
};

/**
 * 7. Update Repair Technical Diagnosis
 */
export const updateRepairDiagnosis = async (repairId, diagnosisData, user) => {
  const repairOrder = await MachineRepairOrder.findById(repairId);
  if (!repairOrder) {
    const error = new Error(`Machine repair order not found with ID: ${repairId}`);
    error.statusCode = 404;
    throw error;
  }

  repairOrder.diagnosis = {
    diagnosedBy: diagnosisData.diagnosedBy || user?.employeeId || null,
    diagnosisDate: diagnosisData.diagnosisDate ? new Date(diagnosisData.diagnosisDate) : new Date(),
    failureCategory: diagnosisData.failureCategory,
    rootCauseSummary: diagnosisData.rootCauseSummary,
    repairStrategy: diagnosisData.repairStrategy
  };

  if (diagnosisData.leadTechnician) {
    repairOrder.leadTechnician = diagnosisData.leadTechnician;
  }
  if (diagnosisData.assistingTechnicians) {
    repairOrder.assistingTechnicians = diagnosisData.assistingTechnicians;
  }
  if (!repairOrder.repairStartedAt) {
    repairOrder.repairStartedAt = new Date();
  }

  repairOrder.status = diagnosisData.status || 'repair_in_progress';
  await repairOrder.save();

  return repairOrder;
};

/**
 * 8. Consume Repair Spare Parts
 * Records replacement parts and calculates total spare parts & overall repair costs.
 */
export const consumeRepairSpareParts = async (repairId, partsData) => {
  const repairOrder = await MachineRepairOrder.findById(repairId);
  if (!repairOrder) {
    const error = new Error(`Machine repair order not found with ID: ${repairId}`);
    error.statusCode = 404;
    throw error;
  }

  const parts = Array.isArray(partsData.sparePartsUsed) ? partsData.sparePartsUsed : [partsData];

  for (const part of parts) {
    const qty = Number(part.quantityUsed) || 1;
    let unitPrice = Number(part.unitPriceETB) || 0;

    // Fallback to stock item price if available
    if (part.stockItemId && unitPrice === 0) {
      const stockItem = await StockItem.findById(part.stockItemId);
      if (stockItem) {
        unitPrice = stockItem.averageUnitCost || stockItem.sellingPrice || 0;
      }
    }

    const totalPrice = Number(part.totalPriceETB) || (qty * unitPrice);

    repairOrder.sparePartsUsed.push({
      stockItemId: part.stockItemId || null,
      partCode: part.partCode || '',
      partName: part.partName,
      quantityUsed: qty,
      unitPriceETB: unitPrice,
      totalPriceETB: totalPrice,
      storeIssueVoucherId: part.storeIssueVoucherId || null
    });
  }

  repairOrder.totalSparePartsCostETB = repairOrder.sparePartsUsed.reduce(
    (sum, p) => sum + (p.totalPriceETB || 0),
    0
  );

  const vendorFee = repairOrder.externalService?.vendorServiceFeeETB || 0;
  repairOrder.totalRepairCostETB = repairOrder.totalSparePartsCostETB + vendorFee;

  if (partsData.status) {
    repairOrder.status = partsData.status;
  } else if (repairOrder.status === 'reported_pending_diagnosis') {
    repairOrder.status = 'repair_in_progress';
  }

  await repairOrder.save();
  return repairOrder;
};

/**
 * 9. Certify Return to Service
 * Validates post-repair calibration, computes total downtime hours,
 * sets status to 'completed_certified', and unlocks machine back to 'idle'.
 */
export const certifyReturnToService = async (repairId, testingData, user) => {
  const repairOrder = await MachineRepairOrder.findById(repairId);
  if (!repairOrder) {
    const error = new Error(`Machine repair order not found with ID: ${repairId}`);
    error.statusCode = 404;
    throw error;
  }

  const machine = await ProductionMachine.findById(repairOrder.machineId);
  if (!machine) {
    const error = new Error(`Associated machine not found with ID: ${repairOrder.machineId}`);
    error.statusCode = 404;
    throw error;
  }

  const completionDate = testingData.repairCompletedAt ? new Date(testingData.repairCompletedAt) : new Date();
  repairOrder.repairCompletedAt = completionDate;

  // Compute total downtime hours
  const breakdownTime = new Date(repairOrder.breakdownTimestamp).getTime();
  const diffMs = Math.max(0, completionDate.getTime() - breakdownTime);
  const diffHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
  repairOrder.totalDowntimeHours = diffHours;

  if (testingData.laborHoursTotal) {
    repairOrder.laborHoursTotal = Number(testingData.laborHoursTotal);
  }

  let certifiedBySupervisor = testingData.certifiedBySupervisor || user?.employeeId;
  if (!certifiedBySupervisor && user?.email) {
    const emp = await Employee.findOne({ email: user.email });
    if (emp) certifiedBySupervisor = emp._id;
  }

  const calibrationPassed = Boolean(testingData.calibrationTestPassed);

  repairOrder.postRepairTesting = {
    testRunType: testingData.testRunType || 'test_cut_calibration',
    calibrationTestPassed: calibrationPassed,
    dimensionalAccuracyVarianceMm: testingData.dimensionalAccuracyVarianceMm !== undefined ? Number(testingData.dimensionalAccuracyVarianceMm) : 0,
    spindleRunoutDialIndicatorMm: testingData.spindleRunoutDialIndicatorMm !== undefined ? Number(testingData.spindleRunoutDialIndicatorMm) : 0,
    certifiedReturnToServiceDate: completionDate,
    certifiedBySupervisor: certifiedBySupervisor || null,
    calibrationEvidenceId: testingData.calibrationEvidenceId || null
  };

  if (calibrationPassed) {
    repairOrder.status = 'completed_certified';
    // Restore machine status to idle
    machine.currentOperationalStatus = 'idle';
    await machine.save();
  } else {
    repairOrder.status = 'testing_and_calibrating';
  }

  await repairOrder.save();

  return { repairOrder, machine };
};

/**
 * 10. Query Repair Orders
 */
export const getRepairOrders = async (query = {}) => {
  const filter = {};
  if (query.machineId) filter.machineId = query.machineId;
  if (query.status) filter.status = query.status;
  if (query.urgency) filter.urgency = query.urgency;

  const orders = await MachineRepairOrder.find(filter)
    .populate('machineId', 'machineCode machineName machineType currentOperationalStatus')
    .populate('reportedBy', 'name employeeNumber email position')
    .populate('leadTechnician', 'name employeeNumber email position')
    .sort({ breakdownTimestamp: -1 });

  return orders;
};

export const getRepairOrderById = async (repairId) => {
  const order = await MachineRepairOrder.findById(repairId)
    .populate('machineId')
    .populate('reportedBy')
    .populate('leadTechnician')
    .populate('assistingTechnicians')
    .populate('diagnosis.diagnosedBy')
    .populate('postRepairTesting.certifiedBySupervisor')
    .populate('sparePartsUsed.stockItemId');

  if (!order) {
    const error = new Error(`Machine repair order not found with ID: ${repairId}`);
    error.statusCode = 404;
    throw error;
  }

  return order;
};

/**
 * 11. Compute Machine OEE and Health Metrics
 */
export const getMachineMetrics = async (machineId) => {
  const machine = await ProductionMachine.findById(machineId);
  if (!machine) {
    const error = new Error(`Machine not found with ID: ${machineId}`);
    error.statusCode = 404;
    throw error;
  }

  const repairOrders = await MachineRepairOrder.find({ machineId });
  const completedRepairs = repairOrders.filter((r) => r.status === 'completed_certified');
  const totalDowntimeHours = repairOrders.reduce((sum, r) => sum + (r.totalDowntimeHours || 0), 0);
  const totalRepairCost = repairOrders.reduce((sum, r) => sum + (r.totalRepairCostETB || 0), 0);

  // Mean Time To Repair (MTTR) = total downtime / number of completed repairs
  const mttrHours = completedRepairs.length > 0
    ? Number((totalDowntimeHours / completedRepairs.length).toFixed(2))
    : 0;

  const maintenanceLogs = await MachineMaintenanceLog.find({ machineId });
  const passedLogs = maintenanceLogs.filter((l) => l.overallResult === 'passed_ready_for_production').length;

  return {
    machineCode: machine.machineCode,
    machineName: machine.machineName,
    machineType: machine.machineType,
    currentOperationalStatus: machine.currentOperationalStatus,
    totalOperatingHours: machine.totalOperatingHours,
    maintenanceStats: {
      totalLogs: maintenanceLogs.length,
      passedLogs,
      complianceRate: maintenanceLogs.length > 0 ? Number(((passedLogs / maintenanceLogs.length) * 100).toFixed(1)) : 100
    },
    repairStats: {
      totalRepairIncidents: repairOrders.length,
      completedRepairs: completedRepairs.length,
      totalDowntimeHours: Number(totalDowntimeHours.toFixed(2)),
      totalRepairCostETB: Number(totalRepairCost.toFixed(2)),
      mttrHours
    }
  };
};
