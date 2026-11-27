import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';
import * as machineMaintenanceController from '../controllers/machineMaintenanceController.js';
import {
  validateSensorRanges,
  verifyMachineCanOperate
} from '../middleware/machineMaintenanceValidationMiddleware.js';

const maintenanceRouter = express.Router();
export const repairRouter = express.Router();

// ==========================================
// Machine Maintenance Schedules & Logs
// ==========================================

// Schedules
maintenanceRouter.get(
  '/schedules',
  protect,
  machineMaintenanceController.getMaintenanceSchedules
);

maintenanceRouter.post(
  '/schedules',
  protect,
  authorizeRoles(...MANAGEMENT_ROLES),
  machineMaintenanceController.createMaintenanceSchedule
);

// Logs
maintenanceRouter.get(
  '/logs',
  protect,
  machineMaintenanceController.getMaintenanceLogs
);

maintenanceRouter.get(
  '/logs/:id',
  protect,
  machineMaintenanceController.getMaintenanceLogById
);

maintenanceRouter.post(
  '/logs',
  protect,
  validateSensorRanges,
  machineMaintenanceController.submitMaintenanceLog
);

maintenanceRouter.patch(
  '/logs/:id/certify',
  protect,
  authorizeRoles(...MANAGEMENT_ROLES),
  machineMaintenanceController.certifyMaintenanceLog
);

// Metrics
maintenanceRouter.get(
  '/metrics/:machineId',
  protect,
  machineMaintenanceController.getMachineMetricsHandler
);

// ==========================================
// Machine Breakdown & Repair Orders
// ==========================================

repairRouter.get(
  '/',
  protect,
  machineMaintenanceController.getRepairOrders
);

repairRouter.get(
  '/:id',
  protect,
  machineMaintenanceController.getRepairOrderById
);

repairRouter.post(
  '/',
  protect,
  machineMaintenanceController.createRepairOrder
);

repairRouter.put(
  '/:id/diagnosis',
  protect,
  machineMaintenanceController.updateRepairDiagnosisHandler
);

repairRouter.post(
  '/:id/spare-parts',
  protect,
  machineMaintenanceController.addRepairSpareParts
);

repairRouter.post(
  '/:id/certify-return',
  protect,
  authorizeRoles(...MANAGEMENT_ROLES),
  machineMaintenanceController.certifyReturnToServiceHandler
);

export default maintenanceRouter;
