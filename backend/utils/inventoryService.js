import mongoose from 'mongoose';
import StockItem from '../models/StockItem.js';
import StockBalance from '../models/StockBalance.js';
import StockMovement from '../models/StockMovement.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import CreditTransaction from '../models/CreditTransaction.js';
import StaffRequest from '../models/StaffRequest.js';

/**
 * Execute operations within a MongoDB transaction if replica set is enabled;
 * otherwise fallback to standard sequential execution for standalone dev instances.
 */
export async function withTransaction(fn) {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Ignore abort error if transaction was already aborted or not supported
      }
    }
    // If standalone MongoDB does not support transactions, execute directly
    if (
      error.message &&
      (error.message.includes('replica set') ||
        error.message.includes('Transaction numbers are only allowed') ||
        error.message.includes('Transactions are not supported'))
    ) {
      return await fn(null);
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

/**
 * Calculate derived rational multiplier and total quantity
 */
export function calculateQuantityRelationship({
  quantity = 0,
  multiplierNumerator = 1,
  multiplierDenominator = 1
}) {
  const num =
    multiplierNumerator !== undefined && multiplierNumerator !== null
      ? Number(multiplierNumerator)
      : 1;
  const den =
    multiplierDenominator !== undefined && multiplierDenominator !== null
      ? Number(multiplierDenominator)
      : 1;
  if (den === 0) {
    throw new Error('multiplierDenominator cannot be zero');
  }
  const multiplier = Number((num / den).toFixed(6));
  const totalQuantity = Number((Number(quantity) * multiplier).toFixed(4));
  return {
    multiplierNumerator: num,
    multiplierDenominator: den,
    multiplier,
    totalQuantity
  };
}

/**
 * Calculate Moving Weighted Average Cost (MAC) per base unit
 */
export function calculateMovingAverageCost({
  currentBaseQty = 0,
  currentAvgCost = 0,
  incomingBaseQty = 0,
  incomingUnitCostPerBaseUnit = 0
}) {
  const curQty = Math.max(0, Number(currentBaseQty) || 0);
  const curCost = Math.max(0, Number(currentAvgCost) || 0);
  const incQty = Math.max(0, Number(incomingBaseQty) || 0);
  const incCost = Math.max(0, Number(incomingUnitCostPerBaseUnit) || 0);

  const totalBaseQty = curQty + incQty;
  if (totalBaseQty <= 0) {
    return incCost > 0 ? incCost : curCost;
  }

  const newAvgCost = (curQty * curCost + incQty * incCost) / totalBaseQty;
  return Number(newAvgCost.toFixed(4));
}

/**
 * Generate sequential/timestamped code for records (e.g. GRV-2026-0001)
 */
export async function generateCode(prefix, Model, fieldName = 'code') {
  const currentYear = new Date().getFullYear();
  const searchPattern = new RegExp(`^${prefix}-${currentYear}-(\\d+)$`);

  const latest = await Model.findOne({ [fieldName]: searchPattern })
    .sort({ createdAt: -1 })
    .lean();

  let nextSequence = 1;
  if (latest && latest[fieldName]) {
    const match = latest[fieldName].match(searchPattern);
    if (match && match[1]) {
      nextSequence = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}-${currentYear}-${String(nextSequence).padStart(4, '0')}`;
}

/**
 * Atomic processing of GRV Storekeeper Acceptance
 * 1. Checks item existence or auto-registers new StockItem
 * 2. Upserts StockBalance in target warehouse
 * 3. Recalculates Moving Weighted Average Cost
 * 4. Logs immutable StockMovement
 * 5. Updates PurchaseOrder received & remaining quantities
 * 6. Generates CreditTransaction if credit terms apply
 */
export async function processGRVAcceptance({
  grv,
  storeKeeperId,
  storeKeeperComment = '',
  deliveryStatus = 'fully_delivered',
  deliveryStatusRemarks = '',
  session = null
}) {
  const opts = session ? { session } : {};
  const acceptedMovements = [];

  for (const item of grv.items) {
    const acceptedQty = Number(item.acceptedQuantity) || 0;
    if (acceptedQty <= 0) continue;

    const acceptedTotalQty =
      Number(item.acceptedTotalQuantity) ||
      acceptedQty * (Number(item.multiplier) || 1);

    let stockItem = null;

    // Check if item exists in StockItem catalog
    if (item.stockItemId) {
      stockItem = await StockItem.findById(item.stockItemId).session(session);
    } else if (item.itemCode) {
      stockItem = await StockItem.findOne({ code: item.itemCode }).session(session);
    } else if (item.itemName) {
      stockItem = await StockItem.findOne({
        name: new RegExp(`^${item.itemName.trim()}$`, 'i')
      }).session(session);
    }

    // Auto-register new StockItem if item is new or not found
    if (!stockItem) {
      const generatedItemCode =
        item.itemCode || (await generateCode('STK', StockItem, 'code'));
      const unitCost = Number(item.unitCost) || 0;
      const multiplier = Number(item.multiplier) || 1;
      const avgCostPerBase = multiplier > 0 ? unitCost / multiplier : unitCost;

      const newStockItemData = {
        code: generatedItemCode,
        name: item.itemName,
        description: item.description || '',
        category: item.category || 'General Media',
        itemType: 'inventory',
        unit: item.unit || 'pcs',
        baseUnit: item.baseUnit || 'pcs',
        multiplierNumerator: item.multiplierNumerator || 1,
        multiplierDenominator: item.multiplierDenominator || 1,
        multiplier,
        unitCost,
        averageUnitCost: Number(avgCostPerBase.toFixed(4)),
        defaultWarehouseId: grv.warehouseId,
        supplierId: grv.supplierId,
        stockStatus: 'in_stock',
        autoRegisteredFromGRV: true,
        status: 'active'
      };

      const [createdItem] = await StockItem.create([newStockItemData], opts);
      stockItem = createdItem;
      item.stockItemId = createdItem._id;
      item.itemCode = createdItem.code;
    }

    // Find or create StockBalance for warehouse and location
    const balanceQuery = {
      stockItemId: stockItem._id,
      warehouseId: grv.warehouseId,
      locationId: item.targetLocationId || null,
      batchNumber: item.batchNumber || null
    };

    let stockBalance = await StockBalance.findOne(balanceQuery).session(session);
    if (!stockBalance) {
      stockBalance = new StockBalance({
        ...balanceQuery,
        binLocation: item.binLocation || '',
        balanceQuantity: 0,
        balanceTotalQuantity: 0,
        reservedQuantity: 0,
        reservedTotalQuantity: 0,
        availableQuantity: 0,
        availableTotalQuantity: 0,
        lotNumber: item.lotNumber || '',
        expiryDate: item.expiryDate || null,
        lastMovementDate: new Date()
      });
    }

    // Capture previous balances for moving cost calculation
    const prevBaseQty = stockBalance.balanceTotalQuantity || 0;
    const prevAvgCost = stockItem.averageUnitCost || 0;
    const incomingCostPerBase =
      item.multiplier > 0 ? item.unitCost / item.multiplier : item.unitCost;

    // Increment balances
    stockBalance.balanceQuantity = Number(
      (stockBalance.balanceQuantity + acceptedQty).toFixed(4)
    );
    stockBalance.balanceTotalQuantity = Number(
      (stockBalance.balanceTotalQuantity + acceptedTotalQty).toFixed(4)
    );
    stockBalance.availableQuantity = Number(
      (stockBalance.balanceQuantity - stockBalance.reservedQuantity).toFixed(4)
    );
    stockBalance.availableTotalQuantity = Number(
      (
        stockBalance.balanceTotalQuantity - stockBalance.reservedTotalQuantity
      ).toFixed(4)
    );
    stockBalance.lastMovementDate = new Date();
    await stockBalance.save(opts);

    // Update Moving Weighted Average Cost on Master Item
    const updatedAvgCost = calculateMovingAverageCost({
      currentBaseQty: prevBaseQty,
      currentAvgCost: prevAvgCost,
      incomingBaseQty: acceptedTotalQty,
      incomingUnitCostPerBaseUnit: incomingCostPerBase
    });

    stockItem.unitCost = item.unitCost;
    stockItem.averageUnitCost = updatedAvgCost;
    stockItem.stockStatus =
      stockBalance.availableQuantity > stockItem.reorderLevelQuantity
        ? 'in_stock'
        : 'low_stock';
    await stockItem.save(opts);

    // Create immutable StockMovement
    const movementCode = await generateCode('MOV', StockMovement, 'movementCode');
    const movement = new StockMovement({
      movementCode,
      stockItemId: stockItem._id,
      warehouseId: grv.warehouseId,
      locationId: item.targetLocationId || null,
      movementType: 'grv_receipt',
      referenceType: 'GoodsReceivedVoucher',
      referenceId: grv._id,
      quantityIn: acceptedQty,
      quantityOut: 0,
      totalQuantityIn: acceptedTotalQty,
      totalQuantityOut: 0,
      balanceQuantityAfter: stockBalance.balanceQuantity,
      balanceTotalQuantityAfter: stockBalance.balanceTotalQuantity,
      unit: item.unit,
      baseUnit: item.baseUnit,
      multiplierNumerator: item.multiplierNumerator,
      multiplierDenominator: item.multiplierDenominator,
      multiplier: item.multiplier,
      unitCost: item.unitCost,
      totalCost: item.totalCost || acceptedQty * item.unitCost,
      batchNumber: item.batchNumber || '',
      lotNumber: item.lotNumber || '',
      expiryDate: item.expiryDate || null,
      performedBy: storeKeeperId,
      movementDate: new Date(),
      notes: `Store GRV Receipt: ${grv.grvCode} - ${storeKeeperComment}`
    });
    await movement.save(opts);
    acceptedMovements.push(movement);
  }

  // Generate official store acceptance sequence number
  const storeGrvNumber = await generateCode('SGRV', grv.constructor, 'storeGrvNumber');
  grv.storeGrvNumber = storeGrvNumber;
  grv.storeKeeperId = storeKeeperId;
  grv.storeAcceptedAt = new Date();
  grv.storeKeeperComment = storeKeeperComment;
  grv.deliveryStatus = deliveryStatus;
  grv.deliveryStatusRemarks = deliveryStatusRemarks;
  grv.status =
    grv.totalAcceptedQuantity >= grv.totalReceivedQuantity
      ? 'accepted'
      : 'partially_accepted';

  await grv.save(opts);

  // Update PurchaseOrder if linked
  if (grv.purchaseOrderId) {
    const po = await PurchaseOrder.findById(grv.purchaseOrderId).session(session);
    if (po) {
      let allFulfilled = true;
      for (const poItem of po.items) {
        const matchingGrvItems = grv.items.filter(
          (gi) =>
            gi.purchaseOrderItemId &&
            gi.purchaseOrderItemId.toString() === poItem._id.toString()
        );
        for (const mItem of matchingGrvItems) {
          poItem.receivedQuantity = Number(
            (poItem.receivedQuantity + (mItem.acceptedQuantity || 0)).toFixed(4)
          );
          poItem.receivedTotalQuantity = Number(
            (
              poItem.receivedTotalQuantity +
              (mItem.acceptedTotalQuantity || 0)
            ).toFixed(4)
          );
        }
        poItem.remainingQuantity = Math.max(
          0,
          Number((poItem.quantity - poItem.receivedQuantity).toFixed(4))
        );
        poItem.remainingTotalQuantity = Math.max(
          0,
          Number((poItem.totalQuantity - poItem.receivedTotalQuantity).toFixed(4))
        );
        if (poItem.receivedQuantity >= poItem.quantity) {
          poItem.fulfillmentStatus = 'fulfilled';
        } else if (poItem.receivedQuantity > 0) {
          poItem.fulfillmentStatus = 'partially_fulfilled';
          allFulfilled = false;
        } else {
          allFulfilled = false;
        }
      }

      po.status = allFulfilled ? 'completed' : 'partially_received';
      await po.save(opts);

      // Create Finance CreditTransaction if payable
      if (po.paymentTerms && po.paymentTerms.toLowerCase().includes('credit')) {
        const transactionCode = await generateCode(
          'CTX',
          CreditTransaction,
          'transactionCode'
        );
        const creditTx = new CreditTransaction({
          transactionCode,
          supplierId: grv.supplierId,
          purchaseOrderId: po._id,
          grvId: grv._id,
          transactionType: 'invoice_credit',
          transactionDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
          description: `Payable bill for accepted GRV ${grv.grvCode} (PO ${po.purchaseOrderCode})`,
          creditAmount: grv.totalAmount,
          debitAmount: 0,
          balance: grv.totalAmount,
          paymentStatus: 'unpaid',
          createdBy: storeKeeperId,
          notes: storeKeeperComment
        });
        await creditTx.save(opts);
      }
    }
  }

  return { grv, acceptedMovements };
}

/**
 * Reserve stock when a StaffRequest is approved
 */
export async function reserveStockForRequest({ staffRequest, session = null }) {
  const opts = session ? { session } : {};
  for (const item of staffRequest.items) {
    if (item.approvalStatus !== 'approved' || item.approvedQuantity <= 0) continue;

    const balance = await StockBalance.findOne({
      stockItemId: item.stockItemId,
      warehouseId: staffRequest.warehouseId
    }).session(session);

    if (!balance) {
      throw new Error(
        `Cannot approve item ${item.itemName}: Stock balance record does not exist in target warehouse.`
      );
    }

    if (balance.availableQuantity < item.approvedQuantity) {
      throw new Error(
        `Insufficient available stock for ${item.itemName}. Available: ${balance.availableQuantity}, Approved: ${item.approvedQuantity}`
      );
    }

    balance.reservedQuantity = Number(
      (balance.reservedQuantity + item.approvedQuantity).toFixed(4)
    );
    balance.reservedTotalQuantity = Number(
      (balance.reservedTotalQuantity + item.approvedTotalQuantity).toFixed(4)
    );
    balance.availableQuantity = Number(
      (balance.balanceQuantity - balance.reservedQuantity).toFixed(4)
    );
    balance.availableTotalQuantity = Number(
      (balance.balanceTotalQuantity - balance.reservedTotalQuantity).toFixed(4)
    );
    await balance.save(opts);
  }
}

/**
 * Process Store Issue Voucher (SIV) dispensing stock
 */
export async function processSIVIssuance({ siv, issuedBy, session = null }) {
  const opts = session ? { session } : {};
  const movements = [];

  for (const item of siv.items) {
    const issuedQty = Number(item.issuedQuantity) || 0;
    if (issuedQty <= 0) continue;

    const issuedTotalQty =
      Number(item.issuedTotalQuantity) ||
      issuedQty * (Number(item.multiplier) || 1);

    const balance = await StockBalance.findOne({
      stockItemId: item.stockItemId,
      warehouseId: siv.warehouseId
    }).session(session);

    if (!balance || balance.balanceQuantity < issuedQty) {
      throw new Error(
        `Insufficient on-hand stock for item ${item.itemName} in issuing warehouse.`
      );
    }

    // Decrement physical and reserved balances
    balance.balanceQuantity = Number(
      (balance.balanceQuantity - issuedQty).toFixed(4)
    );
    balance.balanceTotalQuantity = Number(
      (balance.balanceTotalQuantity - issuedTotalQty).toFixed(4)
    );
    balance.reservedQuantity = Math.max(
      0,
      Number((balance.reservedQuantity - (item.approvedQuantity || issuedQty)).toFixed(4))
    );
    balance.reservedTotalQuantity = Math.max(
      0,
      Number(
        (
          balance.reservedTotalQuantity -
          (item.approvedTotalQuantity || issuedTotalQty)
        ).toFixed(4)
      )
    );
    balance.availableQuantity = Number(
      (balance.balanceQuantity - balance.reservedQuantity).toFixed(4)
    );
    balance.availableTotalQuantity = Number(
      (balance.balanceTotalQuantity - balance.reservedTotalQuantity).toFixed(4)
    );
    balance.lastMovementDate = new Date();
    await balance.save(opts);

    // Update StockItem status
    const stockItem = await StockItem.findById(item.stockItemId).session(session);
    if (stockItem) {
      item.unitCost = stockItem.averageUnitCost;
      item.totalCost = Number((issuedTotalQty * stockItem.averageUnitCost).toFixed(2));
      stockItem.stockStatus =
        balance.availableQuantity <= 0
          ? 'out_of_stock'
          : balance.availableQuantity <= stockItem.reorderLevelQuantity
          ? 'low_stock'
          : 'in_stock';
      await stockItem.save(opts);
    }

    // Log StockMovement
    const movementCode = await generateCode('MOV', StockMovement, 'movementCode');
    const movement = new StockMovement({
      movementCode,
      stockItemId: item.stockItemId,
      warehouseId: siv.warehouseId,
      movementType: 'siv_issue',
      referenceType: 'StoreIssueVoucher',
      referenceId: siv._id,
      quantityIn: 0,
      quantityOut: issuedQty,
      totalQuantityIn: 0,
      totalQuantityOut: issuedTotalQty,
      balanceQuantityAfter: balance.balanceQuantity,
      balanceTotalQuantityAfter: balance.balanceTotalQuantity,
      unit: item.unit,
      baseUnit: item.baseUnit,
      multiplierNumerator: item.multiplierNumerator,
      multiplierDenominator: item.multiplierDenominator,
      multiplier: item.multiplier,
      unitCost: item.unitCost,
      totalCost: item.totalCost,
      performedBy: issuedBy,
      movementDate: new Date(),
      notes: `SIV Issue: ${siv.sivCode}`
    });
    await movement.save(opts);
    movements.push(movement);
  }

  // Update StaffRequest issued status
  if (siv.staffRequestId) {
    const staffReq = await StaffRequest.findById(siv.staffRequestId).session(session);
    if (staffReq) {
      let allIssued = true;
      for (const rItem of staffReq.items) {
        const matchingSivItems = siv.items.filter(
          (si) =>
            si.staffRequestItemId &&
            si.staffRequestItemId.toString() === rItem._id.toString()
        );
        for (const mItem of matchingSivItems) {
          rItem.issuedQuantity = Number(
            (rItem.issuedQuantity + (mItem.issuedQuantity || 0)).toFixed(4)
          );
          rItem.issuedTotalQuantity = Number(
            (rItem.issuedTotalQuantity + (mItem.issuedTotalQuantity || 0)).toFixed(4)
          );
        }
        if (rItem.issuedQuantity < rItem.approvedQuantity) {
          allIssued = false;
        }
      }
      staffReq.issuedStatus = allIssued ? 'fully_issued' : 'partially_issued';
      await staffReq.save(opts);
    }
  }

  return { siv, movements };
}
