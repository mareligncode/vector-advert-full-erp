import mongoose from 'mongoose';
import {
  ADVERTISING_PRODUCT_CATEGORY_ENUM,
  JOB_PRIORITY_ENUM,
  REVISION_CATEGORY_ENUM,
  APPROVAL_METHOD_ENUM
} from '../constants/operationsEnums.js';
import DesignProof from '../models/DesignProof.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export function validateClientOrderInput(req, res, next) {
  const { clientId, projectTitle, orderType, estimatedCompletionDate, salesAccountManager, requestedItems, priority } = req.body;
  const errors = [];

  if (!clientId || !isValidObjectId(clientId)) {
    errors.push('Valid clientId is required');
  }

  if (!projectTitle || typeof projectTitle !== 'string' || !projectTitle.trim()) {
    errors.push('Project title is required');
  }

  if (!orderType || !ADVERTISING_PRODUCT_CATEGORY_ENUM.includes(orderType)) {
    errors.push(`Invalid orderType. Allowed: ${ADVERTISING_PRODUCT_CATEGORY_ENUM.join(', ')}`);
  }

  if (!estimatedCompletionDate || isNaN(new Date(estimatedCompletionDate).getTime())) {
    errors.push('Valid estimatedCompletionDate is required');
  }

  if (!salesAccountManager || !isValidObjectId(salesAccountManager)) {
    errors.push('Valid salesAccountManager employee ObjectId is required');
  }

  if (priority && !JOB_PRIORITY_ENUM.includes(priority)) {
    errors.push(`Invalid priority. Allowed: ${JOB_PRIORITY_ENUM.join(', ')}`);
  }

  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    errors.push('At least one requested item is required');
  } else {
    requestedItems.forEach((item, index) => {
      if (!item.itemTitle || typeof item.itemTitle !== 'string' || !item.itemTitle.trim()) {
        errors.push(`Item ${index + 1}: itemTitle is required`);
      }
      if (!item.productCategory || !ADVERTISING_PRODUCT_CATEGORY_ENUM.includes(item.productCategory)) {
        errors.push(`Item ${index + 1}: valid productCategory is required`);
      }
      if (item.quantity === undefined || Number(item.quantity) < 1) {
        errors.push(`Item ${index + 1}: quantity must be at least 1`);
      }
      if (!item.dimensions || typeof item.dimensions !== 'object') {
        errors.push(`Item ${index + 1}: dimensions object is required`);
      } else {
        if (!item.dimensions.widthCm || Number(item.dimensions.widthCm) <= 0) {
          errors.push(`Item ${index + 1}: dimensions.widthCm must be > 0`);
        }
        if (!item.dimensions.heightCm || Number(item.dimensions.heightCm) <= 0) {
          errors.push(`Item ${index + 1}: dimensions.heightCm must be > 0`);
        }
      }
      if (item.unitPrice === undefined || Number(item.unitPrice) < 0) {
        errors.push(`Item ${index + 1}: unitPrice must be >= 0`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

export function validateDesignTaskInput(req, res, next) {
  const { assignedDesigner, briefTitle } = req.body;
  const errors = [];

  if (!assignedDesigner || !isValidObjectId(assignedDesigner)) {
    errors.push('Valid assignedDesigner employee ObjectId is required');
  }

  if (!briefTitle || typeof briefTitle !== 'string' || !briefTitle.trim()) {
    errors.push('Brief title is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

export function validateDesignProofInput(req, res, next) {
  const { presentationMedia, engineeringSpecs } = req.body;
  const errors = [];

  if (!presentationMedia || !presentationMedia.daylightMockupImageUrl || !presentationMedia.daylightMockupImageUrl.trim()) {
    errors.push('presentationMedia.daylightMockupImageUrl is required');
  }

  if (!engineeringSpecs || typeof engineeringSpecs !== 'object') {
    errors.push('engineeringSpecs object is required');
  } else {
    if (!engineeringSpecs.overallWidthCm || Number(engineeringSpecs.overallWidthCm) <= 0) {
      errors.push('engineeringSpecs.overallWidthCm must be > 0');
    }
    if (!engineeringSpecs.overallHeightCm || Number(engineeringSpecs.overallHeightCm) <= 0) {
      errors.push('engineeringSpecs.overallHeightCm must be > 0');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

export async function verifyProofNotLocked(req, res, next) {
  try {
    const proof = await DesignProof.findById(req.params.id);
    if (!proof) {
      return res.status(404).json({ success: false, message: 'Design proof not found' });
    }

    if (proof.isLockedForProduction) {
      return res.status(400).json({
        success: false,
        message: 'Cannot review or modify a design proof that is already locked for production'
      });
    }

    req.proof = proof;
    next();
  } catch (error) {
    next(error);
  }
}
