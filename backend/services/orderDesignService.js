import ClientOrder from '../models/ClientOrder.js';
import DesignTask from '../models/DesignTask.js';
import DesignProof from '../models/DesignProof.js';
import Client from '../models/Client.js';
import { generateCode, withTransaction } from '../utils/inventoryService.js';

// ==========================================
// 1. Client Order Services
// ==========================================

export async function createClientOrder(orderData, userId) {
  const client = await Client.findById(orderData.clientId);
  if (!client) {
    const error = new Error('Referenced Client does not exist');
    error.statusCode = 404;
    throw error;
  }

  const orderNumber = await generateCode('ORD', ClientOrder, 'orderNumber');

  // Compute / verify commercial mathematics
  const requestedItems = (orderData.requestedItems || []).map((item, index) => {
    const quantity = Number(item.quantity) || 1;
    const unitPrice = Number(item.unitPrice) || 0;
    const totalPrice = item.totalPrice !== undefined && !isNaN(Number(item.totalPrice)) ? Number(item.totalPrice) : quantity * unitPrice;
    const widthCm = Number(item.dimensions?.widthCm) || 0;
    const heightCm = Number(item.dimensions?.heightCm) || 0;
    const depthReturnCm = Number(item.dimensions?.depthReturnCm) || 0;
    const totalAreaSqM = Number(item.dimensions?.totalAreaSqM) || Math.round(((widthCm * heightCm * quantity) / 10000) * 100) / 100;

    return {
      ...item,
      itemCode: item.itemCode || `ITEM-${String(index + 1).padStart(2, '0')}`,
      quantity,
      unitPrice,
      totalPrice,
      dimensions: {
        widthCm,
        heightCm,
        depthReturnCm,
        totalAreaSqM
      }
    };
  });

  const subtotal = requestedItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const discountAmount = Number(orderData.commercial?.discountAmount) || 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const vatRatePercentage = orderData.commercial?.vatRatePercentage !== undefined ? Number(orderData.commercial.vatRatePercentage) : 15;
  const vatAmount = Math.round(taxableAmount * (vatRatePercentage / 100) * 100) / 100;
  const withholdingTaxApplicable = Boolean(orderData.commercial?.withholdingTaxApplicable);
  const withholdingTaxAmount = withholdingTaxApplicable ? Math.round(taxableAmount * 0.02 * 100) / 100 : 0;
  const grandTotal = Math.round((taxableAmount + vatAmount) * 100) / 100;
  const advanceDepositRequiredPercentage = orderData.commercial?.advanceDepositRequiredPercentage !== undefined ? Number(orderData.commercial.advanceDepositRequiredPercentage) : 50;
  const advanceDepositAmountRequired = Math.round(grandTotal * (advanceDepositRequiredPercentage / 100) * 100) / 100;

  const order = new ClientOrder({
    ...orderData,
    orderNumber,
    requestedItems,
    commercial: {
      ...orderData.commercial,
      subtotal,
      discountAmount,
      taxableAmount,
      vatRatePercentage,
      vatAmount,
      withholdingTaxApplicable,
      withholdingTaxAmount,
      grandTotal,
      advanceDepositRequiredPercentage,
      advanceDepositAmountRequired,
      advanceDepositAmountPaid: 0,
      currentOutstandingBalance: grandTotal
    },
    status: orderData.status || 'draft',
    createdBy: userId
  });

  return await order.save();
}

export async function getClientOrders(filters = {}, pagination = {}) {
  const {
    status,
    clientId,
    orderType,
    priority,
    salesAccountManager,
    search,
    isProductionAuthorized
  } = filters;

  const { page = 1, limit = 20, sort = { createdAt: -1 } } = pagination;
  const query = {};

  if (status) query.status = status;
  if (clientId) query.clientId = clientId;
  if (orderType) query.orderType = orderType;
  if (priority) query.priority = priority;
  if (salesAccountManager) query.salesAccountManager = salesAccountManager;
  if (typeof isProductionAuthorized === 'boolean') {
    query['productionClearance.isProductionAuthorized'] = isProductionAuthorized;
  }

  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { projectTitle: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    ClientOrder.find(query)
      .populate('clientId', 'clientCode displayName legalName primaryPhone creditTerms')
      .populate('salesAccountManager', 'firstName lastName email role employeeCode')
      .populate('designTask.designTaskId', 'taskCode status targetCompletionDate')
      .populate('designTask.assignedDesigner', 'firstName lastName email role employeeCode')
      .populate('designTask.agreedDesignProofId', 'proofCode versionNumber isLockedForProduction')
      .populate('spawnedJobOrderId', 'jobOrderNumber status scheduledStartDate targetCompletionDate')
      .populate('createdBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    ClientOrder.countDocuments(query)
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
}

export async function getClientOrderById(orderId) {
  const order = await ClientOrder.findById(orderId)
    .populate('clientId', 'clientCode displayName legalName primaryPhone address businessCompliance creditTerms')
    .populate('salesAccountManager', 'firstName lastName email role employeeCode department')
    .populate('designTask.designTaskId')
    .populate('designTask.assignedDesigner', 'firstName lastName email role employeeCode')
    .populate('designTask.agreedDesignProofId')
    .populate('siteSurveyId')
    .populate('sourceLeadId', 'leadNumber name source')
    .populate('spawnedJobOrderId', 'jobOrderNumber status priority scheduledStartDate targetCompletionDate')
    .populate('createdBy', 'name email role');

  if (!order) {
    const error = new Error('Client order not found');
    error.statusCode = 404;
    throw error;
  }

  return order;
}

export async function updateClientOrder(orderId, updateData, userId) {
  const order = await ClientOrder.findById(orderId);
  if (!order) {
    const error = new Error('Client order not found');
    error.statusCode = 404;
    throw error;
  }

  delete updateData.orderNumber;
  delete updateData.createdBy;
  delete updateData.spawnedJobOrderId;

  // If requested items or commercial terms are updated, recalculate
  if (updateData.requestedItems || updateData.commercial) {
    const items = updateData.requestedItems || order.requestedItems;
    const subtotal = items.reduce((acc, item) => {
      const q = Number(item.quantity) || 1;
      const p = Number(item.unitPrice) || 0;
      return acc + (Number(item.totalPrice) !== undefined ? Number(item.totalPrice) : q * p);
    }, 0);

    const comm = updateData.commercial || order.commercial;
    const discountAmount = Number(comm.discountAmount) || 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const vatRatePercentage = comm.vatRatePercentage !== undefined ? Number(comm.vatRatePercentage) : 15;
    const vatAmount = Math.round(taxableAmount * (vatRatePercentage / 100) * 100) / 100;
    const withholdingTaxApplicable = Boolean(comm.withholdingTaxApplicable);
    const withholdingTaxAmount = withholdingTaxApplicable ? Math.round(taxableAmount * 0.02 * 100) / 100 : 0;
    const grandTotal = Math.round((taxableAmount + vatAmount) * 100) / 100;
    const advanceDepositRequiredPercentage = comm.advanceDepositRequiredPercentage !== undefined ? Number(comm.advanceDepositRequiredPercentage) : 50;
    const advanceDepositAmountRequired = Math.round(grandTotal * (advanceDepositRequiredPercentage / 100) * 100) / 100;

    updateData.commercial = {
      ...order.commercial.toObject(),
      ...comm,
      subtotal,
      discountAmount,
      taxableAmount,
      vatRatePercentage,
      vatAmount,
      withholdingTaxApplicable,
      withholdingTaxAmount,
      grandTotal,
      advanceDepositRequiredPercentage,
      advanceDepositAmountRequired,
      currentOutstandingBalance: Math.max(0, grandTotal - (order.commercial.advanceDepositAmountPaid || 0))
    };
  }

  Object.assign(order, updateData);
  return await order.save();
}

export async function cancelClientOrder(orderId, cancellationReason, userId) {
  const order = await ClientOrder.findById(orderId);
  if (!order) {
    const error = new Error('Client order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.status === 'in_production' || order.spawnedJobOrderId) {
    const error = new Error('Cannot cancel an order that has already been dispatched to production');
    error.statusCode = 400;
    throw error;
  }

  order.status = 'cancelled';
  return await order.save();
}

// ==========================================
// 2. Design Task Services
// ==========================================

export async function assignDesignTask(orderId, taskData, userId) {
  return await withTransaction(async (session) => {
    const order = await ClientOrder.findById(orderId).session(session);
    if (!order) {
      const error = new Error('Client order not found');
      error.statusCode = 404;
      throw error;
    }

    const taskCode = await generateCode('DSN', DesignTask, 'taskCode');

    const taskDocs = await DesignTask.create(
      [
        {
          ...taskData,
          taskCode,
          orderId: order._id,
          clientId: order.clientId,
          assignedDesigner: taskData.assignedDesigner,
          briefTitle: taskData.briefTitle || `${order.projectTitle} - Design Task`,
          status: 'assigned',
          targetCompletionDate: taskData.targetCompletionDate || order.estimatedCompletionDate
        }
      ],
      { session }
    );

    const designTask = taskDocs[0];

    // Link design task back to ClientOrder
    order.designTask = {
      hasDesignTask: true,
      designTaskId: designTask._id,
      assignedDesigner: designTask.assignedDesigner,
      agreedDesignProofId: null
    };

    if (order.status === 'draft') {
      order.status = 'in_design';
    }

    await order.save({ session });
    return designTask;
  });
}

export async function getDesignTasks(filters = {}, pagination = {}) {
  const { orderId, clientId, assignedDesigner, artDirector, status } = filters;
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = pagination;
  const query = {};

  if (orderId) query.orderId = orderId;
  if (clientId) query.clientId = clientId;
  if (assignedDesigner) query.assignedDesigner = assignedDesigner;
  if (artDirector) query.artDirector = artDirector;
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    DesignTask.find(query)
      .populate('orderId', 'orderNumber projectTitle orderType priority')
      .populate('clientId', 'clientCode displayName legalName')
      .populate('assignedDesigner', 'firstName lastName email role employeeCode')
      .populate('artDirector', 'firstName lastName email role employeeCode')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    DesignTask.countDocuments(query)
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
}

export async function getDesignTaskById(taskId) {
  const task = await DesignTask.findById(taskId)
    .populate('orderId')
    .populate('clientId', 'clientCode displayName legalName primaryPhone')
    .populate('assignedDesigner', 'firstName lastName email role employeeCode department')
    .populate('artDirector', 'firstName lastName email role employeeCode');

  if (!task) {
    const error = new Error('Design task not found');
    error.statusCode = 404;
    throw error;
  }

  // Also query associated proof versions
  const proofs = await DesignProof.find({ designTaskId: taskId })
    .sort({ versionNumber: -1 })
    .lean();

  return {
    task,
    proofs
  };
}

export async function updateDesignTaskStatus(taskId, statusData, userId) {
  const task = await DesignTask.findById(taskId);
  if (!task) {
    const error = new Error('Design task not found');
    error.statusCode = 404;
    throw error;
  }

  if (statusData.status) task.status = statusData.status;
  if (statusData.startedAt) task.startedAt = statusData.startedAt;
  if (statusData.completedAt) task.completedAt = statusData.completedAt;
  if (statusData.totalDesignHours !== undefined) task.totalDesignHours = statusData.totalDesignHours;

  return await task.save();
}

// ==========================================
// 3. Design Proof Versioning & Review Services
// ==========================================

export async function submitDesignProofVersion(taskId, proofData, userId) {
  const task = await DesignTask.findById(taskId);
  if (!task) {
    const error = new Error('Design task not found');
    error.statusCode = 404;
    throw error;
  }

  // Determine next version number
  const latestProof = await DesignProof.findOne({ designTaskId: taskId })
    .sort({ versionNumber: -1 })
    .lean();

  const nextVersionNumber = (latestProof?.versionNumber || 0) + 1;
  const baseCode = await generateCode('PRF', DesignProof, 'proofCode');
  const proofCode = `${baseCode}-V${nextVersionNumber}`;

  // Mark all previous versions as not current
  await DesignProof.updateMany(
    { designTaskId: taskId },
    { $set: { isCurrentVersion: false } }
  );

  const newProof = new DesignProof({
    ...proofData,
    proofCode,
    designTaskId: task._id,
    orderId: task.orderId,
    versionNumber: nextVersionNumber,
    isCurrentVersion: true,
    status: proofData.status || 'submitted_to_client',
    submittedToClientDate: new Date(),
    isLockedForProduction: false,
    createdBy: userId
  });

  const savedProof = await newProof.save();

  // Update task revision count and order status
  task.revisionCount = (task.revisionCount || 0) + 1;
  task.status = 'proof_submitted';
  await task.save();

  await ClientOrder.findByIdAndUpdate(task.orderId, {
    $set: { status: 'proof_under_client_review' }
  });

  return savedProof;
}

export async function getDesignProofsByTask(taskId) {
  return await DesignProof.find({ designTaskId: taskId })
    .populate('createdBy', 'name email role')
    .sort({ versionNumber: -1 })
    .lean();
}

export async function getDesignProofById(proofId) {
  const proof = await DesignProof.findById(proofId)
    .populate('designTaskId')
    .populate('orderId', 'orderNumber projectTitle orderType')
    .populate('createdBy', 'name email role');

  if (!proof) {
    const error = new Error('Design proof not found');
    error.statusCode = 404;
    throw error;
  }

  return proof;
}

export async function processClientProofReview(proofId, reviewData, userId) {
  const proof = await DesignProof.findById(proofId);
  if (!proof) {
    const error = new Error('Design proof not found');
    error.statusCode = 404;
    throw error;
  }

  if (proof.isLockedForProduction) {
    const error = new Error('Cannot review or modify a proof that is already locked for production');
    error.statusCode = 400;
    throw error;
  }

  if (reviewData.isApproved) {
    proof.clientApproval = {
      isApproved: true,
      approvedAt: new Date(),
      approverFullName: reviewData.approverFullName,
      approverJobTitle: reviewData.approverJobTitle,
      approvalMethod: reviewData.approvalMethod || 'official_email_confirmation',
      signatureImageUrl: reviewData.signatureImageUrl,
      signedProofDocumentUrl: reviewData.signedProofDocumentUrl,
      witnessedByEmployeeId: reviewData.witnessedByEmployeeId
    };
    proof.status = 'approved_by_client';

    await DesignTask.findByIdAndUpdate(proof.designTaskId, {
      $set: { status: 'client_approved' }
    });

    await ClientOrder.findByIdAndUpdate(proof.orderId, {
      $set: {
        status: 'design_agreed',
        designAgreedDate: new Date()
      }
    });
  } else {
    proof.clientFeedback = {
      reviewedAt: new Date(),
      reviewedByClientContactName: reviewData.reviewedByClientContactName,
      revisionCategory: reviewData.revisionCategory || 'dimension_scaling',
      feedbackNotes: reviewData.feedbackNotes
    };
    proof.status = 'revision_requested';

    await DesignTask.findByIdAndUpdate(proof.designTaskId, {
      $set: { status: 'revision_requested' }
    });

    await ClientOrder.findByIdAndUpdate(proof.orderId, {
      $set: { status: 'design_revision_requested' }
    });
  }

  return await proof.save();
}

export async function lockProofForProduction(proofId, userId) {
  const proof = await DesignProof.findById(proofId);
  if (!proof) {
    const error = new Error('Design proof not found');
    error.statusCode = 404;
    throw error;
  }

  if (!proof.clientApproval?.isApproved) {
    const error = new Error('Only client-approved proofs can be locked for shop-floor production');
    error.statusCode = 400;
    throw error;
  }

  proof.isLockedForProduction = true;
  proof.lockedAt = new Date();
  proof.lockedBy = userId;
  await proof.save();

  // Update DesignTask and ClientOrder
  await DesignTask.findByIdAndUpdate(proof.designTaskId, {
    $set: { status: 'production_files_exported' }
  });

  const order = await ClientOrder.findById(proof.orderId);
  if (order) {
    order.designTask.agreedDesignProofId = proof._id;
    order.designAgreedDate = new Date();
    order.status = 'design_agreed';

    // Rule 1: Check if financial clearance is also satisfied
    const validClearances = ['cleared_for_production', 'corporate_credit_approved', 'advance_deposit_cleared', 'fully_prepaid'];
    if (validClearances.includes(order.productionClearance?.financialClearanceStatus)) {
      order.productionClearance.isProductionAuthorized = true;
      order.productionAuthorizedDate = new Date();
      order.status = 'production_authorized';
    }

    await order.save();
  }

  return proof;
}
