import express from 'express';
import {
  getStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  getStockBalances,
  getStockMovements,
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseLocations,
  createWarehouseLocation,
  updateWarehouseLocation,
  getUnitsOfMeasure,
  createUnitOfMeasure,
  getStockAdjustments,
  createStockAdjustment,
  approveStockAdjustment,
  getStockTransfers,
  createStockTransfer,
  receiveStockTransfer,
  getStockCounts,
  createStockCount,
  reconcileStockCount,
  getAssetRegisters,
  getAssetRegisterById,
  createAssetRegister,
  updateAssetRegister,
  getAssetMaintenances,
  createAssetMaintenance,
  getEndOfDayReports,
  generateEndOfDayReport
} from '../controllers/inventoryController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect);

// Stock Items
router.get('/items', getStockItems);
router.get('/items/:id', getStockItemById);
router.post(
  '/items',
  authorizeRoles(ROLES.STOREKEEPER, ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  createStockItem
);
router.put(
  '/items/:id',
  authorizeRoles(ROLES.STOREKEEPER, ROLES.PURCHASING, ...MANAGEMENT_ROLES),
  updateStockItem
);
router.delete(
  '/items/:id',
  authorizeRoles(...MANAGEMENT_ROLES),
  deleteStockItem
);

// Stock Balances & Movements
router.get('/balances', getStockBalances);
router.get('/movements', getStockMovements);

// Warehouses & Locations
router.get('/warehouses', getWarehouses);
router.post('/warehouses', authorizeRoles(...MANAGEMENT_ROLES), createWarehouse);
router.put('/warehouses/:id', authorizeRoles(...MANAGEMENT_ROLES), updateWarehouse);
router.delete('/warehouses/:id', authorizeRoles(...MANAGEMENT_ROLES), deleteWarehouse);
router.get('/locations', getWarehouseLocations);
router.post(
  '/locations',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createWarehouseLocation
);
router.put(
  '/locations/:id',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  updateWarehouseLocation
);

// Units of Measure
router.get('/units', getUnitsOfMeasure);
router.post('/units', authorizeRoles(...MANAGEMENT_ROLES), createUnitOfMeasure);

// Adjustments & Transfers
router.get('/adjustments', getStockAdjustments);
router.post(
  '/adjustments',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createStockAdjustment
);
router.put(
  '/adjustments/:id/approve',
  authorizeRoles(...MANAGEMENT_ROLES),
  approveStockAdjustment
);

router.get('/transfers', getStockTransfers);
router.post(
  '/transfers',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createStockTransfer
);
router.put(
  '/transfers/:id/receive',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  receiveStockTransfer
);

// Stock Counting & Audits
router.get('/counts', getStockCounts);
router.post(
  '/counts',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createStockCount
);
router.put(
  '/counts/:id/reconcile',
  authorizeRoles(...MANAGEMENT_ROLES),
  reconcileStockCount
);

// Asset Management
router.get('/assets', getAssetRegisters);
router.get('/assets/:id', getAssetRegisterById);
router.post('/assets', authorizeRoles(...MANAGEMENT_ROLES), createAssetRegister);
router.put('/assets/:id', authorizeRoles(...MANAGEMENT_ROLES), updateAssetRegister);
router.get('/assets/maintenance/list', getAssetMaintenances);
router.post(
  '/assets/maintenance',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createAssetMaintenance
);

// End of Day Reports
router.get('/eod-reports', getEndOfDayReports);
router.post(
  '/eod-reports',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  generateEndOfDayReport
);

export default router;
