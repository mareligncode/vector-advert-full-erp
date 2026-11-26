import StaffRequest from '../models/StaffRequest.js';
import StoreIssueVoucher from '../models/StoreIssueVoucher.js';
import StaffReturn from '../models/StaffReturn.js';
import GRVReturn from '../models/GRVReturn.js';
import SIVWaste from '../models/SIVWaste.js';
import StockBalance from '../models/StockBalance.js';
import StockMovement from '../models/StockMovement.js';
import {
  generateCode,
  reserveStockForRequest,
  processSIVIssuance,
  withTransaction
} from '../utils/inventoryService.js';
import { attachFilesToEvidence, getEvidenceForEntity } from '../utils/evidenceHelper.js';

// ==========================================
// 1. Staff Requisitions (Office & Workshop)
// ==========================================

export const getStaffRequests = async (req, res) => {
  try {
    const { requestType, approvalStatus, issuedStatus, requestedBy, page = 1, limit = 50 } = req.query;
    const query = {};

    if (requestType) query.requestType = requestType;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (issuedStatus) query.issuedStatus = issuedStatus;
    if (requestedBy) query.requestedBy = requestedBy;

    const total = await StaffRequest.countDocuments(query);
    const requests = await StaffRequest.find(query)
      .populate('requestedBy', 'email employeeNumber')
      .populate('approvedBy', 'email')
      .populate('warehouseId', 'name code')
      .populate('items.stockItemId', 'name code unit baseUnit')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: requests.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStaffRequestById = async (req, res) => {
  try {
    const request = await StaffRequest.findById(req.params.id)
      .populate('requestedBy', 'email employeeNumber')
      .populate('approvedBy', 'email')
      .populate('warehouseId', 'name code')
      .populate('items.stockItemId');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const evidence = await getEvidenceForEntity('StaffRequest', request._id);

    res.json({
      success: true,
      data: {
        ...request.toObject(),
        evidence: evidence?.attachments || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaffRequest = async (req, res) => {
  try {
    const {
      requestType = 'office',
      jobOrderId,
      departmentId,
      workshopId,
      warehouseId,
      requiredDate,
      purpose,
      items = [],
      notes = '',
      attachments = []
    } = req.body;

    // Rule 9.4 & 9.6: Workshop request MUST require jobOrderId; office must not
    if (requestType === 'workshop' && !jobOrderId) {
      return res.status(400).json({
        success: false,
        message: 'jobOrderId is mandatory for workshop material requests'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required in the requisition'
      });
    }

    const requestCode = await generateCode('REQ', StaffRequest, 'requestCode');

    let totalRequestedQuantity = 0;
    let totalRequestedTotalQuantity = 0;

    const formattedItems = items.map((item) => {
      const requestedQty = Number(item.requestedQuantity) || 0;
      const multiplier = Number(item.multiplier) || 1;
      const requestedTotal = Number((requestedQty * multiplier).toFixed(4));

      totalRequestedQuantity += requestedQty;
      totalRequestedTotalQuantity += requestedTotal;

      return {
        ...item,
        requestedQuantity: requestedQty,
        requestedTotalQuantity: requestedTotal,
        approvedQuantity: 0,
        approvedTotalQuantity: 0,
        issuedQuantity: 0,
        issuedTotalQuantity: 0,
        approvalStatus: 'pending'
      };
    });

    const staffRequest = new StaffRequest({
      requestCode,
      requestType,
      jobOrderId: requestType === 'workshop' ? jobOrderId : null,
      requestedBy: req.user._id,
      departmentId,
      workshopId: requestType === 'workshop' ? workshopId : null,
      warehouseId,
      requiredDate,
      purpose,
      items: formattedItems,
      totalItems: formattedItems.length,
      totalRequestedQuantity,
      totalRequestedTotalQuantity,
      approvalStatus: 'pending',
      issuedStatus: 'unissued',
      notes
    });

    await staffRequest.save();

    // Universal Evidence Table Integration
    if (attachments.length > 0 || req.files?.length > 0) {
      const filesToAttach = req.files?.length > 0 ? req.files : attachments;
      await attachFilesToEvidence({
        entityType: 'StaffRequest',
        entityId: staffRequest._id,
        files: filesToAttach,
        user: req.user,
        title: `Requisition ${staffRequest.requestCode} Job Blueprint/Design`,
        description: staffRequest.purpose
      });
    }

    res.status(201).json({
      success: true,
      message: 'Requisition submitted successfully',
      data: staffRequest
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const approveStaffRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { items = [], approvalComment, comments, notes } = req.body || {};

    const staffRequest = await StaffRequest.findById(id);
    if (!staffRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (staffRequest.approvalStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'Already approved' });
    }

    let totalApprovedQuantity = 0;
    let totalApprovedTotalQuantity = 0;

    // Apply item-level approval quantities
    if (items && items.length > 0) {
      for (const itemInput of items) {
        const target = staffRequest.items.id(itemInput._id);
        if (target) {
          const approvedQty = Number(itemInput.approvedQuantity) ?? target.requestedQuantity;
          const multiplier = Number(target.multiplier) || 1;
          target.approvedQuantity = approvedQty;
          target.approvedTotalQuantity = Number((approvedQty * multiplier).toFixed(4));
          target.approvalStatus = itemInput.approvalStatus || (approvedQty > 0 ? 'approved' : 'rejected');
          target.rejectionReason = itemInput.rejectionReason || '';

          if (target.approvalStatus === 'approved') {
            totalApprovedQuantity += approvedQty;
            totalApprovedTotalQuantity += target.approvedTotalQuantity;
          }
        }
      }
    } else {
      // Approve all requested by default
      for (const target of staffRequest.items) {
        target.approvedQuantity = target.requestedQuantity;
        target.approvedTotalQuantity = target.requestedTotalQuantity;
        target.approvalStatus = 'approved';
        totalApprovedQuantity += target.approvedQuantity;
        totalApprovedTotalQuantity += target.approvedTotalQuantity;
      }
    }

    staffRequest.totalApprovedQuantity = totalApprovedQuantity;
    staffRequest.totalApprovedTotalQuantity = totalApprovedTotalQuantity;
    staffRequest.approvalStatus =
      totalApprovedQuantity >= staffRequest.totalRequestedQuantity
        ? 'approved'
        : totalApprovedQuantity > 0
        ? 'partially_approved'
        : 'rejected';
    staffRequest.approvedBy = req.user._id;
    staffRequest.approvedAt = new Date();
    const reviewNote = approvalComment || comments || notes;
    if (reviewNote) {
      staffRequest.approvalComment = reviewNote;
    }

    // Atomic reservation of stock to prevent double-allocation
    await withTransaction(async (session) => {
      if (staffRequest.warehouseId) {
        await reserveStockForRequest({ staffRequest, session });
      }
      const opts = session ? { session } : {};
      await staffRequest.save(opts);
    });

    res.json({
      success: true,
      message: 'Request approved and stock reserved successfully',
      data: staffRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectStaffRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason: bodyReason, comments } = req.body || {};
    const rejectionReason =
      bodyReason || comments || 'Requisition rejected by Storekeeper / Management';

    const staffRequest = await StaffRequest.findById(id);
    if (!staffRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    staffRequest.approvalStatus = 'rejected';
    staffRequest.rejectionReason = rejectionReason;
    staffRequest.approvedBy = req.user._id;
    staffRequest.approvedAt = new Date();
    await staffRequest.save();

    res.json({
      success: true,
      message: 'Requisition rejected',
      data: staffRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. Store Issue Voucher (SIV) Dispensing
// ==========================================

export const getStoreIssueVouchers = async (req, res) => {
  try {
    const { warehouseId, staffRequestId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (warehouseId) query.warehouseId = warehouseId;
    if (staffRequestId) query.staffRequestId = staffRequestId;

    const total = await StoreIssueVoucher.countDocuments(query);
    const sivs = await StoreIssueVoucher.find(query)
      .populate('staffRequestId', 'requestCode requestType purpose')
      .populate('warehouseId', 'name code')
      .populate('issuedBy', 'email')
      .populate('receivedBy', 'email')
      .populate('items.stockItemId', 'name code unit')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: sivs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: sivs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStoreIssueVoucherById = async (req, res) => {
  try {
    const siv = await StoreIssueVoucher.findById(req.params.id)
      .populate('staffRequestId')
      .populate('warehouseId')
      .populate('issuedBy', 'email')
      .populate('receivedBy', 'email')
      .populate('items.stockItemId');

    if (!siv) {
      return res.status(404).json({ success: false, message: 'SIV not found' });
    }

    const evidence = await getEvidenceForEntity('StoreIssueVoucher', siv._id);

    res.json({
      success: true,
      data: {
        ...siv.toObject(),
        evidence: evidence?.attachments || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStoreIssueVoucher = async (req, res) => {
  try {
    const {
      staffRequestId,
      warehouseId,
      receivedBy,
      items = [],
      notes = '',
      attachments = []
    } = req.body;

    const staffRequest = await StaffRequest.findById(staffRequestId);
    if (!staffRequest) {
      return res.status(404).json({ success: false, message: 'Staff request not found' });
    }

    const sivCode = await generateCode('SIV', StoreIssueVoucher, 'sivCode');

    let totalQuantity = 0;
    let totalTotalQuantity = 0;

    const formattedItems = items.map((item) => {
      const issuedQty = Number(item.issuedQuantity) || 0;
      const multiplier = Number(item.multiplier) || 1;
      const issuedTotal = Number((issuedQty * multiplier).toFixed(4));

      totalQuantity += issuedQty;
      totalTotalQuantity += issuedTotal;

      return {
        ...item,
        issuedQuantity: issuedQty,
        issuedTotalQuantity: issuedTotal
      };
    });

    const siv = new StoreIssueVoucher({
      sivCode,
      staffRequestId,
      warehouseId: warehouseId || staffRequest.warehouseId,
      issuedBy: req.user._id,
      receivedBy: receivedBy || staffRequest.requestedBy,
      issueDate: new Date(),
      items: formattedItems,
      totalItems: formattedItems.length,
      totalQuantity,
      totalTotalQuantity,
      status: 'issued',
      notes
    });

    // Execute atomic stock deduction and ledger logging
    const result = await withTransaction(async (session) => {
      const opts = session ? { session } : {};
      await siv.save(opts);
      return await processSIVIssuance({
        siv,
        issuedBy: req.user._id,
        session
      });
    });

    // Universal Evidence Table Integration (Signed collection slip photo)
    if (attachments.length > 0 || req.files?.length > 0) {
      const filesToAttach = req.files?.length > 0 ? req.files : attachments;
      await attachFilesToEvidence({
        entityType: 'StoreIssueVoucher',
        entityId: siv._id,
        files: filesToAttach,
        user: req.user,
        title: `SIV ${siv.sivCode} Signed Receipt Document`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Items issued and inventory deducted successfully',
      data: result.siv
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. Staff Return & Returns to Suppliers
// ==========================================

export const getStaffReturns = async (req, res) => {
  try {
    const returns = await StaffReturn.find()
      .populate('sivId', 'sivCode')
      .populate('staffRequestId', 'requestCode')
      .populate('returnedBy', 'email')
      .populate('receivedBy', 'email')
      .populate('warehouseId', 'name code')
      .populate('items.stockItemId', 'name code unit')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: returns.length, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaffReturn = async (req, res) => {
  try {
    const returnCode = await generateCode('RET', StaffReturn, 'returnCode');
    const staffReturn = new StaffReturn({
      ...req.body,
      returnCode,
      receivedBy: req.user._id,
      status: 'accepted'
    });

    await withTransaction(async (session) => {
      const opts = session ? { session } : {};
      for (const item of staffReturn.items) {
        const acceptedQty = Number(item.acceptedQuantity) || 0;
        if (acceptedQty <= 0) continue;

        const multiplier = Number(item.multiplier) || 1;
        const acceptedTotal = acceptedQty * multiplier;

        const balance = await StockBalance.findOne({
          stockItemId: item.stockItemId,
          warehouseId: staffReturn.warehouseId
        }).session(session);

        if (balance) {
          balance.balanceQuantity += acceptedQty;
          balance.balanceTotalQuantity += acceptedTotal;
          balance.availableQuantity += acceptedQty;
          balance.availableTotalQuantity += acceptedTotal;
          await balance.save(opts);

          const movementCode = await generateCode('MOV', StockMovement, 'movementCode');
          const movement = new StockMovement({
            movementCode,
            stockItemId: item.stockItemId,
            warehouseId: staffReturn.warehouseId,
            movementType: 'staff_return',
            referenceType: 'StaffReturn',
            referenceId: staffReturn._id,
            quantityIn: acceptedQty,
            totalQuantityIn: acceptedTotal,
            balanceQuantityAfter: balance.balanceQuantity,
            balanceTotalQuantityAfter: balance.balanceTotalQuantity,
            unit: item.unit || 'pcs',
            baseUnit: item.baseUnit || 'pcs',
            performedBy: req.user._id,
            movementDate: new Date(),
            notes: `Staff Return: ${item.reason || staffReturn.returnCode}`
          });
          await movement.save(opts);
        }
      }

      await staffReturn.save(opts);
    });

    if (req.body.attachments?.length > 0 || req.files?.length > 0) {
      await attachFilesToEvidence({
        entityType: 'StaffReturn',
        entityId: staffReturn._id,
        files: req.files?.length > 0 ? req.files : req.body.attachments,
        user: req.user,
        title: `Staff Return ${staffReturn.returnCode} Proof`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Staff return processed and stock credited back',
      data: staffReturn
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. Returns to Supplier (GRV Return)
// ==========================================

export const getGRVReturns = async (req, res) => {
  try {
    const returns = await GRVReturn.find()
      .populate('originalGrvId', 'grvCode storeGrvNumber')
      .populate('supplierId', 'name code')
      .populate('warehouseId', 'name code')
      .populate('returnedBy', 'email')
      .populate('items.stockItemId', 'name code unit')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: returns.length, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGRVReturn = async (req, res) => {
  try {
    const returnCode = await generateCode('VRET', GRVReturn, 'returnCode');
    const grvReturn = new GRVReturn({
      ...req.body,
      returnCode,
      returnedBy: req.user._id,
      status: 'approved'
    });

    await withTransaction(async (session) => {
      const opts = session ? { session } : {};
      for (const item of grvReturn.items) {
        const retQty = Number(item.quantity) || 0;
        const multiplier = Number(item.multiplier) || 1;
        const retTotal = retQty * multiplier;

        const balance = await StockBalance.findOne({
          stockItemId: item.stockItemId,
          warehouseId: grvReturn.warehouseId
        }).session(session);

        if (balance) {
          balance.balanceQuantity = Math.max(0, balance.balanceQuantity - retQty);
          balance.balanceTotalQuantity = Math.max(0, balance.balanceTotalQuantity - retTotal);
          balance.availableQuantity = Math.max(0, balance.balanceQuantity - balance.reservedQuantity);
          await balance.save(opts);

          const movementCode = await generateCode('MOV', StockMovement, 'movementCode');
          const movement = new StockMovement({
            movementCode,
            stockItemId: item.stockItemId,
            warehouseId: grvReturn.warehouseId,
            movementType: 'supplier_return',
            referenceType: 'GRVReturn',
            referenceId: grvReturn._id,
            quantityOut: retQty,
            totalQuantityOut: retTotal,
            balanceQuantityAfter: balance.balanceQuantity,
            balanceTotalQuantityAfter: balance.balanceTotalQuantity,
            unit: item.unit || 'pcs',
            baseUnit: item.baseUnit || 'pcs',
            performedBy: req.user._id,
            movementDate: new Date(),
            notes: `Supplier Return: ${grvReturn.returnCode} - ${item.reason || ''}`
          });
          await movement.save(opts);
        }
      }

      await grvReturn.save(opts);
    });

    if (req.body.attachments?.length > 0 || req.files?.length > 0) {
      await attachFilesToEvidence({
        entityType: 'GRVReturn',
        entityId: grvReturn._id,
        files: req.files?.length > 0 ? req.files : req.body.attachments,
        user: req.user,
        title: `Supplier Return ${grvReturn.returnCode} Waybill/Debit Note`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Goods returned to supplier and stock deducted successfully',
      data: grvReturn
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. Store Scrap & Waste Write-Off
// ==========================================

export const getSIVWastes = async (req, res) => {
  try {
    const wastes = await SIVWaste.find()
      .populate('warehouseId', 'name code')
      .populate('reportedBy', 'email')
      .populate('items.stockItemId', 'name code unit')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: wastes.length, data: wastes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSIVWaste = async (req, res) => {
  try {
    const wasteCode = await generateCode('WST', SIVWaste, 'wasteCode');
    const waste = new SIVWaste({
      ...req.body,
      wasteCode,
      reportedBy: req.user._id,
      status: 'approved'
    });

    await withTransaction(async (session) => {
      const opts = session ? { session } : {};
      for (const item of waste.items) {
        const wasteQty = Number(item.quantity) || 0;
        const multiplier = Number(item.multiplier) || 1;
        const wasteTotal = wasteQty * multiplier;

        const balance = await StockBalance.findOne({
          stockItemId: item.stockItemId,
          warehouseId: waste.warehouseId
        }).session(session);

        if (balance) {
          balance.balanceQuantity = Math.max(0, balance.balanceQuantity - wasteQty);
          balance.balanceTotalQuantity = Math.max(0, balance.balanceTotalQuantity - wasteTotal);
          balance.availableQuantity = Math.max(0, balance.balanceQuantity - balance.reservedQuantity);
          await balance.save(opts);

          const movementCode = await generateCode('MOV', StockMovement, 'movementCode');
          const movement = new StockMovement({
            movementCode,
            stockItemId: item.stockItemId,
            warehouseId: waste.warehouseId,
            movementType: 'waste',
            referenceType: 'SIVWaste',
            referenceId: waste._id,
            quantityOut: wasteQty,
            totalQuantityOut: wasteTotal,
            balanceQuantityAfter: balance.balanceQuantity,
            balanceTotalQuantityAfter: balance.balanceTotalQuantity,
            unit: item.unit || 'pcs',
            baseUnit: item.baseUnit || 'pcs',
            performedBy: req.user._id,
            movementDate: new Date(),
            notes: `Waste write-off: ${waste.reason}`
          });
          await movement.save(opts);
        }
      }

      await waste.save(opts);
    });

    if (req.body.attachments?.length > 0 || req.files?.length > 0) {
      await attachFilesToEvidence({
        entityType: 'SIVWaste',
        entityId: waste._id,
        files: req.files?.length > 0 ? req.files : req.body.attachments,
        user: req.user,
        title: `Waste Write-Off ${waste.wasteCode} Damage Photos`,
        description: waste.reason
      });
    }

    res.status(201).json({
      success: true,
      message: 'Stock waste recorded and inventory written off',
      data: waste
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
