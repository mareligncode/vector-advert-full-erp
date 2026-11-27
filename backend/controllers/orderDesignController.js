import * as orderDesignService from '../services/orderDesignService.js';

// ==========================================
// 1. Client Order Controllers
// ==========================================

export async function createClientOrder(req, res, next) {
  try {
    const order = await orderDesignService.createClientOrder(req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: order,
      message: `Client order ${order.orderNumber} configured successfully`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function getClientOrders(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      clientId: req.query.clientId,
      orderType: req.query.orderType,
      priority: req.query.priority,
      salesAccountManager: req.query.salesAccountManager,
      search: req.query.search,
      isProductionAuthorized:
        req.query.isProductionAuthorized !== undefined
          ? req.query.isProductionAuthorized === 'true'
          : undefined
    };

    const pagination = {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 }
    };

    const result = await orderDesignService.getClientOrders(filters, pagination);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
}

export async function getClientOrderById(req, res, next) {
  try {
    const order = await orderDesignService.getClientOrderById(req.params.id);
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function updateClientOrder(req, res, next) {
  try {
    const order = await orderDesignService.updateClientOrder(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      data: order,
      message: 'Client order updated successfully'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function cancelClientOrder(req, res, next) {
  try {
    const reason = req.body.reason || 'Cancelled by user';
    const order = await orderDesignService.cancelClientOrder(req.params.id, reason, req.user._id);
    res.status(200).json({
      success: true,
      data: order,
      message: `Client order ${order.orderNumber} cancelled`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

// ==========================================
// 2. Design Task Controllers
// ==========================================

export async function assignDesignTask(req, res, next) {
  try {
    const orderId = req.params.id || req.params.orderId || req.body.orderId;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const task = await orderDesignService.assignDesignTask(orderId, req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: task,
      message: `Design task ${task.taskCode} assigned successfully`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function getDesignTasks(req, res, next) {
  try {
    const filters = {
      orderId: req.query.orderId,
      clientId: req.query.clientId,
      assignedDesigner: req.query.assignedDesigner,
      artDirector: req.query.artDirector,
      status: req.query.status
    };

    const pagination = {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 }
    };

    const result = await orderDesignService.getDesignTasks(filters, pagination);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
}

export async function getDesignTaskById(req, res, next) {
  try {
    const result = await orderDesignService.getDesignTaskById(req.params.id);
    res.status(200).json({
      success: true,
      data: result.task,
      proofs: result.proofs
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function updateDesignTaskStatus(req, res, next) {
  try {
    const task = await orderDesignService.updateDesignTaskStatus(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      data: task,
      message: 'Design task status updated'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

// ==========================================
// 3. Design Proof Versioning & Review Controllers
// ==========================================

export async function submitDesignProofVersion(req, res, next) {
  try {
    const taskId = req.params.id || req.params.taskId || req.body.designTaskId;
    if (!taskId) {
      return res.status(400).json({ success: false, message: 'designTaskId is required' });
    }

    const proof = await orderDesignService.submitDesignProofVersion(taskId, req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: proof,
      message: `Design proof ${proof.proofCode} submitted for client review`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function getDesignProofsByTask(req, res, next) {
  try {
    const taskId = req.params.id || req.params.taskId || req.query.taskId;
    const proofs = await orderDesignService.getDesignProofsByTask(taskId);
    res.status(200).json({
      success: true,
      data: proofs
    });
  } catch (error) {
    next(error);
  }
}

export async function getDesignProofById(req, res, next) {
  try {
    const proof = await orderDesignService.getDesignProofById(req.params.id);
    res.status(200).json({
      success: true,
      data: proof
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function processClientProofReview(req, res, next) {
  try {
    const proof = await orderDesignService.processClientProofReview(req.params.id, req.body, req.user._id);
    const action = req.body.isApproved ? 'approved' : 'revision requested';
    res.status(200).json({
      success: true,
      data: proof,
      message: `Client review processed: ${action}`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function lockProofForProduction(req, res, next) {
  try {
    const proof = await orderDesignService.lockProofForProduction(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      data: proof,
      message: `Design proof ${proof.proofCode} locked for production cutting`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}
