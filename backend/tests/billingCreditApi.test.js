import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from '../routes/authRoutes.js';
import crmRoutes, { clientRoutes } from '../routes/crmRoutes.js';
import orderDesignRoutes, {
  clientOrderRoutes,
  designTaskRoutes,
  designProofRoutes
} from '../routes/orderDesignRoutes.js';
import billingCreditRoutes, {
  invoiceRoutes,
  paymentCollectionRoutes,
  customerCreditRoutes
} from '../routes/billingCreditRoutes.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import ClientOrder from '../models/ClientOrder.js';
import DesignTask from '../models/DesignTask.js';
import DesignProof from '../models/DesignProof.js';
import Invoice from '../models/Invoice.js';
import PaymentCollection from '../models/PaymentCollection.js';
import CustomerCreditLedger from '../models/CustomerCreditLedger.js';
import { ROLES } from '../constants/roles.js';
import { generateToken } from '../middleware/authMiddleware.js';

dotenv.config();

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🚀 Starting Commercial Invoicing, CRV & Receivables Credit (Phase 3) Integration Tests...\n');

  const mongoURI =
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp_test';
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB test database');

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/crm', crmRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/orders-design', orderDesignRoutes);
  app.use('/api/client-orders', clientOrderRoutes);
  app.use('/api/design-tasks', designTaskRoutes);
  app.use('/api/design-proofs', designProofRoutes);
  app.use('/api/billing-credit', billingCreditRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/payment-collections', paymentCollectionRoutes);
  app.use('/api/customer-credit', customerCreditRoutes);

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Test Server Error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  const server = app.listen(PORT);
  console.log(`Test server running on ${BASE_URL}\n`);

  let financeToken = '';
  let salesToken = '';
  let managerToken = '';
  let financeUser = null;
  let salesUser = null;
  let managerUser = null;
  let employeeDoc = null;
  let testClient = null;
  let testOrder = null;
  let testInvoice = null;

  try {
    // 0. Seed test users and employees
    console.log('--- 0. Seeding Authentication & Test Entities ---');
    await Promise.all([
      User.deleteMany({ email: { $regex: /@p3test\.vector/ } }),
      Employee.deleteMany({ email: { $regex: /@p3test\.vector/ } }),
      Client.deleteMany({ clientCode: 'CL-P3-001' }),
      ClientOrder.deleteMany({ projectTitle: { $regex: /Awash Bank/ } }),
      DesignTask.deleteMany({ briefTitle: { $regex: /Awash/ } }),
      DesignProof.deleteMany({ proofTitle: { $regex: /Awash/ } }),
      Invoice.deleteMany({ 'buyerCredentials.legalCompanyName': { $regex: /Awash/ } }),
      PaymentCollection.deleteMany({ destinationBankAccount: { $regex: /CBE Main/ } }),
      CustomerCreditLedger.deleteMany({})
    ]);

    employeeDoc = await Employee.create({
      employeeNumber: 'EMP-P3-001',
      name: { first: 'Almaz', last: 'Kebede' },
      email: 'almaz@p3test.vector',
      primaryPhone: '+251911440022',
      department: new mongoose.Types.ObjectId(),
      position: 'Senior Financial Controller',
      employmentStatus: 'active',
      hireDate: new Date()
    });

    financeUser = await User.create({
      name: 'Almaz Kebede (Finance)',
      email: 'finance@p3test.vector',
      password: 'Password123!',
      roles: [ROLES.FINANCE, ROLES.EMPLOYEE],
      accountStatus: 'active',
      employeeId: employeeDoc._id
    });

    salesUser = await User.create({
      name: 'Sara Tadesse (Sales)',
      email: 'sales@p3test.vector',
      password: 'Password123!',
      roles: [ROLES.FRONTDESK, ROLES.EMPLOYEE],
      accountStatus: 'active',
      employeeId: employeeDoc._id
    });

    managerUser = await User.create({
      name: 'Yonas Bekele (COO & Manager)',
      email: 'manager@p3test.vector',
      password: 'Password123!',
      roles: [ROLES.MANAGER, ROLES.COO],
      accountStatus: 'active',
      employeeId: employeeDoc._id
    });

    financeToken = generateToken(financeUser._id);
    salesToken = generateToken(salesUser._id);
    managerToken = generateToken(managerUser._id);

    console.log('✓ Test users and tokens initialized');

    // Create client
    testClient = await Client.create({
      clientCode: 'CL-P3-001',
      displayName: 'Awash International Bank S.C.',
      legalName: 'Awash International Bank Share Company',
      clientType: 'corporate',
      industry: 'banking_finance',
      primaryPhone: '+251911998877',
      address: {
        country: 'Ethiopia',
        city: 'Addis Ababa',
        subcity: 'Kirkos',
        landmark: 'Ras Abebe Aregay Street, Awash Towers'
      },
      businessCompliance: {
        tin: '0019283746',
        vatRegistrationNumber: 'VAT-998877',
        isVatRegistered: true
      },
      creditTerms: {
        allowCredit: true,
        creditLimit: 300000,
        creditPeriodDays: 30,
        gracePeriodDays: 5,
        creditStatus: 'active_good_standing',
        isCreditHold: false
      },
      financialMetrics: {
        currentOutstandingBalance: 0,
        totalLifetimeInvoiced: 0,
        totalLifetimePaid: 0
      },
      accountManager: employeeDoc._id,
      createdBy: salesUser._id
    });

    console.log(`✓ Test Client created: ${testClient.displayName} (${testClient.clientCode})`);

    // Create commercial client order
    const createOrderRes = await fetch(`${BASE_URL}/api/client-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        clientId: testClient._id,
        projectTitle: 'Awash Bank HQ Rooftop Pylon Signage',
        orderType: 'pylon_totem_signage',
        priority: 'urgent',
        estimatedCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        salesAccountManager: employeeDoc._id,
        fulfillmentMethod: 'on_site_installation',
        requestedItems: [
          {
            itemTitle: 'Illuminated 3D Double-Sided Pylon',
            productCategory: 'pylon_totem_signage',
            quantity: 1,
            unitPrice: 80000,
            dimensions: {
              widthCm: 250,
              heightCm: 600,
              depthReturnCm: 45
            }
          },
          {
            itemTitle: 'Ground Foundation Anchor Cage Set',
            productCategory: 'billboard_large_format',
            quantity: 1,
            unitPrice: 20000,
            dimensions: {
              widthCm: 150,
              heightCm: 150,
              depthReturnCm: 100
            }
          }
        ],
        commercial: {
          discountAmount: 0,
          vatRatePercentage: 15,
          advanceDepositRequiredPercentage: 50
        }
      })
    });

    const createOrderData = await createOrderRes.json();
    if (!createOrderRes.ok) {
      throw new Error(`Failed to create order: ${JSON.stringify(createOrderData)}`);
    }
    testOrder = createOrderData.data;
    console.log(`✓ Test ClientOrder created: ${testOrder.orderNumber} (Grand Total: ${testOrder.commercial.grandTotal} ETB, Deposit Required: ${testOrder.commercial.advanceDepositAmountRequired} ETB)\n`);

    // ==========================================
    // Test 1: Auto-generate Proforma Invoice
    // ==========================================
    console.log('--- Test 1: Auto-generate Proforma Invoice from ClientOrder ---');
    const proformaRes = await fetch(`${BASE_URL}/api/invoices/from-order/${testOrder._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        invoiceType: 'proforma'
      })
    });

    const proformaData = await proformaRes.json();
    if (!proformaRes.ok) {
      throw new Error(`Failed to generate proforma: ${JSON.stringify(proformaData)}`);
    }

    testInvoice = proformaData.data;
    console.log(`✓ Proforma Invoice generated: ${testInvoice.invoiceNumber}`);
    if (!testInvoice.invoiceNumber.startsWith('PI-')) throw new Error('Expected PI- prefix');
    if (testInvoice.invoiceType !== 'proforma') throw new Error('Expected invoiceType proforma');
    if (testInvoice.lineItems.length !== 2) throw new Error('Expected 2 auto-populated line items');
    if (testInvoice.pricingBreakdown.subtotal !== 100000) throw new Error('Expected subtotal 100,000 ETB');
    if (testInvoice.pricingBreakdown.vatAmount !== 15000) throw new Error('Expected VAT 15,000 ETB');
    if (testInvoice.pricingBreakdown.grossTotalAmount !== 115000) throw new Error('Expected gross 115,000 ETB');
    if (testInvoice.pricingBreakdown.advanceDepositAmountRequired !== 57500) throw new Error('Expected 50% deposit 57,500 ETB');
    if (testInvoice.buyerCredentials.legalCompanyName !== testClient.legalName) throw new Error('Buyer credentials mismatch');
    console.log('✓ All line items, tax breakdowns, and buyer credentials auto-populated flawlessly\n');

    // ==========================================
    // Test 2: CRV Payment (50% Deposit via CBE) -> Auto Financial Clearance (Rule 1)
    // ==========================================
    console.log('--- Test 2: Collect 50% Advance Deposit via CBE Transfer (CRV) ---');
    const paymentRes = await fetch(`${BASE_URL}/api/payment-collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({
        clientOrderId: testOrder._id,
        invoiceId: testInvoice._id,
        receiptType: 'advance_deposit_upfront',
        paymentMethod: 'bank_transfer_cbe',
        amountPaidETB: 57500,
        destinationBankAccount: '1000123456789 (CBE Main)',
        electronicTransfer: {
          bankTransactionReference: 'CBE-TX-99882211',
          mobileMoneyPayerPhone: '+251911998877'
        },
        collectedBy: employeeDoc._id,
        notes: '50% advance deposit for Awash HQ Pylon manufacturing'
      })
    });

    const paymentData = await paymentRes.json();
    if (!paymentRes.ok) {
      throw new Error(`Payment collection failed: ${JSON.stringify(paymentData)}`);
    }

    const crv = paymentData.data.paymentCollection;
    const updatedOrder = paymentData.data.clientOrder;
    const updatedInv = paymentData.data.invoice;

    console.log(`✓ CRV generated: ${crv.receiptVoucherNumber} for ${crv.amountPaidETB} ETB`);
    if (!crv.receiptVoucherNumber.startsWith('CRV-')) throw new Error('Expected CRV- prefix');
    if (crv.triggersProductionClearance !== true) throw new Error('Expected triggersProductionClearance to be true');

    console.log(`✓ Invoice updated: status = ${updatedInv.status}, outstandingBalance = ${updatedInv.outstandingBalance} ETB`);
    if (updatedInv.status !== 'partially_paid') throw new Error('Expected invoice partially_paid');
    if (updatedInv.outstandingBalance !== 57500) throw new Error('Expected 57,500 outstanding balance');

    console.log(`✓ Order financial clearance status: ${updatedOrder.productionClearance.financialClearanceStatus}`);
    if (updatedOrder.productionClearance.financialClearanceStatus !== 'cleared_for_production') {
      throw new Error('Expected financialClearanceStatus to be cleared_for_production');
    }
    console.log('✓ Rule 1 verified: 50% deposit cleared automatically cleared order for production\n');

    // ==========================================
    // Test 3: Lock Design Proof -> Instant Production Authorization
    // ==========================================
    console.log('--- Test 3: Create, Approve & Lock Design Proof for Deposit-Cleared Order ---');
    // Assign design task
    const assignTaskRes = await fetch(`${BASE_URL}/api/client-orders/${testOrder._id}/assign-design`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        assignedDesigner: employeeDoc._id,
        briefTitle: 'Awash Pylon 3D Architectural Mockup'
      })
    });
    const taskData = await assignTaskRes.json();
    if (!assignTaskRes.ok) throw new Error(`Assign task failed: ${JSON.stringify(taskData)}`);
    const designTaskId = taskData.data.task?._id || taskData.data._id;

    // Submit proof
    const submitProofRes = await fetch(`${BASE_URL}/api/design-tasks/${designTaskId}/proofs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        proofTitle: 'Awash Pylon Front & Night Render V1',
        presentationMedia: {
          daylightMockupImageUrl: 'https://cdn.vector.et/proofs/awash-pylon-day.jpg',
          nightIlluminatedMockupImageUrl: 'https://cdn.vector.et/proofs/awash-pylon-night.jpg',
          technicalDrawingPdfUrl: 'https://cdn.vector.et/proofs/awash-pylon-drawings.pdf'
        },
        productionFiles: {
          cncLaserVectorCutUrl: 'https://cdn.vector.et/proofs/awash-pylon-cut.dxf'
        },
        engineeringSpecs: {
          overallWidthCm: 250,
          overallHeightCm: 600
        }
      })
    });
    const proofData = await submitProofRes.json();
    if (!submitProofRes.ok) throw new Error(`Submit proof failed: ${JSON.stringify(proofData)}`);
    const proof = proofData.data;

    // Approve proof
    const approveProofRes = await fetch(`${BASE_URL}/api/design-proofs/${proof._id}/client-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        isApproved: true,
        approvalMethod: 'digital_signature_tablet',
        approvedByClientContactName: 'Ato Girma Tadesse (Awash Brand Director)',
        clientSignatureUrl: 'https://cdn.vector.et/signatures/awash-director.png'
      })
    });
    if (!approveProofRes.ok) throw new Error('Failed to approve proof');

    // Lock proof
    const lockProofRes = await fetch(`${BASE_URL}/api/design-proofs/${proof._id}/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      }
    });
    const lockData = await lockProofRes.json();
    if (!lockProofRes.ok) throw new Error(`Lock proof failed: ${JSON.stringify(lockData)}`);

    // Verify order authorized for production
    const orderCheckRes = await fetch(`${BASE_URL}/api/client-orders/${testOrder._id}`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const orderCheckData = await orderCheckRes.json();
    const finalOrder = orderCheckData.data;

    console.log(`✓ Order production clearance authorized: ${finalOrder.productionClearance.isProductionAuthorized}`);
    console.log(`✓ Order status: ${finalOrder.status}`);
    if (finalOrder.productionClearance.isProductionAuthorized !== true) {
      throw new Error('Expected isProductionAuthorized to be true');
    }
    if (finalOrder.status !== 'production_authorized') {
      throw new Error('Expected order status to be production_authorized');
    }
    console.log('✓ Rule 1 Full Gate Verified: Locking proof on deposit-cleared order automatically flipped status to production_authorized\n');

    // ==========================================
    // Test 4: 1-Click Proforma to Commercial Tax Invoice Conversion
    // ==========================================
    console.log('--- Test 4: 1-Click Convert Proforma to Commercial Tax Invoice ---');
    const convertRes = await fetch(`${BASE_URL}/api/invoices/${testInvoice._id}/convert-to-tax`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({
        fiscalReceiptReference: 'ERCA-FISCAL-2026-991188'
      })
    });

    const convertData = await convertRes.json();
    if (!convertRes.ok) throw new Error(`Failed to convert invoice: ${JSON.stringify(convertData)}`);

    const taxInvoice = convertData.data;
    console.log(`✓ Tax Invoice generated: ${taxInvoice.invoiceNumber}`);
    console.log(`✓ Proforma reference archived: ${taxInvoice.proformaReferenceCode}`);
    if (!taxInvoice.invoiceNumber.startsWith('INV-')) throw new Error('Expected INV- prefix');
    if (taxInvoice.invoiceType !== 'tax_invoice') throw new Error('Expected tax_invoice type');
    if (taxInvoice.proformaReferenceCode !== testInvoice.invoiceNumber) {
      throw new Error(`Expected proformaReferenceCode ${testInvoice.invoiceNumber}, got ${taxInvoice.proformaReferenceCode}`);
    }
    if (taxInvoice.fiscalReceiptReference !== 'ERCA-FISCAL-2026-991188') {
      throw new Error('Fiscal reference was not stored properly');
    }
    console.log('✓ 1-Click Proforma to VAT Tax Invoice conversion successful\n');

    // ==========================================
    // Test 5: Corporate Credit Dispatch & Customer Credit Ledger
    // ==========================================
    console.log('--- Test 5: Corporate Credit Dispatch & Customer Credit Ledger ---');
    // Create second order for credit dispatch
    const creditOrderRes = await fetch(`${BASE_URL}/api/client-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        clientId: testClient._id,
        projectTitle: 'Awash Bank Branch Acrylic Lightboxes (Net 30 Credit)',
        orderType: 'backlit_lightbox',
        priority: 'normal',
        estimatedCompletionDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        salesAccountManager: employeeDoc._id,
        fulfillmentMethod: 'company_delivery_only',
        requestedItems: [
          {
            itemTitle: 'Ultra-Slim LED Lightbox 120x80cm',
            productCategory: 'backlit_lightbox',
            quantity: 2,
            unitPrice: 25000,
            dimensions: { widthCm: 120, heightCm: 80, depthReturnCm: 6 }
          }
        ],
        commercial: {
          paymentTermsType: 'credit_approved_account',
          vatRatePercentage: 15
        }
      })
    });
    const creditOrderData = await creditOrderRes.json();
    const creditOrder = creditOrderData.data;

    // Generate commercial tax invoice for the credit order
    const creditInvoiceRes = await fetch(`${BASE_URL}/api/invoices/from-order/${creditOrder._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({
        invoiceType: 'tax_invoice',
        paymentTermType: 'net_30_days',
        validityDays: 30
      })
    });
    const creditInvoiceData = await creditInvoiceRes.json();
    const creditInvoice = creditInvoiceData.data;

    // Dispatch on credit
    const dispatchRes = await fetch(`${BASE_URL}/api/invoices/${creditInvoice._id}/dispatch-credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({
        notes: 'Dispatched under approved 300,000 ETB Master Credit Facility'
      })
    });
    const dispatchData = await dispatchRes.json();
    if (!dispatchRes.ok) throw new Error(`Dispatch on credit failed: ${JSON.stringify(dispatchData)}`);

    const dispatchedInvoice = dispatchData.data.invoice;
    const ledgerDebit = dispatchData.data.ledgerEntry;
    const updatedCreditOrder = dispatchData.data.clientOrder;

    console.log(`✓ Invoice dispatched on credit: isCreditDispatched = ${dispatchedInvoice.isCreditDispatched}, status = ${dispatchedInvoice.status}`);
    console.log(`✓ CustomerCreditLedger debit recorded: ${ledgerDebit.transactionCode} (Amount: ${ledgerDebit.amount} ETB, Balance After: ${ledgerDebit.balanceAfter} ETB)`);
    console.log(`✓ Credit order cleared for production: financialClearanceStatus = ${updatedCreditOrder.productionClearance.financialClearanceStatus}`);

    if (dispatchedInvoice.isCreditDispatched !== true) throw new Error('Expected isCreditDispatched to be true');
    if (ledgerDebit.transactionType !== 'invoice_debit') throw new Error('Expected transactionType invoice_debit');
    if (updatedCreditOrder.productionClearance.financialClearanceStatus !== 'corporate_credit_approved') {
      throw new Error('Expected corporate_credit_approved status');
    }
    console.log('✓ Corporate credit dispatch and ledger entry verified\n');

    // ==========================================
    // Test 6: Credit Hold Enforcement Barrier (Rule 2)
    // ==========================================
    console.log('--- Test 6: Credit Hold Barrier Enforcement ---');
    // Place client on credit hold
    await Client.findByIdAndUpdate(testClient._id, {
      $set: {
        'creditTerms.isCreditHold': true,
        'creditTerms.creditStatus': 'credit_hold_locked',
        'creditTerms.creditHoldReason': 'Overdue corporate receivables exceed 30 days limit'
      }
    });

    // Attempt to dispatch on credit while on credit hold
    const blockedDispatchRes = await fetch(`${BASE_URL}/api/invoices/${creditInvoice._id}/dispatch-credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({ notes: 'Attempting credit bypass' })
    });

    console.log(`✓ Blocked credit dispatch status: ${blockedDispatchRes.status}`);
    const blockedData = await blockedDispatchRes.json();
    if (blockedDispatchRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for credit hold, got ${blockedDispatchRes.status}`);
    }
    console.log(`✓ Barrier successfully rejected transaction: "${blockedData.message}"`);
    console.log('✓ Rule 2 verified: Credit hold blocks unapproved order release\n');

    // Restore client credit hold for reporting tests
    await Client.findByIdAndUpdate(testClient._id, {
      $set: {
        'creditTerms.isCreditHold': false,
        'creditTerms.creditStatus': 'active_good_standing'
      }
    });

    // ==========================================
    // Test 7: Receivables Aging Report & Evaluation
    // ==========================================
    console.log('--- Test 7: Receivables Aging Report & Batch Evaluation ---');
    const evalRes = await fetch(`${BASE_URL}/api/customer-credit/evaluate-aging`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      }
    });
    const evalData = await evalRes.json();
    if (!evalRes.ok) throw new Error('Aging evaluation failed');
    console.log(`✓ Aging evaluation executed: evaluated ${evalData.data.evaluatedTransactions} transactions`);

    const reportRes = await fetch(`${BASE_URL}/api/customer-credit/aging-report`, {
      headers: { Authorization: `Bearer ${financeToken}` }
    });
    const reportData = await reportRes.json();
    if (!reportRes.ok) throw new Error('Failed to get aging report');

    console.log(`✓ Aging report summary: Total Outstanding = ${reportData.data.summary.totalOutstanding} ETB, Current 0-30 Days = ${reportData.data.summary.current_0_30_days} ETB`);
    if (reportData.data.summary.totalOutstanding <= 0) {
      throw new Error('Expected positive outstanding balance in aging report');
    }

    // Ledger query
    const ledgerRes = await fetch(`${BASE_URL}/api/customer-credit/${testClient._id}/ledger`, {
      headers: { Authorization: `Bearer ${financeToken}` }
    });
    const ledgerData = await ledgerRes.json();
    if (!ledgerRes.ok) throw new Error('Failed to get client ledger');
    console.log(`✓ Client ledger entries retrieved: ${ledgerData.data.ledgerEntries.length} transactions`);
    if (ledgerData.data.ledgerEntries.length === 0) {
      throw new Error('Expected at least one ledger transaction');
    }
    console.log('✓ Receivables aging and ledger statement reporting verified\n');

    console.log('🎉 ALL PHASE 3 INTEGRATION TESTS PASSED 100% CLEANLY! 🎉\n');
  } catch (error) {
    console.error('❌ Phase 3 Integration Test Failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('MongoDB disconnected and test server stopped');
  }
}

runTests();
