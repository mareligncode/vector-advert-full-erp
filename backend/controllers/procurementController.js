import PurchaseRequest from '../models/PurchaseRequest.js';
import ProcurementAssignment from '../models/ProcurementAssignment.js';
import VendorPriceComparison from '../models/VendorPriceComparison.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import PurchaserAuction from '../models/PurchaserAuction.js';
import { generateCode } from '../utils/inventoryService.js';
import { attachFilesToEvidence, getEvidenceForEntity } from '../utils/evidenceHelper.js';

// ==========================================
// 1. Purchase Requests (PR)
// ==========================================

export const getPurchaseRequests = async (req, res) => {
  try {
    const { approvalStatus, procurementStatus, requestedBy, page = 1, limit = 50 } = req.query;
    const query = {};

    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (procurementStatus) query.procurementStatus = procurementStatus;
    if (requestedBy) query.requestedBy = requestedBy;

    const total = await PurchaseRequest.countDocuments(query);
    const prs = await PurchaseRequest.find(query)
      .populate('requestedBy', 'email employeeNumber')
      .populate('approvedBy', 'email')
      .populate('items.preferredSupplierId', 'name code')
      .populate('items.stockItemId', 'name code unit')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: prs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: prs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPurchaseRequestById = async (req, res) => {
  try {
    const pr = await PurchaseRequest.findById(req.params.id)
      .populate('requestedBy', 'email employeeNumber')
      .populate('approvedBy', 'email')
      .populate('items.preferredSupplierId')
      .populate('items.stockItemId');

    if (!pr) {
      return res.status(404).json({ success: false, message: 'Purchase request not found' });
    }

    const evidence = await getEvidenceForEntity('PurchaseRequest', pr._id);

    res.json({
      success: true,
      data: {
        ...pr.toObject(),
        evidence: evidence?.attachments || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPurchaseRequest = async (req, res) => {
  try {
    const {
      departmentId,
      requestType = 'office',
      jobOrderId,
      requiredDate,
      purpose,
      items = [],
      notes = '',
      attachments = []
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required in the purchase request'
      });
    }

    const requestCode = await generateCode('PR', PurchaseRequest, 'requestCode');

    let totalQuantity = 0;
    let totalTotalQuantity = 0;
    let estimatedTotalCost = 0;

    const formattedItems = items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const multiplier = Number(item.multiplier) || 1;
      const totalQty = Number((qty * multiplier).toFixed(4));
      const estUnitCost = Number(item.estimatedUnitCost) || 0;
      const estTotal = Number((qty * estUnitCost).toFixed(2));

      totalQuantity += qty;
      totalTotalQuantity += totalQty;
      estimatedTotalCost += estTotal;

      return {
        ...item,
        stockItemId: item.stockItemId || null,
        isNewItem: Boolean(item.isNewItem || !item.stockItemId),
        itemType: item.itemType || 'inventory',
        quantity: qty,
        totalQuantity: totalQty,
        estimatedUnitCost: estUnitCost,
        estimatedTotalCost: estTotal
      };
    });

    const pr = new PurchaseRequest({
      requestCode,
      requestedBy: req.user._id,
      departmentId,
      requestType,
      jobOrderId: jobOrderId || null,
      requiredDate,
      purpose,
      items: formattedItems,
      totalItems: formattedItems.length,
      totalQuantity,
      totalTotalQuantity,
      estimatedTotalCost,
      approvalStatus: 'pending',
      procurementStatus: 'unassigned',
      notes
    });

    await pr.save();

    // Universal Evidence Table Integration
    if (attachments.length > 0 || req.files?.length > 0) {
      const filesToAttach = req.files?.length > 0 ? req.files : attachments;
      await attachFilesToEvidence({
        entityType: 'PurchaseRequest',
        entityId: pr._id,
        files: filesToAttach,
        user: req.user,
        title: `PR ${pr.requestCode} Quotation/Catalog Reference`,
        description: pr.purpose
      });
    }

    res.status(201).json({
      success: true,
      message: 'Purchase request submitted successfully',
      data: pr
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const approvePurchaseRequest = async (req, res) => {
  try {
    const pr = await PurchaseRequest.findById(req.params.id);
    if (!pr) {
      return res.status(404).json({ success: false, message: 'Purchase request not found' });
    }

    pr.approvalStatus = 'approved';
    pr.approvedBy = req.user._id;
    pr.approvedAt = new Date();
    await pr.save();

    res.json({ success: true, message: 'Purchase request approved', data: pr });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectPurchaseRequest = async (req, res) => {
  try {
    const pr = await PurchaseRequest.findById(req.params.id);
    if (!pr) {
      return res.status(404).json({ success: false, message: 'Purchase request not found' });
    }

    pr.approvalStatus = 'rejected';
    pr.notes = req.body.rejectionReason || pr.notes;
    pr.approvedBy = req.user._id;
    pr.approvedAt = new Date();
    await pr.save();

    res.json({ success: true, message: 'Purchase request rejected', data: pr });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. Procurement Assignment
// ==========================================

export const getProcurementAssignments = async (req, res) => {
  try {
    const { assignedTo, status } = req.query;
    const query = {};
    if (assignedTo) query.assignedTo = assignedTo;
    if (status) query.status = status;

    const assignments = await ProcurementAssignment.find(query)
      .populate('purchaseRequestId', 'requestCode purpose requiredDate')
      .populate('assignedTo', 'email')
      .populate('assignedBy', 'email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignProcurementRequest = async (req, res) => {
  try {
    const { purchaseRequestId, assignedTo, priority = 'medium', dueDate, notes = '' } = req.body;

    const pr = await PurchaseRequest.findById(purchaseRequestId);
    if (!pr) {
      return res.status(404).json({ success: false, message: 'Purchase request not found' });
    }

    const assignmentCode = await generateCode('ASN', ProcurementAssignment, 'assignmentCode');

    const assignment = new ProcurementAssignment({
      assignmentCode,
      purchaseRequestId,
      assignedTo,
      assignedBy: req.user._id,
      assignedDate: new Date(),
      priority,
      status: 'assigned',
      dueDate,
      notes
    });

    await assignment.save();

    pr.procurementStatus = 'assigned';
    await pr.save();

    res.status(201).json({
      success: true,
      message: 'Purchase request assigned to procurement officer',
      data: assignment
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateProcurementAssignmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const assignment = await ProcurementAssignment.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    );
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. Vendor Price Comparison
// ==========================================

export const getVendorPriceComparisons = async (req, res) => {
  try {
    const comparisons = await VendorPriceComparison.find()
      .populate('purchaseRequestId', 'requestCode purpose')
      .populate('suppliers', 'name code')
      .populate('selectedSupplierId', 'name code')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: comparisons.length, data: comparisons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorPriceComparisonById = async (req, res) => {
  try {
    const comparison = await VendorPriceComparison.findById(req.params.id)
      .populate('purchaseRequestId')
      .populate('suppliers')
      .populate('selectedSupplierId')
      .populate('quotes.supplierId');

    if (!comparison) {
      return res.status(404).json({ success: false, message: 'Comparison not found' });
    }

    const evidence = await getEvidenceForEntity('VendorPriceComparison', comparison._id);

    res.json({
      success: true,
      data: {
        ...comparison.toObject(),
        evidence: evidence?.attachments || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createVendorPriceComparison = async (req, res) => {
  try {
    const comparisonCode = await generateCode('VPC', VendorPriceComparison, 'comparisonCode');
    const comparison = new VendorPriceComparison({
      ...req.body,
      comparisonCode,
      comparisonDate: new Date(),
      approvalStatus: 'pending'
    });

    await comparison.save();

    // Update PR status
    await PurchaseRequest.findByIdAndUpdate(comparison.purchaseRequestId, {
      procurementStatus: 'in_comparison'
    });

    // Universal Evidence Table Integration (Vendor proforma invoice attachments)
    if (req.body.attachments?.length > 0 || req.files?.length > 0) {
      const filesToAttach = req.files?.length > 0 ? req.files : req.body.attachments;
      await attachFilesToEvidence({
        entityType: 'VendorPriceComparison',
        entityId: comparison._id,
        files: filesToAttach,
        user: req.user,
        title: `VPC ${comparison.comparisonCode} Supplier Quotations/Proformas`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Vendor quotation comparison sheet created',
      data: comparison
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const approveVendorPriceComparison = async (req, res) => {
  try {
    const { selectedSupplierId, selectionReason } = req.body;
    const comparison = await VendorPriceComparison.findById(req.params.id);
    if (!comparison) {
      return res.status(404).json({ success: false, message: 'Comparison not found' });
    }

    comparison.selectedSupplierId = selectedSupplierId || comparison.selectedSupplierId;
    comparison.selectionReason = selectionReason || comparison.selectionReason;
    comparison.selectedBy = req.user._id;
    comparison.approvalStatus = 'approved';
    comparison.approvedBy = req.user._id;
    await comparison.save();

    res.json({ success: true, message: 'Price comparison approved and supplier selected', data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. Purchase Orders (PO)
// ==========================================

export const getPurchaseOrders = async (req, res) => {
  try {
    const { status, supplierId, warehouseId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;
    if (warehouseId) query.warehouseId = warehouseId;

    const total = await PurchaseOrder.countDocuments(query);
    const pos = await PurchaseOrder.find(query)
      .populate('supplierId', 'name code phone')
      .populate('warehouseId', 'name code')
      .populate('purchaseRequestId', 'requestCode')
      .populate('createdBy', 'email')
      .populate('items.stockItemId', 'name code unit')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: pos.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: pos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPurchaseOrderById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('supplierId')
      .populate('warehouseId')
      .populate('purchaseRequestId')
      .populate('createdBy', 'email')
      .populate('items.stockItemId');

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    const evidence = await getEvidenceForEntity('PurchaseOrder', po._id);

    res.json({
      success: true,
      data: {
        ...po.toObject(),
        evidence: evidence?.attachments || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPurchaseOrder = async (req, res) => {
  try {
    const {
      purchaseRequestId,
      comparisonId,
      supplierId,
      warehouseId,
      expectedDeliveryDate,
      paymentTerms = 'Credit - 30 days after GRV',
      items = [],
      subtotal = 0,
      taxAmount = 0,
      deliveryCost = 0,
      discount = 0,
      totalAmount = 0,
      notes = '',
      attachments = []
    } = req.body;

    const purchaseOrderCode = await generateCode('PO', PurchaseOrder, 'purchaseOrderCode');

    const formattedItems = items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const multiplier = Number(item.multiplier) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const itemSubtotal = Number((qty * unitPrice).toFixed(2));
      const taxRate = Number(item.taxRate) || 0;
      const itemTax = Number((itemSubtotal * (taxRate / 100)).toFixed(2));

      return {
        ...item,
        purchaseRequestItemId: item.purchaseRequestItemId,
        stockItemId: item.stockItemId || null,
        isNewItem: Boolean(item.isNewItem || !item.stockItemId),
        quantity: qty,
        totalQuantity: Number((qty * multiplier).toFixed(4)),
        unitPrice,
        subtotal: itemSubtotal,
        taxAmount: itemTax,
        totalPrice: Number((itemSubtotal + itemTax).toFixed(2)),
        receivedQuantity: 0,
        receivedTotalQuantity: 0,
        remainingQuantity: qty,
        remainingTotalQuantity: Number((qty * multiplier).toFixed(4)),
        fulfillmentStatus: 'unfulfilled'
      };
    });

    const calculatedSubtotal =
      subtotal || formattedItems.reduce((acc, i) => acc + i.subtotal, 0);
    const calculatedTax =
      taxAmount || formattedItems.reduce((acc, i) => acc + i.taxAmount, 0);
    const calculatedTotal =
      totalAmount || calculatedSubtotal + calculatedTax + deliveryCost - discount;

    const po = new PurchaseOrder({
      purchaseOrderCode,
      purchaseRequestId,
      comparisonId: comparisonId || null,
      supplierId,
      warehouseId,
      orderDate: new Date(),
      expectedDeliveryDate,
      items: formattedItems,
      subtotal: calculatedSubtotal,
      taxAmount: calculatedTax,
      deliveryCost,
      discount,
      totalAmount: calculatedTotal,
      paymentTerms,
      status: 'approved',
      approvalStatus: 'approved',
      approvedBy: req.user._id,
      approvedAt: new Date(),
      createdBy: req.user._id,
      notes
    });

    await po.save();

    if (purchaseRequestId) {
      await PurchaseRequest.findByIdAndUpdate(purchaseRequestId, {
        procurementStatus: 'po_created'
      });
    }

    // Universal Evidence Table Integration (Signed PO, Contract)
    if (attachments.length > 0 || req.files?.length > 0) {
      const filesToAttach = req.files?.length > 0 ? req.files : attachments;
      await attachFilesToEvidence({
        entityType: 'PurchaseOrder',
        entityId: po._id,
        files: filesToAttach,
        user: req.user,
        title: `PO ${po.purchaseOrderCode} Official Contract / Signed Order`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Purchase order created and issued to vendor successfully',
      data: po
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. Purchaser Auctions & Bidding
// ==========================================

export const getPurchaserAuctions = async (req, res) => {
  try {
    const auctions = await PurchaserAuction.find()
      .populate('purchaseRequestId', 'requestCode purpose')
      .populate('invitedSuppliers', 'name code')
      .populate('bids.supplierId', 'name code')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: auctions.length, data: auctions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPurchaserAuction = async (req, res) => {
  try {
    const auctionCode = await generateCode('AUC', PurchaserAuction, 'auctionCode');
    const auction = new PurchaserAuction({
      ...req.body,
      auctionCode,
      createdBy: req.user._id,
      status: 'open'
    });
    await auction.save();
    res.status(201).json({ success: true, data: auction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const submitBid = async (req, res) => {
  try {
    const auction = await PurchaserAuction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    auction.bids.push(req.body);
    await auction.save();

    res.status(201).json({ success: true, message: 'Supplier bid recorded', data: auction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
