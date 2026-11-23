import express from 'express';
import {
  getStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  getStockBalances,
  getStockMovements,
  getWarehouses,
  createWarehouse,
  getWarehouseLocations,
  createWarehouseLocation,
  getUnitsOfMeasure,
  createUnitOfMeasure,
  createStockAdjustment,
  approveStockAdjustment,
  createStockTransfer,
  receiveStockTransfer,
  getAssetRegisters,
  createAssetRegister,
  createAssetMaintenance
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

// Stock Balances & Movements
router.get('/balances', getStockBalances);
router.get('/movements', getStockMovements);

// Warehouses & Locations
router.get('/warehouses', getWarehouses);
router.post('/warehouses', authorizeRoles(...MANAGEMENT_ROLES), createWarehouse);
router.get('/locations', getWarehouseLocations);
router.post(
  '/locations',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createWarehouseLocation
);

// Units of Measure
router.get('/units', getUnitsOfMeasure);
router.post('/units', authorizeRoles(...MANAGEMENT_ROLES), createUnitOfMeasure);

// Adjustments & Transfers
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

// Asset Management
router.get('/assets', getAssetRegisters);
router.post('/assets', authorizeRoles(...MANAGEMENT_ROLES), createAssetRegister);
router.post(
  '/assets/maintenance',
  authorizeRoles(ROLES.STOREKEEPER, ...MANAGEMENT_ROLES),
  createAssetMaintenance
);

export default router;
