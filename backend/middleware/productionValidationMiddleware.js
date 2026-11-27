import mongoose from 'mongoose';
import ClientOrder from '../models/ClientOrder.js';
import { MACHINE_TYPE_ENUM } from '../constants/operationsEnums.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Gatekeeper barrier to ensure shop-floor JobOrders are released ONLY when:
 * 1. An agreed design proof is locked for production, AND
 * 2. Financial clearance (advance deposit or approved credit) is cleared.
 */
export async function verifyProductionReleaseGate(req, res, next) {
  try {
    const clientOrderId = req.params.clientOrderId || req.body.clientOrderId || req.params.id;
    if (!clientOrderId || !isValidObjectId(clientOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid clientOrderId is required'
      });
    }

    const clientOrder = await ClientOrder.findById(clientOrderId);
    if (!clientOrder) {
      return res.status(404).json({
        success: false,
        message: 'Client order not found'
      });
    }

    const hasAgreedProof = Boolean(clientOrder.designTask?.agreedDesignProofId);
    const financialStatus = clientOrder.productionClearance?.financialClearanceStatus;
    const isFinancialCleared =
      clientOrder.productionClearance?.isProductionAuthorized === true ||
      ['cleared_for_production', 'corporate_credit_approved', 'advance_deposit_cleared', 'fully_prepaid'].includes(financialStatus);

    if (!hasAgreedProof || !isFinancialCleared) {
      return res.status(422).json({
        success: false,
        message: `Manufacturing release gate not satisfied: both design proof lock and financial clearance (advance deposit or credit approval) are strictly required. Current state - Design Proof: ${hasAgreedProof ? 'Locked' : 'Pending'}, Financial Clearance: ${financialStatus || 'Pending'}`
      });
    }

    req.clientOrder = clientOrder;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validates production machine asset enrollment payload.
 */
export function validateMachineInput(req, res, next) {
  const { machineName, machineType, bedDimensions } = req.body;
  const errors = [];

  if (!machineName || typeof machineName !== 'string' || !machineName.trim()) {
    errors.push('machineName is required');
  }

  if (!machineType || !MACHINE_TYPE_ENUM.includes(machineType)) {
    errors.push(`Invalid machineType. Allowed: ${MACHINE_TYPE_ENUM.join(', ')}`);
  }

  if (!bedDimensions || typeof bedDimensions !== 'object') {
    errors.push('bedDimensions object is required');
  } else {
    if (!bedDimensions.bedWidthCm || Number(bedDimensions.bedWidthCm) <= 0) {
      errors.push('bedDimensions.bedWidthCm must be > 0');
    }
    if (!bedDimensions.bedLengthCm || Number(bedDimensions.bedLengthCm) <= 0) {
      errors.push('bedDimensions.bedLengthCm must be > 0');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for production machine',
      errors
    });
  }

  next();
}

/**
 * Validates dimensions and sizing for ProductionRequest travelers.
 */
export function validateDimensionsAndSizing(req, res, next) {
  const { jobOrderId, submittedDimensions, machineSelection } = req.body;
  const errors = [];

  if (!jobOrderId || !isValidObjectId(jobOrderId)) {
    errors.push('Valid jobOrderId is required');
  }

  if (!machineSelection || !machineSelection.machineId || !isValidObjectId(machineSelection.machineId)) {
    errors.push('Valid machineSelection.machineId is required');
  }

  if (!machineSelection?.machineType || !MACHINE_TYPE_ENUM.includes(machineSelection.machineType)) {
    errors.push(`Invalid machineSelection.machineType. Allowed: ${MACHINE_TYPE_ENUM.join(', ')}`);
  }

  if (!machineSelection?.assignedOperator || !isValidObjectId(machineSelection.assignedOperator)) {
    errors.push('Valid machineSelection.assignedOperator is required');
  }

  if (submittedDimensions) {
    const finished = submittedDimensions.finishedDimensions;
    if (finished) {
      if (finished.widthCm !== undefined && Number(finished.widthCm) <= 0) {
        errors.push('finishedDimensions.widthCm must be > 0');
      }
      if (finished.heightCm !== undefined && Number(finished.heightCm) <= 0) {
        errors.push('finishedDimensions.heightCm must be > 0');
      }
    }
    if (submittedDimensions.quantityUnits !== undefined && Number(submittedDimensions.quantityUnits) < 1) {
      errors.push('submittedDimensions.quantityUnits must be at least 1');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for production request',
      errors
    });
  }

  next();
}
