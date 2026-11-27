import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';
import * as postSalesController from '../controllers/postSalesController.js';
import {
  validateFeedbackRatings,
  verifyWarrantyJobExists
} from '../middleware/postSalesValidationMiddleware.js';

export const feedbackRouter = express.Router();
export const complaintRouter = express.Router();
export const warrantyRouter = express.Router();

// ==========================================
// Customer Feedback Routes (/api/customer-feedback)
// ==========================================

feedbackRouter.get(
  '/',
  protect,
  postSalesController.getCustomerFeedbacks
);

feedbackRouter.get(
  '/metrics',
  protect,
  postSalesController.getFeedbackMetricsHandler
);

feedbackRouter.post(
  '/',
  protect,
  validateFeedbackRatings,
  postSalesController.createCustomerFeedback
);

// ==========================================
// Customer Complaints Routes (/api/customer-complaints)
// ==========================================

complaintRouter.get(
  '/',
  protect,
  postSalesController.getCustomerComplaints
);

complaintRouter.get(
  '/:id',
  protect,
  postSalesController.getComplaintById
);

complaintRouter.post(
  '/',
  protect,
  postSalesController.createCustomerComplaint
);

complaintRouter.put(
  '/:id/investigation',
  protect,
  postSalesController.updateInvestigation
);

complaintRouter.post(
  '/:id/resolve',
  protect,
  postSalesController.resolveComplaintHandler
);

// ==========================================
// Warranty Claims Routes (/api/warranty-claims)
// ==========================================

warrantyRouter.get(
  '/',
  protect,
  postSalesController.getWarrantyClaims
);

warrantyRouter.get(
  '/:id',
  protect,
  postSalesController.getWarrantyClaimById
);

warrantyRouter.post(
  '/',
  protect,
  verifyWarrantyJobExists,
  postSalesController.submitWarrantyClaim
);

warrantyRouter.post(
  '/:id/fulfill',
  protect,
  postSalesController.fulfillWarrantyClaimHandler
);

export default feedbackRouter;
