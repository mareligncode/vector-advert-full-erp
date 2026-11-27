import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';
import * as crmController from '../controllers/crmController.js';
import {
  validateLeadInput,
  validateClientInput,
  validateFollowUpInput,
  validateSiteSurveyScheduleInput,
  validateSiteSurveyCompletionInput
} from '../middleware/crmValidationMiddleware.js';

// ==========================================
// 1. Leads Router
// ==========================================
export const leadRoutes = express.Router();

leadRoutes
  .route('/')
  .get(protect, crmController.getLeads)
  .post(
    protect,
    authorizeRoles(
      ROLES.SUPER_ADMIN,
      ROLES.CEO,
      ROLES.COO,
      ROLES.CAO,
      ROLES.FRONTDESK,
      ROLES.MANAGER,
      ROLES.DEPARTMENT_HEAD,
      ROLES.EMPLOYEE
    ),
    validateLeadInput,
    crmController.createLead
  );

leadRoutes
  .route('/:id')
  .get(protect, crmController.getLeadById)
  .put(protect, crmController.updateLead)
  .delete(
    protect,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.CEO, ROLES.COO, ROLES.MANAGER),
    crmController.deleteLead
  );

leadRoutes.post(
  '/:id/convert',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.COO,
    ROLES.MANAGER,
    ROLES.FRONTDESK,
    ROLES.EMPLOYEE
  ),
  crmController.convertLeadToClient
);

// ==========================================
// 2. Clients Router
// ==========================================
export const clientRoutes = express.Router();

clientRoutes
  .route('/')
  .get(protect, crmController.getClients)
  .post(
    protect,
    authorizeRoles(
      ROLES.SUPER_ADMIN,
      ROLES.CEO,
      ROLES.COO,
      ROLES.CAO,
      ROLES.FINANCE,
      ROLES.FRONTDESK,
      ROLES.MANAGER,
      ROLES.DEPARTMENT_HEAD,
      ROLES.EMPLOYEE
    ),
    validateClientInput,
    crmController.createClient
  );

clientRoutes
  .route('/:id')
  .get(protect, crmController.getClientById)
  .put(protect, crmController.updateClient);

clientRoutes.patch(
  '/:id/credit-terms',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.CEO, ROLES.COO, ROLES.FINANCE),
  crmController.updateClientCreditTerms
);

// ==========================================
// 3. Follow-Ups Router
// ==========================================
export const followUpRoutes = express.Router();

followUpRoutes
  .route('/')
  .get(protect, crmController.getFollowUps)
  .post(protect, validateFollowUpInput, crmController.recordFollowUp);

followUpRoutes.patch(
  '/:id/complete',
  protect,
  crmController.completeFollowUpTask
);

// ==========================================
// 4. Site Surveys Router
// ==========================================
export const siteSurveyRoutes = express.Router();

siteSurveyRoutes
  .route('/')
  .get(protect, crmController.getSiteSurveys)
  .post(protect, validateSiteSurveyScheduleInput, crmController.scheduleSiteSurvey);

siteSurveyRoutes.get('/:id', protect, crmController.getSiteSurveyById);

siteSurveyRoutes.put(
  '/:id/complete',
  protect,
  validateSiteSurveyCompletionInput,
  crmController.completeSiteSurvey
);

siteSurveyRoutes.patch(
  '/:id/approve',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.CEO, ROLES.COO, ROLES.DEPARTMENT_HEAD, ROLES.MANAGER),
  crmController.approveSiteSurvey
);

// ==========================================
// 5. Consolidated CRM Router (Namespace /api/crm)
// ==========================================
const crmRoutes = express.Router();
crmRoutes.use('/leads', leadRoutes);
crmRoutes.use('/clients', clientRoutes);
crmRoutes.use('/follow-ups', followUpRoutes);
crmRoutes.use('/site-surveys', siteSurveyRoutes);

export default crmRoutes;
