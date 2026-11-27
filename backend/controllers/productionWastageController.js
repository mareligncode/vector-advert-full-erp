import * as materialsCostService from '../services/materialsCostService.js';

// ==========================================
// 1. Workshop Requisitions (StaffRequest)
// ==========================================

export async function createWorkshopRequisitionHandler(req, res, next) {
  try {
    const result = await materialsCostService.createWorkshopRequisition(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Workshop material requisition created and linked to JobOrder',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 2. Staff Returns & Cost Crediting
// ==========================================

export async function createStaffReturnHandler(req, res, next) {
  try {
    const result = await materialsCostService.processStaffReturn(req.body, req.user);
    res.status(201).json({
      success: true,
      message: `Staff return accepted into store; ${result.totalCreditETB} ETB credited back to JobOrder material cost`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 3. Production Scrap & Wastage
// ==========================================

export async function createProductionWastageHandler(req, res, next) {
  try {
    const result = await materialsCostService.recordProductionWastage(req.body, req.user);
    res.status(201).json({
      success: true,
      message: `Production scrap incident recorded (${result.productionWastage.wastageCode})${result.supplementalRequest ? '; Supplemental replenishment requisition auto-drafted' : ''}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductionWastage(req, res, next) {
  try {
    const result = await materialsCostService.getProductionWastage(req.query, req.query);
    res.status(200).json({
      success: true,
      message: 'Production wastage records retrieved successfully',
      data: result.wastages,
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

export async function getWastageById(req, res, next) {
  try {
    const wastage = await materialsCostService.getWastageById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Production wastage detail retrieved successfully',
      data: wastage
    });
  } catch (error) {
    next(error);
  }
}

export async function approveWastageWriteOff(req, res, next) {
  try {
    const wastage = await materialsCostService.verifyProductionWastage(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      message: 'Production wastage financial write-off approved by Finance',
      data: wastage
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 4. Closed-Loop Cost Analysis
// ==========================================

export async function getJobOrderCostAnalysisHandler(req, res, next) {
  try {
    const analysis = await materialsCostService.getJobOrderCostAnalysis(req.params.id);
    res.status(200).json({
      success: true,
      message: 'JobOrder closed-loop material cost and gross margin analysis generated',
      data: analysis
    });
  } catch (error) {
    next(error);
  }
}
