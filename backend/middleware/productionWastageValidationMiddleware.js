import mongoose from 'mongoose';
import {
  MANUFACTURING_STAGE_ENUM,
  PRODUCTION_SCRAP_CATEGORY_ENUM
} from '../constants/operationsEnums.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Validates production scrap and wastage reporting payload.
 */
export function validateWastageItems(req, res, next) {
  const { jobOrderId, manufacturingStage, scrapCategory, incidentSummary, rootCauseDescription, items } = req.body;
  const errors = [];

  if (!jobOrderId || !isValidObjectId(jobOrderId)) {
    errors.push('Valid jobOrderId is required');
  }

  if (!manufacturingStage || !MANUFACTURING_STAGE_ENUM.includes(manufacturingStage)) {
    errors.push(`Invalid manufacturingStage. Allowed: ${MANUFACTURING_STAGE_ENUM.join(', ')}`);
  }

  if (!scrapCategory || !PRODUCTION_SCRAP_CATEGORY_ENUM.includes(scrapCategory)) {
    errors.push(`Invalid scrapCategory. Allowed: ${PRODUCTION_SCRAP_CATEGORY_ENUM.join(', ')}`);
  }

  if (!incidentSummary || typeof incidentSummary !== 'string' || !incidentSummary.trim()) {
    errors.push('incidentSummary is required');
  }

  if (!rootCauseDescription || typeof rootCauseDescription !== 'string' || !rootCauseDescription.trim()) {
    errors.push('rootCauseDescription is required');
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('At least one scrapped item is required');
  } else {
    items.forEach((item, index) => {
      if (!item.stockItemId || !isValidObjectId(item.stockItemId)) {
        errors.push(`Item ${index + 1}: valid stockItemId is required`);
      }
      if (!item.itemName || !item.itemName.trim()) {
        errors.push(`Item ${index + 1}: itemName is required`);
      }
      if (item.quantityScrapped === undefined || Number(item.quantityScrapped) <= 0) {
        errors.push(`Item ${index + 1}: quantityScrapped must be > 0`);
      }
      if (item.unitCostETB !== undefined && Number(item.unitCostETB) < 0) {
        errors.push(`Item ${index + 1}: unitCostETB cannot be negative`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for production scrap report',
      errors
    });
  }

  next();
}

/**
 * Validates that materials returned to the store are properly linked to a JobOrder.
 */
export function validateStaffReturnJobLink(req, res, next) {
  const { jobOrderId, warehouseId, items } = req.body;
  const errors = [];

  if (!jobOrderId || !isValidObjectId(jobOrderId)) {
    errors.push('Valid jobOrderId is required');
  }

  if (!warehouseId || !isValidObjectId(warehouseId)) {
    errors.push('Valid warehouseId is required');
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('At least one returned item is required');
  } else {
    items.forEach((item, index) => {
      if (!item.stockItemId || !isValidObjectId(item.stockItemId)) {
        errors.push(`Item ${index + 1}: valid stockItemId is required`);
      }
      const qty = item.acceptedQuantity || item.returnedQuantity;
      if (qty === undefined || Number(qty) <= 0) {
        errors.push(`Item ${index + 1}: returned/accepted quantity must be > 0`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for staff return',
      errors
    });
  }

  next();
}
