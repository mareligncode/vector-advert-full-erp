import StaffRequest from '../models/StaffRequest.js';
import StaffReturn from '../models/StaffReturn.js';
import ProductionWastage from '../models/ProductionWastage.js';
import JobOrder from '../models/JobOrder.js';
import ClientOrder from '../models/ClientOrder.js';
import StockItem from '../models/StockItem.js';
import StockBalance from '../models/StockBalance.js';
import StockMovement from '../models/StockMovement.js';
import StoreIssueVoucher from '../models/StoreIssueVoucher.js';
import { generateCode, withTransaction } from '../utils/inventoryService.js';
import mongoose from 'mongoose';

// ==========================================
// 1. Workshop Requisitions (StaffRequest)
// ==========================================

export async function createWorkshopRequisition(requisitionData, user) {
  const jobOrder = await JobOrder.findById(requisitionData.jobOrderId);
  if (!jobOrder) {
    const error = new Error('Referenced JobOrder does not exist');
    error.statusCode = 404;
    throw error;
  }

  const requestCode = await generateCode('REQ', StaffRequest, 'requestCode');

  const formattedItems = (requisitionData.items || []).map((item) => {
    const requestedQty = Number(item.requestedQuantity) || 1;
    const multiplier = Number(item.multiplier) || 1;
    return {
      ...item,
      requestedQuantity: requestedQty,
      requestedTotalQuantity: requestedQty * multiplier,
      unit: item.unit || 'sheet',
      baseUnit: item.baseUnit || item.unit || 'sheet',
      multiplier,
      approvalStatus: 'approved',
      approvedQuantity: requestedQty,
      approvedTotalQuantity: requestedQty * multiplier
    };
  });

  const totalRequestedQuantity = formattedItems.reduce((acc, item) => acc + item.requestedQuantity, 0);

  const staffRequest = new StaffRequest({
    requestCode,
    requestType: 'workshop',
    jobOrderId: jobOrder._id,
    jobOrderNumber: jobOrder.jobOrderNumber,
    productionRequestId: requisitionData.productionRequestId || null,
    isSupplemental: Boolean(requisitionData.isSupplemental),
    requestedBy: user?._id || user,
    departmentId: requisitionData.departmentId || new mongoose.Types.ObjectId(),
    warehouseId: requisitionData.warehouseId,
    purpose: requisitionData.purpose || `Workshop materials for JobOrder ${jobOrder.jobOrderNumber}`,
    items: formattedItems,
    totalItems: formattedItems.length,
    totalRequestedQuantity,
    totalRequestedTotalQuantity: totalRequestedQuantity,
    totalApprovedQuantity: totalRequestedQuantity,
    totalApprovedTotalQuantity: totalRequestedQuantity,
    approvalStatus: 'approved',
    approvedBy: user?._id || user,
    approvedAt: new Date(),
    approvalComment: 'Direct workshop traveler material requisition authorized'
  });

  const savedRequest = await staffRequest.save();

  // Link to JobOrder
  jobOrder.materialRequisition.staffRequestId = savedRequest._id;
  jobOrder.materialRequisition.materialsAllocated = true;
  jobOrder.materialRequisition.allocatedAt = new Date();
  await jobOrder.save();

  return {
    staffRequest: savedRequest,
    jobOrder
  };
}

// ==========================================
// 2. Staff Return & Direct Cost Crediting
// ==========================================

export async function processStaffReturn(returnData, user) {
  return await withTransaction(async (session) => {
    const jobOrder = await JobOrder.findById(returnData.jobOrderId).session(session);
    if (!jobOrder) {
      const error = new Error('Referenced JobOrder does not exist');
      error.statusCode = 404;
      throw error;
    }

    const returnCode = await generateCode('RET', StaffReturn, 'returnCode');
    const staffReturnId = new mongoose.Types.ObjectId();
    let totalCreditETB = 0;

    const formattedItems = [];

    for (const item of returnData.items || []) {
      const acceptedQty = Number(item.acceptedQuantity || item.returnedQuantity) || 0;
      if (acceptedQty <= 0) continue;

      const multiplier = Number(item.multiplier) || 1;
      const acceptedTotal = acceptedQty * multiplier;

      const stockItem = await StockItem.findById(item.stockItemId).session(session);
      const unitCost = Number(item.unitCost) || Number(stockItem?.averageUnitCost) || 0;
      const itemCredit = acceptedQty * unitCost;
      totalCreditETB += itemCredit;

      // Update physical stock balance in warehouse
      const balanceQuery = {
        stockItemId: item.stockItemId,
        warehouseId: returnData.warehouseId
      };

      let stockBalance = await StockBalance.findOne(balanceQuery).session(session);
      if (stockBalance) {
        stockBalance.balanceQuantity += acceptedQty;
        stockBalance.balanceTotalQuantity += acceptedTotal;
        stockBalance.availableQuantity += acceptedQty;
        stockBalance.availableTotalQuantity += acceptedTotal;
        await stockBalance.save({ session });

        // Log StockMovement
        const movementCode = await generateCode('MOV', StockMovement, 'movementCode');
        const movement = new StockMovement({
          movementCode,
          stockItemId: item.stockItemId,
          warehouseId: returnData.warehouseId,
          movementType: 'staff_return',
          referenceType: 'StaffReturn',
          referenceId: staffReturnId,
          quantityIn: acceptedQty,
          totalQuantityIn: acceptedTotal,
          balanceQuantityAfter: stockBalance.balanceQuantity,
          balanceTotalQuantityAfter: stockBalance.balanceTotalQuantity,
          unit: item.unit || stockItem?.unit || 'sheet',
          baseUnit: item.baseUnit || stockItem?.baseUnit || 'sheet',
          unitCost,
          totalCost: itemCredit,
          performedBy: user?._id || user,
          movementDate: new Date(),
          notes: `Return from JobOrder ${jobOrder.jobOrderNumber}: ${item.reason || 'Unused material return'}`
        });
        await movement.save({ session });
      }

      formattedItems.push({
        stockItemId: item.stockItemId,
        sivItemId: item.sivItemId || new mongoose.Types.ObjectId(),
        returnedQuantity: acceptedQty,
        returnedTotalQuantity: acceptedTotal,
        acceptedQuantity: acceptedQty,
        acceptedTotalQuantity: acceptedTotal,
        rejectedQuantity: 0,
        rejectedTotalQuantity: 0,
        unit: item.unit || stockItem?.unit || 'sheet',
        baseUnit: item.baseUnit || stockItem?.baseUnit || 'sheet',
        multiplier,
        unitCost,
        totalCost: itemCredit,
        condition: item.condition || 'good',
        reason: item.reason || 'Unused surplus material returned from workshop',
        notes: item.notes || `Credited ${itemCredit} ETB back to ${jobOrder.jobOrderNumber}`
      });
    }

    // Direct Cost Crediting: Decrement actualMaterialCostETB on JobOrder
    jobOrder.materialRequisition.actualMaterialCostETB = Math.max(
      0,
      Number(((jobOrder.materialRequisition.actualMaterialCostETB || 0) - totalCreditETB).toFixed(2))
    );
    await jobOrder.save({ session });

    const totalQuantity = formattedItems.reduce((acc, i) => acc + i.acceptedQuantity, 0);

    const staffReturn = new StaffReturn({
      _id: staffReturnId,
      returnCode,
      jobOrderId: jobOrder._id,
      jobOrderNumber: jobOrder.jobOrderNumber,
      productionRequestId: returnData.productionRequestId || null,
      sivId: returnData.sivId || new mongoose.Types.ObjectId(),
      staffRequestId: returnData.staffRequestId || jobOrder.materialRequisition.staffRequestId || new mongoose.Types.ObjectId(),
      returnedBy: returnData.returnedBy || user?._id || user,
      receivedBy: user?._id || user,
      warehouseId: returnData.warehouseId,
      returnDate: returnData.returnDate || new Date(),
      items: formattedItems,
      totalQuantity,
      totalTotalQuantity: totalQuantity,
      status: 'accepted',
      notes: returnData.notes || `Returned from JobOrder ${jobOrder.jobOrderNumber}. Credited ${totalCreditETB} ETB.`
    });

    await staffReturn.save({ session });

    return {
      staffReturn,
      totalCreditETB,
      updatedJobOrder: jobOrder
    };
  });
}

// ==========================================
// 3. Production Scrap & Wastage Tracking
// ==========================================

export async function recordProductionWastage(wastageData, user) {
  const jobOrder = await JobOrder.findById(wastageData.jobOrderId);
  if (!jobOrder) {
    const error = new Error('Referenced JobOrder does not exist');
    error.statusCode = 404;
    throw error;
  }

  const wastageCode = await generateCode('PST', ProductionWastage, 'wastageCode');

  let totalWastageCostETB = 0;
  const processedItems = [];

  for (const item of wastageData.items || []) {
    const quantityScrapped = Number(item.quantityScrapped) || 1;
    let unitCostETB = Number(item.unitCostETB);

    if (isNaN(unitCostETB) || unitCostETB <= 0) {
      const stockItem = await StockItem.findById(item.stockItemId);
      unitCostETB = Number(stockItem?.averageUnitCost) || 0;
    }

    const totalScrapCostETB = Number((quantityScrapped * unitCostETB).toFixed(2));
    totalWastageCostETB += totalScrapCostETB;

    processedItems.push({
      ...item,
      quantityScrapped,
      unitCostETB,
      totalScrapCostETB,
      isReusableOffcut: Boolean(item.isReusableOffcut),
      salvageableDimensions: item.salvageableDimensions || { widthCm: 0, heightCm: 0 },
      offcutStorageLocation: item.offcutStorageLocation || 'Workshop Scrap Rack Bay-A'
    });
  }

  totalWastageCostETB = Number(totalWastageCostETB.toFixed(2));

  // If costAllocation is absorb_in_job_order_cost, adjust JobOrder actualMaterialCostETB
  const costAllocation = wastageData.costAllocation || 'absorb_in_job_order_cost';
  if (costAllocation === 'absorb_in_job_order_cost') {
    jobOrder.materialRequisition.actualMaterialCostETB = Number(
      ((jobOrder.materialRequisition.actualMaterialCostETB || 0) + totalWastageCostETB).toFixed(2)
    );
    await jobOrder.save();
  }

  let supplementalRequest = null;
  let replenishmentStatus = 'not_required';

  // Rule 2 Auto-Replenishment: Auto-draft supplemental StaffRequest if required
  if (wastageData.requiresMaterialReplenishment) {
    const suppCode = await generateCode('REQ', StaffRequest, 'requestCode');

    const suppItems = processedItems.map((pi) => ({
      stockItemId: pi.stockItemId,
      itemName: pi.itemName,
      requestedQuantity: pi.quantityScrapped,
      requestedTotalQuantity: pi.quantityScrapped,
      unit: pi.unit || 'sheet',
      baseUnit: pi.unit || 'sheet',
      multiplier: 1,
      purpose: `Replenishment for scrap incident ${wastageCode}`,
      approvalStatus: 'approved',
      approvedQuantity: pi.quantityScrapped,
      approvedTotalQuantity: pi.quantityScrapped
    }));

    supplementalRequest = new StaffRequest({
      requestCode: suppCode,
      requestType: 'workshop',
      jobOrderId: jobOrder._id,
      jobOrderNumber: jobOrder.jobOrderNumber,
      productionRequestId: wastageData.productionRequestId || null,
      isSupplemental: true,
      requestedBy: user?._id || user,
      departmentId: wastageData.departmentId || new mongoose.Types.ObjectId(),
      warehouseId: wastageData.warehouseId || jobOrder.materialRequisition?.warehouseId,
      purpose: `Auto-generated supplemental requisition for scrap incident ${wastageCode}`,
      items: suppItems,
      totalItems: suppItems.length,
      totalRequestedQuantity: suppItems.reduce((acc, it) => acc + it.requestedQuantity, 0),
      totalRequestedTotalQuantity: suppItems.reduce((acc, it) => acc + it.requestedQuantity, 0),
      totalApprovedQuantity: suppItems.reduce((acc, it) => acc + it.requestedQuantity, 0),
      totalApprovedTotalQuantity: suppItems.reduce((acc, it) => acc + it.requestedQuantity, 0),
      approvalStatus: 'approved',
      approvedBy: user?._id || user,
      approvedAt: new Date()
    });

    await supplementalRequest.save();
    replenishmentStatus = 'requisition_pending';
  }

  const productionWastage = new ProductionWastage({
    wastageCode,
    jobOrderId: jobOrder._id,
    jobOrderNumber: jobOrder.jobOrderNumber,
    productionRequestId: wastageData.productionRequestId || null,
    reportedBy: wastageData.reportedBy || user?.employeeId || user?._id,
    workshopSupervisor: wastageData.workshopSupervisor || jobOrder.workshopSupervisor,
    loggedAt: new Date(),
    manufacturingStage: wastageData.manufacturingStage,
    scrapCategory: wastageData.scrapCategory,
    incidentSummary: wastageData.incidentSummary,
    items: processedItems,
    totalWastageCostETB,
    rootCauseDescription: wastageData.rootCauseDescription,
    correctiveActionTaken: wastageData.correctiveActionTaken || '',
    costAllocation,
    requiresMaterialReplenishment: Boolean(wastageData.requiresMaterialReplenishment),
    replenishmentStaffRequestId: supplementalRequest ? supplementalRequest._id : null,
    replenishmentStatus,
    status: 'logged'
  });

  const savedWastage = await productionWastage.save();

  return {
    productionWastage: savedWastage,
    supplementalRequest,
    jobOrder
  };
}

export async function getProductionWastage(filters = {}, pagination = {}) {
  const query = {};

  if (filters.jobOrderId) query.jobOrderId = filters.jobOrderId;
  if (filters.productionRequestId) query.productionRequestId = filters.productionRequestId;
  if (filters.manufacturingStage) query.manufacturingStage = filters.manufacturingStage;
  if (filters.scrapCategory) query.scrapCategory = filters.scrapCategory;
  if (filters.status) query.status = filters.status;

  if (filters.search) {
    const term = filters.search.trim();
    query.$or = [
      { wastageCode: { $regex: term, $options: 'i' } },
      { jobOrderNumber: { $regex: term, $options: 'i' } },
      { incidentSummary: { $regex: term, $options: 'i' } }
    ];
  }

  const page = parseInt(pagination.page, 10) || 1;
  const limit = parseInt(pagination.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const sort = pagination.sort || { loggedAt: -1 };

  const [wastages, total] = await Promise.all([
    ProductionWastage.find(query)
      .populate('jobOrderId', 'jobOrderNumber projectTitle status priority')
      .populate('reportedBy', 'name firstName lastName primaryPhone')
      .populate('workshopSupervisor', 'name firstName lastName')
      .populate('items.stockItemId', 'name code unit')
      .populate('replenishmentStaffRequestId', 'requestCode approvalStatus issuedStatus')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    ProductionWastage.countDocuments(query)
  ]);

  return {
    wastages,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

export async function getWastageById(id) {
  const wastage = await ProductionWastage.findById(id)
    .populate('jobOrderId')
    .populate('productionRequestId')
    .populate('reportedBy')
    .populate('workshopSupervisor')
    .populate('items.stockItemId')
    .populate('replenishmentStaffRequestId')
    .populate('verifiedByFinance', 'name username role');

  if (!wastage) {
    const error = new Error('Production wastage record not found');
    error.statusCode = 404;
    throw error;
  }

  return wastage;
}

export async function verifyProductionWastage(id, verificationData = {}, user) {
  const wastage = await ProductionWastage.findById(id);
  if (!wastage) {
    const error = new Error('Production wastage record not found');
    error.statusCode = 404;
    throw error;
  }

  wastage.status = verificationData.status || 'financial_writeoff_approved';
  wastage.verifiedByFinance = user?._id || user;
  wastage.verifiedAt = new Date();

  return await wastage.save();
}

// ==========================================
// 4. Closed-Loop Job Order Cost & Margin Analysis
// ==========================================

export async function getJobOrderCostAnalysis(jobOrderId) {
  const jobOrder = await JobOrder.findById(jobOrderId)
    .populate('clientId', 'clientCode displayName legalName')
    .populate('orderId');

  if (!jobOrder) {
    const error = new Error('JobOrder not found');
    error.statusCode = 404;
    throw error;
  }

  const clientOrder = jobOrder.orderId;
  const revenueETB = clientOrder?.commercial?.grandTotal || 0;

  // Find all StaffRequests for this job
  const staffRequests = await StaffRequest.find({ jobOrderId: jobOrder._id });
  const staffRequestIds = staffRequests.map((r) => r._id);

  // Find all SIVs linked to these requests
  const sivs = await StoreIssueVoucher.find({
    staffRequestId: { $in: staffRequestIds }
  });

  let grossIssuedCostETB = 0;
  for (const siv of sivs) {
    for (const item of siv.items || []) {
      grossIssuedCostETB += Number(item.totalCost) || (item.issuedQuantity * (item.unitCost || 0));
    }
  }

  // If grossIssuedCostETB is 0 but JobOrder has recorded actualMaterialCostETB, use that as base
  if (grossIssuedCostETB === 0 && jobOrder.materialRequisition?.actualMaterialCostETB > 0) {
    grossIssuedCostETB = jobOrder.materialRequisition.actualMaterialCostETB;
  }

  // Find all StaffReturns for this job
  const staffReturns = await StaffReturn.find({ jobOrderId: jobOrder._id, status: 'accepted' });
  let totalReturnedCostCreditETB = 0;
  for (const ret of staffReturns) {
    for (const item of ret.items || []) {
      let uCost = Number(item.unitCost) || 0;
      if (uCost <= 0) {
        const stk = await StockItem.findById(item.stockItemId);
        uCost = Number(stk?.averageUnitCost) || 0;
      }
      totalReturnedCostCreditETB += (item.acceptedQuantity || 0) * uCost;
    }
  }

  // Find all ProductionWastages for this job
  const wastages = await ProductionWastage.find({ jobOrderId: jobOrder._id });
  const totalScrapCostETB = wastages.reduce((acc, w) => acc + (w.totalWastageCostETB || 0), 0);

  // Closed loop material balance formula:
  // Net Material Cost = Gross Issued - Returned Unused
  const netMaterialCostETB = Math.max(0, Number((grossIssuedCostETB - totalReturnedCostCreditETB).toFixed(2)));
  const grossProfitMarginETB = Number((revenueETB - netMaterialCostETB).toFixed(2));
  const grossProfitMarginPercentage = revenueETB > 0 ? Number(((grossProfitMarginETB / revenueETB) * 100).toFixed(2)) : 0;

  return {
    jobOrderNumber: jobOrder.jobOrderNumber,
    projectTitle: jobOrder.projectTitle,
    client: jobOrder.clientId,
    closedLoopMaterialsSummary: {
      grossIssuedCostETB,
      totalReturnedCostCreditETB,
      totalScrapCostETB,
      netMaterialCostETB
    },
    commercialProfitability: {
      contractRevenueETB: revenueETB,
      netMaterialCostETB,
      grossProfitMarginETB,
      grossProfitMarginPercentage
    },
    auditTrail: {
      storeIssueVouchersCount: sivs.length,
      staffReturnsCount: staffReturns.length,
      scrapIncidentsCount: wastages.length
    }
  };
}
