import mongoose from 'mongoose';

import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import FollowUp from '../models/FollowUp.js';
import SiteSurvey from '../models/SiteSurvey.js';
import SiteInstallation from '../models/SiteInstallation.js';
import ClientOrder from '../models/ClientOrder.js';
import DesignTask from '../models/DesignTask.js';
import DesignProof from '../models/DesignProof.js';
import JobOrder from '../models/JobOrder.js';
import ProductionMachine from '../models/ProductionMachine.js';
import ProductionRequest from '../models/ProductionRequest.js';
import ProductionWastage from '../models/ProductionWastage.js';
import Invoice from '../models/Invoice.js';
import PaymentCollection from '../models/PaymentCollection.js';
import CustomerCreditLedger from '../models/CustomerCreditLedger.js';
import MachineMaintenanceSchedule from '../models/MachineMaintenanceSchedule.js';
import MachineMaintenanceLog from '../models/MachineMaintenanceLog.js';
import MachineRepairOrder from '../models/MachineRepairOrder.js';
import CustomerFeedback from '../models/CustomerFeedback.js';
import CustomerComplaint from '../models/CustomerComplaint.js';
import WarrantyClaim from '../models/WarrantyClaim.js';
import StaffRequest from '../models/StaffRequest.js';
import StaffReturn from '../models/StaffReturn.js';

const models = {
  Lead,
  Client,
  FollowUp,
  SiteSurvey,
  SiteInstallation,
  ClientOrder,
  DesignTask,
  DesignProof,
  JobOrder,
  ProductionMachine,
  ProductionRequest,
  ProductionWastage,
  Invoice,
  PaymentCollection,
  CustomerCreditLedger,
  MachineMaintenanceSchedule,
  MachineMaintenanceLog,
  MachineRepairOrder,
  CustomerFeedback,
  CustomerComplaint,
  WarrantyClaim,
  StaffRequest,
  StaffReturn
};

const oid = () => new mongoose.Types.ObjectId();

async function runTests() {
  console.log('Verifying all 23 operations and inventory models...');

  for (const [name, Model] of Object.entries(models)) {
    if (!Model || typeof Model.modelName !== 'string') {
      throw new Error(`Model ${name} failed to register with Mongoose`);
    }
  }

  // 1. Lead
  const lead = new Lead({
    leadNumber: 'LEAD-2026-0001',
    name: 'Awash Bank Signage Lead',
    pointOfContact: {
      name: 'Abebe Bikila'
    },
    phone: {
      primary: '+251911223344'
    },
    source: 'walk_in',
    status: 'new',
    createdBy: oid()
  });
  await lead.validate();

  // 2. Client
  const client = new Client({
    clientCode: 'CL-2026-0001',
    displayName: 'Awash Bank',
    legalName: 'Awash Bank SC',
    clientType: 'corporate',
    industry: 'banking_finance',
    primaryPhone: '+251911556677',
    address: {
      subcity: 'Bole',
      landmark: 'Next to Awash Towers'
    },
    contactPersons: [
      {
        fullName: 'Kebede Tadesse',
        phone: '+251911556677'
      }
    ],
    creditTerms: {
      allowCredit: true,
      creditLimit: 500000,
      creditPeriodDays: 30
    },
    createdBy: oid()
  });
  await client.validate();

  // 3. FollowUp
  const followUp = new FollowUp({
    followUpCode: 'FOL-2026-0001',
    targetEntity: {
      entityType: 'Lead',
      entityId: lead._id
    },
    interaction: {
      channel: 'phone_call',
      conductedBy: oid(),
      summary: 'Initial phone consultation with client'
    },
    createdBy: oid()
  });
  await followUp.validate();

  // 4. SiteSurvey
  const survey = new SiteSurvey({
    surveyCode: 'SRV-2026-0001',
    targetEntity: {
      entityType: 'Client',
      entityId: client._id
    },
    surveyTitle: 'Awash Bank Headquarters Facade Inspection',
    assignedSurveyor: oid(),
    scheduledDate: new Date(),
    siteAddress: {
      subcity: 'Bole',
      gpsCoordinates: {
        latitude: 9.0123,
        longitude: 38.7654
      }
    },
    siteContactPerson: {
      phone: '+251911556677'
    },
    measurements: {
      facadeWidthMeters: 10,
      facadeHeightMeters: 3,
      installationHeightFromGround: 4
    },
    wallSurfaceType: 'reinforced_concrete',
    electricalInspection: {
      powerSourceDistanceMeters: 5
    },
    accessEquipmentRequired: 'scaffolding_tower',
    createdBy: oid()
  });
  await survey.validate();

  // 5. ClientOrder
  const order = new ClientOrder({
    orderNumber: 'ORD-2026-0001',
    clientId: client._id,
    projectTitle: 'Main Branch 3D Illuminated Facade',
    orderType: '3d_channel_letters_acrylic',
    estimatedCompletionDate: new Date(Date.now() + 14 * 86400000),
    requestedItems: [
      {
        itemCode: 'ITEM-01',
        productCategory: '3d_channel_letters_acrylic',
        itemTitle: 'Awash Bank 3D Channel Letters',
        dimensions: { widthCm: 400, heightCm: 80, depthReturnCm: 10, totalAreaSqM: 3.2 },
        quantity: 1,
        unitPrice: 120000,
        totalPrice: 120000
      }
    ],
    commercial: {
      subtotal: 120000,
      vatAmount: 18000,
      grandTotal: 138000,
      advanceDepositAmountRequired: 69000
    },
    salesAccountManager: oid(),
    createdBy: oid()
  });
  await order.validate();

  // 6. DesignTask
  const designTask = new DesignTask({
    taskCode: 'DSN-2026-0001',
    orderId: order._id,
    clientId: client._id,
    assignedDesigner: oid(),
    briefTitle: '3D Vector Logo for Awash Bank',
    targetCompletionDate: new Date(Date.now() + 3 * 86400000)
  });
  await designTask.validate();

  // 7. DesignProof
  const designProof = new DesignProof({
    proofCode: 'PRF-2026-0001-V1',
    designTaskId: designTask._id,
    orderId: order._id,
    versionNumber: 1,
    presentationMedia: {
      daylightMockupImageUrl: '/uploads/proofs/daylight.png'
    },
    engineeringSpecs: {
      overallWidthCm: 400,
      overallHeightCm: 80
    },
    createdBy: oid()
  });
  await designProof.validate();

  // 8. JobOrder
  const jobOrder = new JobOrder({
    jobOrderNumber: 'JOB-2026-0001',
    orderId: order._id,
    clientId: client._id,
    approvedDesignProofId: designProof._id,
    projectTitle: 'Main Branch 3D Illuminated Facade',
    scheduledStartDate: new Date(),
    targetCompletionDate: new Date(Date.now() + 10 * 86400000),
    fulfillment: {
      deliveryMethod: 'on_site_installation'
    },
    warranty: {
      warrantyCode: 'WRN-2026-0001',
      status: 'active_under_warranty'
    },
    workshopSupervisor: oid(),
    authorizedBy: oid()
  });
  await jobOrder.validate();

  // 9. SiteInstallation
  const installation = new SiteInstallation({
    installationCode: 'INS-2026-0001',
    jobOrderId: jobOrder._id,
    jobOrderNumber: jobOrder.jobOrderNumber,
    clientId: client._id,
    logistics: {
      assignedDriver: oid()
    },
    destination: {
      address: 'Bole Road, Addis Ababa'
    },
    leadTechnician: oid(),
    completedBy: oid()
  });
  await installation.validate();

  // 10. ProductionMachine
  const machine = new ProductionMachine({
    machineCode: 'MCH-CNC-01',
    machineName: 'Omni 1325 Heavy-Duty CNC Router',
    machineType: 'cnc_router_heavy',
    bedDimensions: {
      bedWidthCm: 130,
      bedLengthCm: 250
    }
  });
  await machine.validate();

  // 11. ProductionRequest
  const prodReq = new ProductionRequest({
    productionRequestCode: 'PRQ-2026-0001',
    jobOrderId: jobOrder._id,
    jobOrderNumber: jobOrder.jobOrderNumber,
    clientOrderId: order._id,
    designProofId: jobOrder.approvedDesignProofId,
    requestTitle: 'CNC Acrylic Face & Backer Routing',
    submittedDimensions: {
      finishedDimensions: {
        widthCm: 400,
        heightCm: 80,
        depthReturnCm: 10,
        totalFabricatedAreaSqM: 3.2
      },
      quantityUnits: 1
    },
    submittedMaterials: [
      {
        materialCategory: 'substrate_sheet',
        materialName: 'Cast Acrylic 3mm Opal White',
        quantitySubmitted: 2,
        unitOfMeasure: 'sheet'
      }
    ],
    machineSelection: {
      machineId: machine._id,
      machineType: 'cnc_router_heavy',
      assignedOperator: oid(),
      toolpathCutFileUrl: '/uploads/cut-files/awash-face.dxf'
    },
    workshopSupervisor: oid(),
    submittedBy: oid(),
    scheduledTargetDate: new Date(Date.now() + 3 * 86400000)
  });
  await prodReq.validate();

  // 12. ProductionWastage
  const wastage = new ProductionWastage({
    wastageCode: 'PST-2026-0001',
    jobOrderId: jobOrder._id,
    jobOrderNumber: jobOrder.jobOrderNumber,
    productionRequestId: prodReq._id,
    reportedBy: oid(),
    workshopSupervisor: oid(),
    manufacturingStage: 'cnc_router_cutting',
    scrapCategory: 'machine_malfunction_ruin',
    incidentSummary: 'CNC bit snapped during PVC routing',
    items: [
      {
        stockItemId: oid(),
        itemName: '10mm PVC Foam Board',
        quantityScrapped: 1,
        unit: 'sheet',
        unitCostETB: 3200,
        totalScrapCostETB: 3200
      }
    ],
    totalWastageCostETB: 3200,
    rootCauseDescription: 'Spindle feed rate exceeded recommended speed'
  });
  await wastage.validate();

  // 13. Invoice
  const invoice = new Invoice({
    invoiceNumber: 'PI-2026-0001',
    invoiceType: 'proforma',
    clientOrderId: order._id,
    clientId: client._id,
    buyerCredentials: {
      legalCompanyName: client.legalName
    },
    dueDate: new Date(Date.now() + 15 * 86400000),
    lineItems: [
      {
        description: 'Awash Bank 3D Channel Letters',
        quantity: 1,
        unitPrice: 120000,
        totalPrice: 120000
      }
    ],
    pricingBreakdown: {
      subtotal: 120000,
      taxableAmount: 120000,
      vatAmount: 18000,
      grossTotalAmount: 138000,
      advanceDepositAmountRequired: 69000
    },
    outstandingBalance: 138000,
    issuedBy: oid()
  });
  await invoice.validate();

  // 14. PaymentCollection
  const payment = new PaymentCollection({
    receiptVoucherNumber: 'CRV-2026-0001',
    invoiceId: invoice._id,
    clientOrderId: order._id,
    clientId: client._id,
    receiptType: 'advance_deposit_upfront',
    paymentMethod: 'bank_transfer_cbe',
    amountPaidETB: 69000,
    destinationBankAccount: 'CBE #1000123456789',
    triggersProductionClearance: true,
    collectedBy: oid(),
    verifiedByFinance: oid()
  });
  await payment.validate();

  // 15. CustomerCreditLedger
  const creditLedger = new CustomerCreditLedger({
    transactionCode: 'CCT-2026-0001',
    clientId: client._id,
    clientOrderId: order._id,
    invoiceId: invoice._id,
    transactionType: 'invoice_debit',
    amount: 138000,
    balanceBefore: 0,
    balanceAfter: 138000,
    recordedBy: oid()
  });
  await creditLedger.validate();

  // 16. MachineMaintenanceSchedule
  const schedule = new MachineMaintenanceSchedule({
    scheduleCode: 'MMS-CNC-DAILY',
    machineId: machine._id,
    machineType: 'cnc_router_heavy',
    frequency: 'daily_pre_shift',
    scheduleTitle: 'Daily CNC Pre-Shift Check'
  });
  await schedule.validate();

  // 17. MachineMaintenanceLog
  const maintLog = new MachineMaintenanceLog({
    logCode: 'MML-2026-0001',
    machineId: machine._id,
    scheduleId: schedule._id,
    frequency: 'daily_pre_shift',
    conductedBy: oid()
  });
  await maintLog.validate();

  // 18. MachineRepairOrder
  const repair = new MachineRepairOrder({
    repairOrderCode: 'MRO-2026-0001',
    machineId: machine._id,
    reportedBy: oid(),
    breakdownSymptoms: 'Spindle motor alarm E-04',
    leadTechnician: oid()
  });
  await repair.validate();

  // 19. CustomerFeedback
  const feedback = new CustomerFeedback({
    feedbackCode: 'FDB-2026-0001',
    clientId: client._id,
    jobOrderId: jobOrder._id,
    ratings: {
      overallSatisfactionScore: 5
    },
    clientRepresentativeName: 'Kebede Tadesse'
  });
  await feedback.validate();

  // 20. CustomerComplaint
  const complaint = new CustomerComplaint({
    complaintCode: 'CMP-2026-0001',
    clientId: client._id,
    jobOrderId: jobOrder._id,
    reportedByClientContact: {
      fullName: 'Kebede Tadesse',
      phone: '+251911556677'
    },
    category: 'illumination_failure',
    complaintSubject: 'Letter W flickering',
    detailedDescription: 'Top neon tube flickers after 7 PM',
    targetResolutionDate: new Date(Date.now() + 2 * 86400000)
  });
  await complaint.validate();

  // 21. WarrantyClaim
  const warrantyClaim = new WarrantyClaim({
    claimCode: 'CLM-2026-0001',
    jobOrderId: jobOrder._id,
    jobOrderNumber: jobOrder.jobOrderNumber,
    clientId: client._id,
    failedComponent: 'power_supply_transformer',
    defectDescription: 'Transformer output dropped to 0V',
    evaluatedBy: oid(),
    isCoveredUnderActiveWarranty: true,
    determination: 'approved_full_parts_and_labor'
  });
  await warrantyClaim.validate();

  // 22. StaffRequest
  const staffReq = new StaffRequest({
    requestCode: 'SR-2026-0001',
    requestType: 'workshop',
    jobOrderId: jobOrder._id,
    jobOrderNumber: jobOrder.jobOrderNumber,
    productionRequestId: prodReq._id,
    isSupplemental: true,
    requestedBy: oid(),
    departmentId: oid(),
    purpose: 'Supplemental PVC sheet for wastage replacement',
    items: [
      {
        stockItemId: oid(),
        requestedQuantity: 1
      }
    ]
  });
  await staffReq.validate();

  // 23. StaffReturn
  const staffRet = new StaffReturn({
    returnCode: 'RET-2026-0001',
    jobOrderId: jobOrder._id,
    jobOrderNumber: jobOrder.jobOrderNumber,
    productionRequestId: prodReq._id,
    sivId: oid(),
    staffRequestId: staffReq._id,
    returnedBy: oid(),
    receivedBy: oid(),
    warehouseId: oid(),
    items: [
      {
        stockItemId: oid(),
        sivItemId: oid(),
        returnedQuantity: 1
      }
    ]
  });
  await staffRet.validate();

  console.log('All 23 operations and inventory models validated successfully!');

  // Verify critical cross-model references and relationships
  const pathChecks = [
    { model: StaffRequest, path: 'jobOrderId', ref: 'JobOrder' },
    { model: StaffRequest, path: 'productionRequestId', ref: 'ProductionRequest' },
    { model: StaffRequest, path: 'isSupplemental' },
    { model: StaffReturn, path: 'jobOrderId', ref: 'JobOrder' },
    { model: StaffReturn, path: 'productionRequestId', ref: 'ProductionRequest' },
    { model: Invoice, path: 'invoiceType' },
    { model: Invoice, path: 'proformaReferenceCode' },
    { model: Invoice, path: 'jobOrderId', ref: 'JobOrder' },
    { model: PaymentCollection, path: 'invoiceId', ref: 'Invoice' },
    { model: PaymentCollection, path: 'triggersProductionClearance' },
    { model: CustomerCreditLedger, path: 'transactionCode' },
    { model: CustomerCreditLedger, path: 'agingBracket' },
    { model: ProductionRequest, path: 'submittedDimensions.finishedDimensions.widthCm' },
    { model: ProductionRequest, path: 'submittedMaterials.0.materialCategory' },
    { model: ProductionMachine, path: 'machineCode' },
    { model: ProductionWastage, path: 'jobOrderId', ref: 'JobOrder' },
    { model: ProductionWastage, path: 'productionRequestId', ref: 'ProductionRequest' },
    { model: MachineMaintenanceSchedule, path: 'frequency' },
    { model: MachineMaintenanceLog, path: 'environmentalParameters.ambientWorkshopTempCelsius' },
    { model: MachineRepairOrder, path: 'interruptedProduction.activeJobOrderId', ref: 'JobOrder' },
    { model: CustomerFeedback, path: 'ratings.overallSatisfactionScore' },
    { model: CustomerComplaint, path: 'targetResolutionDate' },
    { model: WarrantyClaim, path: 'jobOrderId', ref: 'JobOrder' }
  ];

  for (const check of pathChecks) {
    const schemaPath = check.model.schema.path(check.path);
    if (!schemaPath) {
      throw new Error(`Path check failed: ${check.model.modelName} missing path '${check.path}'`);
    }
    if (check.ref && schemaPath.options.ref !== check.ref) {
      throw new Error(
        `Path check failed: ${check.model.modelName}.${check.path} ref expected '${check.ref}', got '${schemaPath.options.ref}'`
      );
    }
    console.log(`✓ Path check passed: ${check.model.modelName}.${check.path}`);
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Model verification failed:', err);
    process.exit(1);
  });
