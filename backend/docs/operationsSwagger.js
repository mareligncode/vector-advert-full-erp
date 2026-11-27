export const operationsTags = [
  { name: 'CRM & Pre-Sales', description: 'Inquiry capture, technical site surveys, follow-ups & client onboarding' },
  { name: 'Orders & Design Pre-Press', description: 'Commercial orders, 3D daylight/night mockups, client proof review & CAD/CAM locks' },
  { name: 'Billing, CRV & Credit Control', description: 'Proforma/tax invoices, advance payments, CRV receipts & credit aging ledgers' },
  { name: 'Production & Shop-Floor Execution', description: 'JobOrder travelers, CNC router dispatch, assembly routing & 4-hour burn-in QC' },
  { name: 'Materials Flow & Wastage Tracking', description: 'Workshop store requisitions, material returns, scrap categorization & gross profit margins' },
  { name: 'Logistics & Field Installation', description: 'Heavy freight vehicle dispatch, site arrival checklists, illumination testing & handover' },
  { name: 'Machinery Maintenance & Repairs', description: 'Pre-shift inspection warmup interlocks, breakdown tickets, spare parts & calibration return-to-service' },
  { name: 'Post-Sales Care & Warranty', description: 'NPS/CSAT surveys, detractor escalations, CAPA complaints & zero-cost warranty fulfillment' }
];

export const operationsPaths = {
  // CRM & Leads
  '/api/leads': {
    get: {
      tags: ['CRM & Pre-Sales'],
      summary: 'Query sales leads',
      responses: {
        200: { description: 'List of leads returned successfully' }
      }
    },
    post: {
      tags: ['CRM & Pre-Sales'],
      summary: 'Capture a new sales lead inquiry',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['clientName', 'primaryPhone'],
              properties: {
                clientName: { type: 'string', example: 'National Bank Ethiopia' },
                primaryPhone: { type: 'string', example: '+251911223344' },
                projectTitle: { type: 'string', example: 'Headquarters Facade Sign' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Lead created successfully' }
      }
    }
  },
  '/api/site-surveys': {
    get: {
      tags: ['CRM & Pre-Sales'],
      summary: 'Query technical site surveys',
      responses: { 200: { description: 'Surveys retrieved' } }
    },
    post: {
      tags: ['CRM & Pre-Sales'],
      summary: 'Schedule on-site technical feasibility survey',
      responses: { 201: { description: 'Survey scheduled' } }
    }
  },

  // Orders & Design
  '/api/client-orders': {
    get: {
      tags: ['Orders & Design Pre-Press'],
      summary: 'Query commercial client orders',
      responses: { 200: { description: 'Orders retrieved' } }
    },
    post: {
      tags: ['Orders & Design Pre-Press'],
      summary: 'Create commercial sales order with 15% VAT and deposit terms',
      responses: { 201: { description: 'Order created' } }
    }
  },
  '/api/design-proofs/{id}/lock-production': {
    patch: {
      tags: ['Orders & Design Pre-Press'],
      summary: 'Lock approved design proof for production cutting',
      responses: { 200: { description: 'Proof locked and job released' } }
    }
  },

  // Billing & Credit
  '/api/invoices': {
    get: {
      tags: ['Billing, CRV & Credit Control'],
      summary: 'Query proforma and tax invoices',
      responses: { 200: { description: 'Invoices list' } }
    },
    post: {
      tags: ['Billing, CRV & Credit Control'],
      summary: 'Generate proforma or tax invoice from commercial order',
      responses: { 201: { description: 'Invoice generated' } }
    }
  },
  '/api/payment-collections': {
    post: {
      tags: ['Billing, CRV & Credit Control'],
      summary: 'Record bank transfer / cash deposit and issue official CRV receipt',
      responses: { 201: { description: 'Payment recorded and financial clearance evaluated' } }
    }
  },

  // Production
  '/api/job-orders': {
    get: {
      tags: ['Production & Shop-Floor Execution'],
      summary: 'Query active job orders on shop-floor',
      responses: { 200: { description: 'Job orders list' } }
    },
    post: {
      tags: ['Production & Shop-Floor Execution'],
      summary: 'Release job order traveler to production',
      responses: { 201: { description: 'Job order traveler released' } }
    }
  },
  '/api/job-orders/{id}/burn-in-qc': {
    patch: {
      tags: ['Production & Shop-Floor Execution'],
      summary: 'Sign off 4-hour electrical burn-in and QC test',
      responses: { 200: { description: 'QC passed and ready for dispatch' } }
    }
  },

  // Materials & Scrap
  '/api/production-wastage': {
    get: {
      tags: ['Materials Flow & Wastage Tracking'],
      summary: 'Query production scrap records and root causes',
      responses: { 200: { description: 'Wastage logs' } }
    },
    post: {
      tags: ['Materials Flow & Wastage Tracking'],
      summary: 'Log manufacturing skeleton offcut or defect scrap',
      responses: { 201: { description: 'Scrap logged and cost calculated' } }
    }
  },

  // Logistics & Installation
  '/api/site-installations': {
    get: {
      tags: ['Logistics & Field Installation'],
      summary: 'Query scheduled and in-progress site installations',
      responses: { 200: { description: 'Installations list' } }
    },
    post: {
      tags: ['Logistics & Field Installation'],
      summary: 'Schedule site installation and cargo manifest',
      responses: { 201: { description: 'Installation scheduled' } }
    }
  },
  '/api/site-installations/{id}/handover': {
    post: {
      tags: ['Logistics & Field Installation'],
      summary: 'Submit client handover certificate and automatically trigger warranty activation',
      responses: { 200: { description: 'Handover signed and warranty active' } }
    }
  },

  // Machinery Maintenance
  '/api/machine-maintenance/logs': {
    post: {
      tags: ['Machinery Maintenance & Repairs'],
      summary: 'Submit operator pre-shift warmup log and sensor readings',
      responses: { 201: { description: 'Maintenance log recorded' } }
    }
  },
  '/api/machine-repairs': {
    post: {
      tags: ['Machinery Maintenance & Repairs'],
      summary: 'Report machine breakdown and trigger immediate machine lockout',
      responses: { 201: { description: 'Repair order created and machine set to breakdown' } }
    }
  },

  // Customer Care & Warranty
  '/api/customer-feedback': {
    post: {
      tags: ['Post-Sales Care & Warranty'],
      summary: 'Submit post-installation feedback and evaluate NPS',
      responses: { 201: { description: 'Feedback recorded (detractor will trigger escalation)' } }
    }
  },
  '/api/customer-feedback/metrics': {
    get: {
      tags: ['Post-Sales Care & Warranty'],
      summary: 'Aggregate CSAT, NPS, complaint and warranty metrics',
      responses: { 200: { description: 'Metrics summary' } }
    }
  },
  '/api/warranty-claims': {
    post: {
      tags: ['Post-Sales Care & Warranty'],
      summary: 'Submit warranty claim and evaluate active component coverage',
      responses: { 201: { description: 'Claim evaluated against JobOrder.warranty' } }
    }
  }
};

export default {
  operationsTags,
  operationsPaths
};
