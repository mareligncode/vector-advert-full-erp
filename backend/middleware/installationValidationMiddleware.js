import mongoose from 'mongoose';
import JobOrder from '../models/JobOrder.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Validates that the referenced JobOrder has undergone factory QC sign-off
 * before field delivery or site installation can be scheduled/dispatched.
 */
export async function verifyJobReadyForDelivery(req, res, next) {
  try {
    const jobOrderId = req.body.jobOrderId || req.params.jobOrderId;
    if (!jobOrderId || !isValidObjectId(jobOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid jobOrderId is required'
      });
    }

    const jobOrder = await JobOrder.findById(jobOrderId);
    if (!jobOrder) {
      return res.status(404).json({
        success: false,
        message: 'JobOrder not found'
      });
    }

    const qcPassed = jobOrder.workstationRouting?.electricalAndQC?.status === 'passed';
    const isReadyStatus = ['ready_for_dispatch', 'out_for_delivery_or_installation'].includes(jobOrder.status);

    if (!qcPassed && !isReadyStatus) {
      return res.status(422).json({
        success: false,
        message: `Cannot dispatch installation: Signage has not passed mandatory electrical & QC burn-in clearance. Current QC status: ${jobOrder.workstationRouting?.electricalAndQC?.status || 'pending'}`
      });
    }

    req.jobOrder = jobOrder;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validates client digital sign-off and representative credentials for handover.
 */
export function validateHandoverSignOff(req, res, next) {
  const { clientRepresentativeName, clientRepresentativePhone, clientDigitalSignatureUrl } = req.body;
  const errors = [];

  if (!clientRepresentativeName || typeof clientRepresentativeName !== 'string' || !clientRepresentativeName.trim()) {
    errors.push('clientRepresentativeName is required');
  }

  if (!clientRepresentativePhone || typeof clientRepresentativePhone !== 'string' || !clientRepresentativePhone.trim()) {
    errors.push('clientRepresentativePhone is required');
  }

  if (!clientDigitalSignatureUrl || typeof clientDigitalSignatureUrl !== 'string' || !clientDigitalSignatureUrl.trim()) {
    errors.push('clientDigitalSignatureUrl is required for legal acceptance and warranty activation');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for handover certificate',
      errors
    });
  }

  next();
}
