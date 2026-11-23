import GoodsReceivedVoucher from '../models/GoodsReceivedVoucher.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import {
  generateCode,
  processGRVAcceptance,
  withTransaction
} from '../utils/inventoryService.js';

/**
 * Get all Goods Received Vouchers with filtering
 */
export const getGRVs = async (req, res) => {
  try {
    const { status, warehouseId, supplierId, purchaserId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (warehouseId) query.warehouseId = warehouseId;
    if (supplierId) query.supplierId = supplierId;
    if (purchaserId) query.purchaserId = purchaserId;

    const total = await GoodsReceivedVoucher.countDocuments(query);
    const grvs = await GoodsReceivedVoucher.find(query)
      .populate('supplierId', 'name code phone')
      .populate('warehouseId', 'name code')
      .populate('purchaserId', 'email')
      .populate('storeKeeperId', 'email')
      .populate('purchaseOrderId', 'purchaseOrderCode')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: grvs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: grvs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single GRV by ID
 */
export const getGRVById = async (req, res) => {
  try {
    const grv = await GoodsReceivedVoucher.findById(req.params.id)
      .populate('supplierId')
      .populate('warehouseId')
      .populate('purchaserId', 'email')
      .populate('storeKeeperId', 'email')
      .populate('purchaseOrderId')
      .populate('items.stockItemId')
      .populate('items.targetLocationId');

    if (!grv) {
      return res.status(404).json({ success: false, message: 'GRV not found' });
    }

    res.json({ success: true, data: grv });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Step 1: Purchaser generates GRV upon delivery
 * Initial status: 'pending_store_acceptance'
 * Inventory remains unaffected at this step!
 */
export const createGRVByPurchaser = async (req, res) => {
  try {
    const {
      purchaseOrderId,
      supplierId,
      warehouseId,
      supplierInvoiceNumber,
      deliveryNoteNumber,
      deliveryStatus = 'fully_delivered',
      deliveryStatusRemarks = '',
      items = [],
      notes = ''
    } = req.body;

    if (!supplierId || !warehouseId || !supplierInvoiceNumber) {
      return res.status(400).json({
        success: false,
        message: 'supplierId, warehouseId, and supplierInvoiceNumber are required'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required in GRV'
      });
    }

    const grvCode = await generateCode('GRV', GoodsReceivedVoucher, 'grvCode');

    let totalReceivedQuantity = 0;
    let totalAmount = 0;

    const formattedItems = items.map((item) => {
      const receivedQty = Number(item.receivedQuantity) || 0;
      const multiplier = Number(item.multiplier) || 1;
      const receivedTotalQty = Number((receivedQty * multiplier).toFixed(4));
      const unitCost = Number(item.unitCost) || 0;
      const totalCost = Number((receivedQty * unitCost).toFixed(2));

      totalReceivedQuantity += receivedQty;
      totalAmount += totalCost;

      return {
        ...item,
        receivedQuantity: receivedQty,
        receivedTotalQuantity: receivedTotalQty,
        acceptedQuantity: 0,
        acceptedTotalQuantity: 0,
        rejectedQuantity: 0,
        rejectedTotalQuantity: 0,
        unitCost,
        totalCost,
        condition: item.condition || 'good'
      };
    });

    const grv = new GoodsReceivedVoucher({
      grvCode,
      purchaseOrderId: purchaseOrderId || null,
      supplierId,
      warehouseId,
      purchaserId: req.user._id,
      purchaserGeneratedDate: new Date(),
      supplierInvoiceNumber,
      deliveryNoteNumber,
      status: 'pending_store_acceptance',
      deliveryStatus,
      deliveryStatusRemarks,
      items: formattedItems,
      totalItems: formattedItems.length,
      totalReceivedQuantity,
      totalAcceptedQuantity: 0,
      totalRejectedQuantity: 0,
      totalAmount,
      notes
    });

    await grv.save();

    res.status(201).json({
      success: true,
      message: 'GRV created by Purchaser and is pending Storekeeper acceptance',
      data: grv
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Step 2: Storekeeper reviews, inspects, and accepts/rejects GRV
 * - Records storeKeeperComment and deliveryStatus
 * - Generates storeGrvNumber
 * - Atomically executes stock balance upsert, new item registration, and ledger movements
 */
export const acceptGRVByStoreKeeper = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      storeKeeperComment = '',
      deliveryStatus = 'fully_delivered',
      deliveryStatusRemarks = '',
      items = []
    } = req.body;

    const grv = await GoodsReceivedVoucher.findById(id);
    if (!grv) {
      return res.status(404).json({ success: false, message: 'GRV not found' });
    }

    if (grv.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'GRV has already been accepted and stock updated'
      });
    }

    if (grv.status === 'rejected' || grv.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept GRV in ${grv.status} status`
      });
    }

    // Update item-level acceptance/rejection from storekeeper's physical check
    let totalAcceptedQuantity = 0;
    let totalRejectedQuantity = 0;
    let totalAmount = 0;

    if (items && items.length > 0) {
      for (const itemInput of items) {
        const targetItem = grv.items.id(itemInput._id) || grv.items[itemInput.index];
        if (targetItem) {
          const acceptedQty = Number(itemInput.acceptedQuantity) ?? targetItem.receivedQuantity;
          const rejectedQty = Number(itemInput.rejectedQuantity) || 0;
          const multiplier = Number(targetItem.multiplier) || 1;

          targetItem.acceptedQuantity = acceptedQty;
          targetItem.acceptedTotalQuantity = Number((acceptedQty * multiplier).toFixed(4));
          targetItem.rejectedQuantity = rejectedQty;
          targetItem.rejectedTotalQuantity = Number((rejectedQty * multiplier).toFixed(4));
          targetItem.condition = itemInput.condition || targetItem.condition || 'good';
          targetItem.storeRemarks = itemInput.storeRemarks || '';
          targetItem.targetLocationId = itemInput.targetLocationId || targetItem.targetLocationId;
          targetItem.binLocation = itemInput.binLocation || targetItem.binLocation;
          targetItem.batchNumber = itemInput.batchNumber || targetItem.batchNumber;
          targetItem.lotNumber = itemInput.lotNumber || targetItem.lotNumber;
          targetItem.expiryDate = itemInput.expiryDate || targetItem.expiryDate;

          totalAcceptedQuantity += acceptedQty;
          totalRejectedQuantity += rejectedQty;
          totalAmount += acceptedQty * targetItem.unitCost;
        }
      }
    } else {
      // Default: accept all received if not itemized
      for (const targetItem of grv.items) {
        const acceptedQty = targetItem.receivedQuantity;
        const multiplier = Number(targetItem.multiplier) || 1;
        targetItem.acceptedQuantity = acceptedQty;
        targetItem.acceptedTotalQuantity = Number((acceptedQty * multiplier).toFixed(4));
        targetItem.rejectedQuantity = 0;
        targetItem.rejectedTotalQuantity = 0;
        totalAcceptedQuantity += acceptedQty;
        totalAmount += acceptedQty * targetItem.unitCost;
      }
    }

    grv.totalAcceptedQuantity = totalAcceptedQuantity;
    grv.totalRejectedQuantity = totalRejectedQuantity;
    grv.totalAmount = totalAmount;

    // Process atomic stock upsert, moving average cost update, and PO/Finance linking
    const result = await withTransaction(async (session) => {
      return await processGRVAcceptance({
        grv,
        storeKeeperId: req.user._id,
        storeKeeperComment,
        deliveryStatus,
        deliveryStatusRemarks,
        session
      });
    });

    res.json({
      success: true,
      message:
        'GRV accepted by Storekeeper. Stock balances and ledger updated successfully.',
      data: result.grv
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Storekeeper completely rejects the incoming GRV
 */
export const rejectGRVByStoreKeeper = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeKeeperComment = 'Goods rejected by Storekeeper' } = req.body;

    const grv = await GoodsReceivedVoucher.findById(id);
    if (!grv) {
      return res.status(404).json({ success: false, message: 'GRV not found' });
    }

    if (grv.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject an already accepted GRV'
      });
    }

    grv.status = 'rejected';
    grv.storeKeeperId = req.user._id;
    grv.storeAcceptedAt = new Date();
    grv.storeKeeperComment = storeKeeperComment;
    await grv.save();

    res.json({
      success: true,
      message: 'GRV rejected. No inventory updates performed.',
      data: grv
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
