import * as productionService from '../services/productionService.js';

// ==========================================
// 1. Job Order Controllers (Traveler)
// ==========================================

export async function releaseJobOrderHandler(req, res, next) {
  try {
    const clientOrderId = req.params.clientOrderId || req.body.clientOrderId;
    const result = await productionService.releaseJobOrder(clientOrderId, req.user, req.body);

    res.status(201).json({
      success: true,
      message: 'Manufacturing traveler (JobOrder) successfully released to shop floor',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getJobOrders(req, res, next) {
  try {
    const result = await productionService.getJobOrders(req.query, req.query);
    res.status(200).json({
      success: true,
      message: 'Job orders retrieved successfully',
      data: result.jobOrders,
      meta: {
        total: result.total,
        page: result.page,
        pages: result.pages
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getJobOrderById(req, res, next) {
  try {
    const result = await productionService.getJobOrderById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Job order retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function updateJobOrderStatus(req, res, next) {
  try {
    const jobOrder = await productionService.updateJobOrderStatus(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Job order status updated successfully',
      data: jobOrder
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 2. Production Machine Controllers
// ==========================================

export async function createProductionMachine(req, res, next) {
  try {
    const machine = await productionService.registerProductionMachine(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Production machine asset registered successfully',
      data: machine
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductionMachines(req, res, next) {
  try {
    const result = await productionService.getProductionMachines(req.query, req.query);
    res.status(200).json({
      success: true,
      message: 'Production machines retrieved successfully',
      data: result.machines,
      meta: {
        total: result.total,
        page: result.page,
        pages: result.pages
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductionMachineById(req, res, next) {
  try {
    const machine = await productionService.getProductionMachineById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Production machine retrieved successfully',
      data: machine
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMachineStatus(req, res, next) {
  try {
    const machine = await productionService.updateMachineStatus(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Production machine operational status updated successfully',
      data: machine
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 3. Production Request Controllers
// ==========================================

export async function createProductionRequestHandler(req, res, next) {
  try {
    const jobOrderId = req.body.jobOrderId || req.params.jobOrderId;
    const request = await productionService.createProductionRequest(jobOrderId, req.body, req.user);

    res.status(201).json({
      success: true,
      message: 'Shop-floor ProductionRequest traveler created successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductionRequests(req, res, next) {
  try {
    const result = await productionService.getProductionRequests(req.query, req.query);
    res.status(200).json({
      success: true,
      message: 'Production requests retrieved successfully',
      data: result.productionRequests,
      meta: {
        total: result.total,
        page: result.page,
        pages: result.pages
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductionRequestById(req, res, next) {
  try {
    const request = await productionService.getProductionRequestById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Production request retrieved successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMachiningExecution(req, res, next) {
  try {
    const request = await productionService.recordMachineExecution(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Machining execution progress and run hours updated successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFinishingTask(req, res, next) {
  try {
    const taskNumber = req.params.taskNumber;
    const request = await productionService.updateFinishingTaskStatus(
      req.params.id,
      taskNumber,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Finishing task progress updated successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
}

export async function submitQcClearance(req, res, next) {
  try {
    const result = await productionService.submitQualityControlClearance(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Quality control burn-in and insulation clearance approved',
      data: result
    });
  } catch (error) {
    next(error);
  }
}
