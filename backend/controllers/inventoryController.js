import StockItem from '../models/StockItem.js';
import StockBalance from '../models/StockBalance.js';
import StockMovement from '../models/StockMovement.js';
import Warehouse from '../models/Warehouse.js';
import WarehouseLocation from '../models/WarehouseLocation.js';
import UnitOfMeasure from '../models/UnitOfMeasure.js';
import StockAdjustment from '../models/StockAdjustment.js';
import StockTransfer from '../models/StockTransfer.js';
import StockCount from '../models/StockCount.js';
import AssetRegister from '../models/AssetRegister.js';
import AssetMaintenance from '../models/AssetMaintenance.js';
import EndOfDayReport from '../models/EndOfDayReport.js';
import {
  calculateQuantityRelationship,
  generateCode,
  withTransaction
} from '../utils/inventoryService.js';

// ==========================================
// 1. StockItem Catalog Controllers
// ==========================================

export const getStockItems = async (req, res) => {
  try {
    const { category, search, stockStatus, itemType, page = 1, limit = 50 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (stockStatus) query.stockStatus = stockStatus;
    if (itemType) query.itemType = itemType;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await StockItem.countDocuments(query);
    const items = await StockItem.find(query)
      .populate('defaultWarehouseId', 'name code')
      .populate('supplierId', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: items.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStockItemById = async (req, res) => {
  try {
    const item = await StockItem.findById(req.params.id)
      .populate('defaultWarehouseId', 'name code')
      .populate('supplierId', 'name code phone email');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }

    // Also fetch balances across warehouses
    const balances = await StockBalance.find({ stockItemId: item._id }).populate(
      'warehouseId',
      'name code'
    );

    res.json({ success: true, data: { ...item.toObject(), balances } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStockItem = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      itemType = 'inventory',
      unit,
      baseUnit,
      multiplierNumerator = 1,
      multiplierDenominator = 1,
      reorderLevelQuantity = 0,
      minimumStockQuantity = 0,
      maximumStockQuantity = 0,
      unitCost = 0,
      defaultWarehouseId,
      supplierId
    } = req.body;

    const code = req.body.code || (await generateCode('STK', StockItem, 'code'));
    const { multiplier } = calculateQuantityRelationship({
      quantity: 1,
      multiplierNumerator,
      multiplierDenominator
    });

    const avgCostPerBase = multiplier > 0 ? unitCost / multiplier : unitCost;

    const stockItem = new StockItem({
      code,
      name,
      description,
      category,
      itemType,
      unit,
      baseUnit,
      multiplierNumerator,
      multiplierDenominator,
      multiplier,
      reorderLevelQuantity,
      reorderLevelTotalQuantity: reorderLevelQuantity * multiplier,
      minimumStockQuantity,
      minimumStockTotalQuantity: minimumStockQuantity * multiplier,
      maximumStockQuantity,
      maximumStockTotalQuantity: maximumStockQuantity * multiplier,
      unitCost,
      averageUnitCost: Number(avgCostPerBase.toFixed(4)),
      defaultWarehouseId,
      supplierId,
      stockStatus: 'out_of_stock'
    });

    await stockItem.save();
    res.status(201).json({ success: true, data: stockItem });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateStockItem = async (req, res) => {
  try {
    const item = await StockItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }

    if (req.body.multiplierNumerator || req.body.multiplierDenominator) {
      const { multiplier } = calculateQuantityRelationship({
        quantity: 1,
        multiplierNumerator: req.body.multiplierNumerator || item.multiplierNumerator,
        multiplierDenominator:
          req.body.multiplierDenominator || item.multiplierDenominator
      });
      req.body.multiplier = multiplier;
    }

    Object.assign(item, req.body);
    await item.save();
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. StockBalance & Movements Controllers
// ==========================================

export const getStockBalances = async (req, res) => {
  try {
    const { warehouseId, stockItemId, search, lowStock } = req.query;
    const query = {};

    if (warehouseId) query.warehouseId = warehouseId;
    if (stockItemId) query.stockItemId = stockItemId;

    let balances = await StockBalance.find(query)
      .populate('stockItemId')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name code')
      .sort({ updatedAt: -1 });

    if (search) {
      const reg = new RegExp(search, 'i');
      balances = balances.filter(
        (b) =>
          (b.stockItemId && reg.test(b.stockItemId.name)) ||
          (b.stockItemId && reg.test(b.stockItemId.code))
      );
    }

    if (lowStock === 'true') {
      balances = balances.filter(
        (b) =>
          b.stockItemId && b.availableQuantity <= b.stockItemId.reorderLevelQuantity
      );
    }

    res.json({ success: true, count: balances.length, data: balances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStockMovements = async (req, res) => {
  try {
    const {
      stockItemId,
      warehouseId,
      movementType,
      referenceType,
      page = 1,
      limit = 50
    } = req.query;
    const query = {};

    if (stockItemId) query.stockItemId = stockItemId;
    if (warehouseId) query.warehouseId = warehouseId;
    if (movementType) query.movementType = movementType;
    if (referenceType) query.referenceType = referenceType;

    const total = await StockMovement.countDocuments(query);
    const movements = await StockMovement.find(query)
      .populate('stockItemId', 'name code unit')
      .populate('warehouseId', 'name code')
      .populate('performedBy', 'email')
      .sort({ movementDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: movements.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: movements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. Warehouse & Locations Controllers
// ==========================================

export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find()
      .populate('managerId', 'employeeNumber')
      .sort({ name: 1 });
    res.json({ success: true, count: warehouses.length, data: warehouses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createWarehouse = async (req, res) => {
  try {
    const code = req.body.code || (await generateCode('WH', Warehouse, 'code'));
    const warehouse = new Warehouse({ ...req.body, code });
    await warehouse.save();
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getWarehouseLocations = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const query = warehouseId ? { warehouseId } : {};
    const locations = await WarehouseLocation.find(query)
      .populate('warehouseId', 'name code')
      .sort({ code: 1 });
    res.json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createWarehouseLocation = async (req, res) => {
  try {
    const location = new WarehouseLocation(req.body);
    await location.save();
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. Units of Measure Controllers
// ==========================================

export const getUnitsOfMeasure = async (req, res) => {
  try {
    const units = await UnitOfMeasure.find().sort({ name: 1 });
    res.json({ success: true, count: units.length, data: units });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUnitOfMeasure = async (req, res) => {
  try {
    const unit = new UnitOfMeasure(req.body);
    await unit.save();
    res.status(201).json({ success: true, data: unit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. Stock Adjustments & Transfers Controllers
// ==========================================

export const createStockAdjustment = async (req, res) => {
  try {
    const adjustmentCode = await generateCode('ADJ', StockAdjustment, 'adjustmentCode');
    const adjustment = new StockAdjustment({
      ...req.body,
      adjustmentCode,
      requestedBy: req.user._id,
      status: 'pending_approval'
    });
    await adjustment.save();
    res.status(201).json({ success: true, data: adjustment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const approveStockAdjustment = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id);
    if (!adjustment) {
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    if (adjustment.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Already approved' });
    }

    await withTransaction(async (session) => {
      const opts = session ? { session } : {};
      for (const item of adjustment.items) {
        const balance = await StockBalance.findOne({
          stockItemId: item.stockItemId,
          warehouseId: adjustment.warehouseId
        }).session(session);

        if (balance) {
          const diff = item.differenceQuantity || 0;
          balance.balanceQuantity = Number((item.adjustedQuantity).toFixed(4));
          balance.balanceTotalQuantity = Number((item.adjustedTotalQuantity).toFixed(4));
          balance.availableQuantity = Number(
            (balance.balanceQuantity - balance.reservedQuantity).toFixed(4)
          );
          await balance.save(opts);

          const movementCode = await generateCode('MOV', StockMovement, 'movementCode');
          const movement = new StockMovement({
            movementCode,
            stockItemId: item.stockItemId,
            warehouseId: adjustment.warehouseId,
            movementType: diff >= 0 ? 'adjustment_plus' : 'adjustment_minus',
            referenceType: 'StockAdjustment',
            referenceId: adjustment._id,
            quantityIn: diff >= 0 ? diff : 0,
            quantityOut: diff < 0 ? Math.abs(diff) : 0,
            totalQuantityIn: diff >= 0 ? item.differenceTotalQuantity : 0,
            totalQuantityOut: diff < 0 ? Math.abs(item.differenceTotalQuantity) : 0,
            balanceQuantityAfter: balance.balanceQuantity,
            balanceTotalQuantityAfter: balance.balanceTotalQuantity,
            unit: item.unit || 'pcs',
            baseUnit: item.baseUnit || 'pcs',
            performedBy: req.user._id,
            movementDate: new Date(),
            notes: `Stock Adjustment: ${adjustment.reason}`
          });
          await movement.save(opts);
        }
      }

      adjustment.status = 'approved';
      adjustment.approvedBy = req.user._id;
      await adjustment.save(opts);
    });

    res.json({ success: true, message: 'Adjustment approved and stock updated', data: adjustment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStockTransfer = async (req, res) => {
  try {
    const transferCode = await generateCode('TRF', StockTransfer, 'transferCode');
    const transfer = new StockTransfer({
      ...req.body,
      transferCode,
      requestedBy: req.user._id,
      status: 'pending_approval'
    });
    await transfer.save();
    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const receiveStockTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    await withTransaction(async (session) => {
      const opts = session ? { session } : {};
      for (const item of transfer.items) {
        const receivedQty = item.receivedQuantity || item.sentQuantity;
        const receivedTotal = item.receivedTotalQuantity || item.sentTotalQuantity;

        // Deduct from source warehouse
        const sourceBal = await StockBalance.findOne({
          stockItemId: item.stockItemId,
          warehouseId: transfer.sourceWarehouseId
        }).session(session);

        if (sourceBal) {
          sourceBal.balanceQuantity = Math.max(0, sourceBal.balanceQuantity - item.sentQuantity);
          sourceBal.balanceTotalQuantity = Math.max(0, sourceBal.balanceTotalQuantity - item.sentTotalQuantity);
          sourceBal.availableQuantity = Math.max(0, sourceBal.balanceQuantity - sourceBal.reservedQuantity);
          await sourceBal.save(opts);
        }

        // Add to destination warehouse
        let destBal = await StockBalance.findOne({
          stockItemId: item.stockItemId,
          warehouseId: transfer.destinationWarehouseId
        }).session(session);

        if (!destBal) {
          destBal = new StockBalance({
            stockItemId: item.stockItemId,
            warehouseId: transfer.destinationWarehouseId,
            balanceQuantity: 0,
            balanceTotalQuantity: 0,
            reservedQuantity: 0,
            reservedTotalQuantity: 0,
            availableQuantity: 0,
            availableTotalQuantity: 0
          });
        }

        destBal.balanceQuantity += receivedQty;
        destBal.balanceTotalQuantity += receivedTotal;
        destBal.availableQuantity = destBal.balanceQuantity - destBal.reservedQuantity;
        await destBal.save(opts);
      }

      transfer.status = 'received';
      transfer.receivedBy = req.user._id;
      transfer.receivedDate = new Date();
      await transfer.save(opts);
    });

    res.json({ success: true, message: 'Stock transfer received and balances updated', data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. Asset & Maintenance Controllers
// ==========================================

export const getAssetRegisters = async (req, res) => {
  try {
    const assets = await AssetRegister.find()
      .populate('warehouseId', 'name code')
      .populate('assignedTo', 'firstName lastName employeeNumber')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: assets.length, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAssetRegister = async (req, res) => {
  try {
    const assetCode = await generateCode('AST', AssetRegister, 'assetCode');
    const asset = new AssetRegister({ ...req.body, assetCode });
    await asset.save();
    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createAssetMaintenance = async (req, res) => {
  try {
    const maintenanceCode = await generateCode('MNT', AssetMaintenance, 'maintenanceCode');
    const maintenance = new AssetMaintenance({
      ...req.body,
      maintenanceCode,
      performedBy: req.user._id
    });
    await maintenance.save();
    res.status(201).json({ success: true, data: maintenance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
