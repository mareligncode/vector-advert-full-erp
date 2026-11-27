import * as machineMaintenanceService from '../services/machineMaintenanceService.js';

// --- Maintenance Schedules ---

export const getMaintenanceSchedules = async (req, res) => {
  try {
    const schedules = await machineMaintenanceService.getMaintenanceSchedules(req.query);
    res.status(200).json({
      success: true,
      data: schedules
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

export const createMaintenanceSchedule = async (req, res) => {
  try {
    const schedule = await machineMaintenanceService.createMaintenanceSchedule(req.body);
    res.status(201).json({
      success: true,
      message: 'Maintenance schedule created successfully',
      data: schedule
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

// --- Maintenance Logs ---

export const getMaintenanceLogs = async (req, res) => {
  try {
    const logs = await machineMaintenanceService.getMaintenanceLogs(req.query);
    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

export const getMaintenanceLogById = async (req, res) => {
  try {
    const log = await machineMaintenanceService.getMaintenanceLogById(req.params.id);
    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    res.status(error.statusCode || 404).json({
      success: false,
      message: error.message
    });
  }
};

export const submitMaintenanceLog = async (req, res) => {
  try {
    const result = await machineMaintenanceService.recordMaintenanceLog(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Maintenance log submitted successfully',
      data: result
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

export const certifyMaintenanceLog = async (req, res) => {
  try {
    const result = await machineMaintenanceService.certifyMaintenanceLog(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      message: 'Maintenance log certified and machine status updated',
      data: result
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

// --- Machine Repair Orders ---

export const getRepairOrders = async (req, res) => {
  try {
    const orders = await machineMaintenanceService.getRepairOrders(req.query);
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

export const getRepairOrderById = async (req, res) => {
  try {
    const order = await machineMaintenanceService.getRepairOrderById(req.params.id);
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(error.statusCode || 404).json({
      success: false,
      message: error.message
    });
  }
};

export const createRepairOrder = async (req, res) => {
  try {
    const result = await machineMaintenanceService.reportMachineBreakdown(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Machine breakdown reported and machine locked in breakdown status',
      data: result
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateRepairDiagnosisHandler = async (req, res) => {
  try {
    const order = await machineMaintenanceService.updateRepairDiagnosis(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      message: 'Repair diagnosis recorded successfully',
      data: order
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

export const addRepairSpareParts = async (req, res) => {
  try {
    const order = await machineMaintenanceService.consumeRepairSpareParts(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Spare parts logged and repair costs updated',
      data: order
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

export const certifyReturnToServiceHandler = async (req, res) => {
  try {
    const result = await machineMaintenanceService.certifyReturnToService(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      message: 'Post-repair calibration certified and machine restored to operational service',
      data: result
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

// --- Machine Health & Metrics ---

export const getMachineMetricsHandler = async (req, res) => {
  try {
    const metrics = await machineMaintenanceService.getMachineMetrics(req.params.machineId);
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(error.statusCode || 404).json({
      success: false,
      message: error.message
    });
  }
};
