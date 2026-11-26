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
import { attachFilesToEvidence, getEvidenceForEntity } from '../utils/evidenceHelper.js';

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

    const balances = await StockBalance.find({ stockItemId: item._id })
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name code');

    // Universal Evidence polymorphic attachment integration
    const evidence = await getEvidenceForEntity('StockItem', item._id);

    res.json({
      success: true,
      data: {
        ...item.toObject(),
        balances,
        evidence: evidence?.attachments || []
      }
    });
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
      supplierId,
      attachments = []
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

    // Universal Evidence Table Attachment
    if (attachments.length > 0 || req.files?.length > 0) {
      const filesToAttach = req.files?.length > 0 ? req.files : attachments;
      await attachFilesToEvidence({
        entityType: 'StockItem',
        entityId: stockItem._id,
        files: filesToAttach,
        user: req.user,
        title: `${stockItem.name} Specifications`,
        description: 'Catalog item attachment / spec sheet'
      });
    }

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

    if (req.body.attachments?.length > 0 || req.files?.length > 0) {
      const filesToAttach = req.files?.length > 0 ? req.files : req.body.attachments;
      await attachFilesToEvidence({
        entityType: 'StockItem',
        entityId: item._id,
        files: filesToAttach,
        user: req.user,
        title: `${item.name} Updated Document`
      });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteStockItem = async (req, res) => {
  try {
    const item = await StockItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }

    // Check if stock balances exist
    const balances = await StockBalance.find({ stockItemId: item._id });
    const hasStock = balances.some((b) => b.balanceQuantity > 0);
    if (hasStock) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete stock item with active inventory on-hand. Deactivate instead.'
      });
    }

    await StockItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Stock item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      .populate('managerId', 'employeeNumber firstName lastName')
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

export const updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    res.json({ success: true, data: warehouse });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const hasStock = await StockBalance.findOne({
      warehouseId: req.params.id,
      balanceQuantity: { $gt: 0 }
    });
    if (hasStock) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete warehouse with active stock balance.'
      });
    }
    await Warehouse.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

export const updateWarehouseLocation = async (req, res) => {
  try {
    const location = await WarehouseLocation.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    res.json({ success: true, data: location });
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
// 5. Stock Adjustments & Transfers
// ==========================================

export const getStockAdjustments = async (req, res) => {
  try {
    const { warehouseId, status } = req.query;
    const query = {};
    if (warehouseId) query.warehouseId = warehouseId;
    if (status) query.status = status;

    const adjustments = await StockAdjustment.find(query)
      .populate('warehouseId', 'name code')
      .populate('requestedBy', 'email')
      .populate('approvedBy', 'email')
      .populate('items.stockItemId', 'name code unit')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: adjustments.length, data: adjustments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

    if (req.body.attachments?.length > 0 || req.files?.length > 0) {
      await attachFilesToEvidence({
        entityType: 'StockAdjustment',
        entityId: adjustment._id,
        files: req.files?.length > 0 ? req.files : req.body.attachments,
        user: req.user,
        title: `Adjustment ${adjustment.adjustmentCode} Verification Proof`
      });
    }

    res.status(201).json({ success: true, data: adjustment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const approveStockAdjustment = async (req, res) => {
  try {
    const { approvalComment, comments, notes } = req.body || {};
    const reviewNote = approvalComment || comments || notes;

    const adjustment = await StockAdjustment.findById(req.params.id);
    if (!adjustment) {
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    if (adjustment.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Already approved' });
    }
    if (adjustment.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Cannot approve a rejected adjustment' });
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
          balance.balanceQuantity = Number(item.adjustedQuantity.toFixed(4));
          balance.balanceTotalQuantity = Number(item.adjustedTotalQuantity.toFixed(4));
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
            notes: `Stock Adjustment: ${adjustment.reason}${reviewNote ? ` (${reviewNote})` : ''}`
          });
          await movement.save(opts);
        }
      }

      adjustment.status = 'approved';
      adjustment.approvedBy = req.user._id;
      adjustment.approvedAt = new Date();
      if (reviewNote) {
        adjustment.approvalComment = reviewNote;
      }
      await adjustment.save(opts);
    });

    res.json({ success: true, message: 'Adjustment approved and stock updated', data: adjustment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectStockAdjustment = async (req, res) => {
  try {
    const { rejectionReason, comments, notes } = req.body || {};
    const adjustment = await StockAdjustment.findById(req.params.id);
    if (!adjustment) {
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    if (adjustment.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Cannot reject an already approved adjustment' });
    }
    if (adjustment.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Adjustment is already rejected' });
    }

    adjustment.status = 'rejected';
    adjustment.rejectionReason =
      rejectionReason || comments || notes || 'Stock adjustment rejected by Management';
    adjustment.rejectedBy = req.user._id;
    adjustment.rejectedAt = new Date();
    await adjustment.save();

    res.json({ success: true, message: 'Stock adjustment rejected', data: adjustment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStockTransfers = async (req, res) => {
  try {
    const { sourceWarehouseId, destinationWarehouseId, status } = req.query;
    const query = {};
    if (sourceWarehouseId) query.sourceWarehouseId = sourceWarehouseId;
    if (destinationWarehouseId) query.destinationWarehouseId = destinationWarehouseId;
    if (status) query.status = status;

    const transfers = await StockTransfer.find(query)
      .populate('sourceWarehouseId', 'name code')
      .populate('destinationWarehouseId', 'name code')
      .populate('requestedBy', 'email')
      .populate('receivedBy', 'email')
      .populate('items.stockItemId', 'name code unit')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: transfers.length, data: transfers });
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

    if (req.body.attachments?.length > 0 || req.files?.length > 0) {
      await attachFilesToEvidence({
        entityType: 'StockTransfer',
        entityId: transfer._id,
        files: req.files?.length > 0 ? req.files : req.body.attachments,
        user: req.user,
        title: `Transfer ${transfer.transferCode} Waybill`
      });
    }

    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const receiveStockTransfer = async (req, res) => {
  try {
    const { notes, receiverComment, comments } = req.body || {};
    const receiveNote = receiverComment || comments || notes;

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

        // Movements for source and destination
        const movOutCode = await generateCode('MOV', StockMovement, 'movementCode');
        const movOut = new StockMovement({
          movementCode: movOutCode,
          stockItemId: item.stockItemId,
          warehouseId: transfer.sourceWarehouseId,
          movementType: 'transfer_out',
          referenceType: 'StockTransfer',
          referenceId: transfer._id,
          quantityOut: item.sentQuantity,
          totalQuantityOut: item.sentTotalQuantity,
          unit: item.unit || 'pcs',
          baseUnit: item.baseUnit || 'pcs',
          performedBy: req.user._id,
          movementDate: new Date(),
          notes: `Transfer Out: ${transfer.transferCode}`
        });
        await movOut.save(opts);

        const movInCode = await generateCode('MOV', StockMovement, 'movementCode');
        const movIn = new StockMovement({
          movementCode: movInCode,
          stockItemId: item.stockItemId,
          warehouseId: transfer.destinationWarehouseId,
          movementType: 'transfer_in',
          referenceType: 'StockTransfer',
          referenceId: transfer._id,
          quantityIn: receivedQty,
          totalQuantityIn: receivedTotal,
          unit: item.unit || 'pcs',
          baseUnit: item.baseUnit || 'pcs',
          performedBy: req.user._id,
          movementDate: new Date(),
          notes: `Transfer In: ${transfer.transferCode}`
        });
        await movIn.save(opts);
      }

      transfer.status = 'received';
      transfer.receivedBy = req.user._id;
      transfer.receivedDate = new Date();
      if (receiveNote) {
        transfer.notes = transfer.notes ? `${transfer.notes} | Receiver note: ${receiveNote}` : receiveNote;
      }
      await transfer.save(opts);
    });

    res.json({ success: true, message: 'Stock transfer received and balances updated', data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. Stock Count & Physical Audit Cycle
// ==========================================

export const getStockCounts = async (req, res) => {
  try {
    const counts = await StockCount.find()
      .populate('warehouseId', 'name code')
      .populate('countedBy', 'email')
      .populate('items.stockItemId', 'name code unit')
      .sort({ countDate: -1 });
    res.json({ success: true, count: counts.length, data: counts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStockCount = async (req, res) => {
  try {
    const countCode = await generateCode('CNT', StockCount, 'countCode');
    const stockCount = new StockCount({
      ...req.body,
      countCode,
      countedBy: req.user._id,
      status: 'in_progress'
    });
    await stockCount.save();
    res.status(201).json({ success: true, data: stockCount });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const reconcileStockCount = async (req, res) => {
  try {
    const { approvalComment, comments, notes } = req.body || {};
    const reconcileNote = approvalComment || comments || notes;

    const count = await StockCount.findById(req.params.id);
    if (!count) {
      return res.status(404).json({ success: false, message: 'Stock count not found' });
    }

    await withTransaction(async (session) => {
      const opts = session ? { session } : {};
      for (const item of count.items) {
        const balance = await StockBalance.findOne({
          stockItemId: item.stockItemId,
          warehouseId: count.warehouseId
        }).session(session);

        if (balance) {
          balance.balanceQuantity = item.physicalQuantity;
          balance.balanceTotalQuantity = item.physicalTotalQuantity;
          balance.availableQuantity = balance.balanceQuantity - balance.reservedQuantity;
          await balance.save(opts);
        }
      }

      count.status = 'reconciled';
      count.approvedBy = req.user._id;
      count.approvedAt = new Date();
      if (reconcileNote) {
        count.approvalComment = reconcileNote;
      }
      await count.save(opts);
    });

    res.json({ success: true, message: 'Stock count reconciled with inventory', data: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. Asset & Maintenance Controllers
// ==========================================

export const getAssetRegisters = async (req, res) => {
  try {
    const assets = await AssetRegister.find()
      .populate('warehouseId', 'name code')
      .populate('supplierId', 'name code')
      .populate('assignedTo', 'firstName lastName employeeNumber')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: assets.length, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssetRegisterById = async (req, res) => {
  try {
    const asset = await AssetRegister.findById(req.params.id)
      .populate('warehouseId', 'name code')
      .populate('supplierId', 'name code phone')
      .populate('assignedTo', 'firstName lastName employeeNumber');

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const maintenances = await AssetMaintenance.find({ assetId: asset._id }).sort({
      maintenanceDate: -1
    });

    // Universal Evidence Table integration for Asset manuals/warranty
    const evidence = await getEvidenceForEntity('AssetRegister', asset._id);

    res.json({
      success: true,
      data: {
        ...asset.toObject(),
        maintenances,
        evidence: evidence?.attachments || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAssetRegister = async (req, res) => {
  try {
    const assetCode = await generateCode('AST', AssetRegister, 'assetCode');
    const asset = new AssetRegister({ ...req.body, assetCode });
    await asset.save();

    if (req.body.attachments?.length > 0 || req.files?.length > 0) {
      await attachFilesToEvidence({
        entityType: 'AssetRegister',
        entityId: asset._id,
        files: req.files?.length > 0 ? req.files : req.body.attachments,
        user: req.user,
        title: `${asset.name} Warranty & Purchase Document`
      });
    }

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAssetRegister = async (req, res) => {
  try {
    const asset = await AssetRegister.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    res.json({ success: true, data: asset });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAssetMaintenances = async (req, res) => {
  try {
    const { assetId } = req.query;
    const query = assetId ? { assetId } : {};
    const maintenances = await AssetMaintenance.find(query)
      .populate('assetId', 'name assetCode')
      .populate('performedBy', 'email')
      .sort({ maintenanceDate: -1 });
    res.json({ success: true, count: maintenances.length, data: maintenances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// ==========================================
// 8. End of Day Store Reports
// ==========================================

export const getEndOfDayReports = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const query = warehouseId ? { warehouseId } : {};
    const reports = await EndOfDayReport.find(query)
      .populate('warehouseId', 'name code')
      .populate('preparedBy', 'email')
      .sort({ reportDate: -1 });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateEndOfDayReport = async (req, res) => {
  try {
    const { warehouseId, reportDate = new Date() } = req.body;
    const reportCode = await generateCode('EOD', EndOfDayReport, 'reportCode');

    // Aggregate movements for the day
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const movements = await StockMovement.find({
      warehouseId,
      movementDate: { $gte: startOfDay, $lte: endOfDay }
    });

    let receivedTotalQuantity = 0;
    let issuedTotalQuantity = 0;
    let returnedTotalQuantity = 0;
    let wasteTotalQuantity = 0;

    for (const m of movements) {
      if (m.movementType === 'grv_receipt') receivedTotalQuantity += m.totalQuantityIn;
      if (m.movementType === 'siv_issue') issuedTotalQuantity += m.totalQuantityOut;
      if (m.movementType === 'staff_return') returnedTotalQuantity += m.totalQuantityIn;
      if (m.movementType === 'waste') wasteTotalQuantity += m.totalQuantityOut;
    }

    const balances = await StockBalance.find({ warehouseId });
    const closingTotalQuantity = balances.reduce((sum, b) => sum + (b.balanceTotalQuantity || 0), 0);

    const report = new EndOfDayReport({
      reportCode,
      warehouseId,
      reportDate,
      openingTotalQuantity: closingTotalQuantity - receivedTotalQuantity - returnedTotalQuantity + issuedTotalQuantity + wasteTotalQuantity,
      receivedTotalQuantity,
      issuedTotalQuantity,
      returnedTotalQuantity,
      wasteTotalQuantity,
      closingTotalQuantity,
      preparedBy: req.user._id
    });

    await report.save();
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
