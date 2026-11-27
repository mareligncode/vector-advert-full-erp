import Invoice from '../models/Invoice.js';
import PaymentCollection from '../models/PaymentCollection.js';
import CustomerCreditLedger from '../models/CustomerCreditLedger.js';
import ClientOrder from '../models/ClientOrder.js';
import Client from '../models/Client.js';
import { generateCode, withTransaction } from '../utils/inventoryService.js';

// ==========================================
// 1. Invoice Services
// ==========================================

export async function generateInvoiceFromOrder(orderId, invoiceType = 'proforma', userId, options = {}) {
  const clientOrder = await ClientOrder.findById(orderId);
  if (!clientOrder) {
    const error = new Error('Referenced ClientOrder does not exist');
    error.statusCode = 404;
    throw error;
  }

  const client = await Client.findById(clientOrder.clientId);
  if (!client) {
    const error = new Error('Referenced Client for order does not exist');
    error.statusCode = 404;
    throw error;
  }

  const type = invoiceType === 'tax_invoice' ? 'tax_invoice' : 'proforma';
  const prefix = type === 'tax_invoice' ? 'INV' : 'PI';
  const invoiceNumber = await generateCode(prefix, Invoice, 'invoiceNumber');

  // Auto-inherit line items from ClientOrder requestedItems
  const lineItems = (clientOrder.requestedItems || []).map((item, index) => {
    const quantity = Number(item.quantity) || 1;
    const unitPrice = Number(item.unitPrice) || 0;
    const totalPrice = item.totalPrice !== undefined && !isNaN(Number(item.totalPrice)) ? Number(item.totalPrice) : quantity * unitPrice;
    const widthCm = Number(item.dimensions?.widthCm) || 0;
    const heightCm = Number(item.dimensions?.heightCm) || 0;
    const depthReturnCm = Number(item.dimensions?.depthReturnCm) || 0;
    const totalAreaSqM = Number(item.dimensions?.totalAreaSqM) || Math.round(((widthCm * heightCm * quantity) / 10000) * 100) / 100;

    return {
      itemCode: item.itemCode || `ITEM-${String(index + 1).padStart(2, '0')}`,
      description: item.itemTitle || item.description || `Deliverable ${index + 1}`,
      dimensions: {
        widthCm,
        heightCm,
        depthReturnCm,
        totalAreaSqM
      },
      quantity,
      unitPrice,
      totalPrice
    };
  });

  const subtotal = lineItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const discountAmount = options.discountAmount !== undefined ? Number(options.discountAmount) : (Number(clientOrder.commercial?.discountAmount) || 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const vatRate = options.vatRate !== undefined ? Number(options.vatRate) : (clientOrder.commercial?.vatRatePercentage !== undefined ? Number(clientOrder.commercial.vatRatePercentage) : 15);
  const vatAmount = Math.round(taxableAmount * (vatRate / 100) * 100) / 100;

  const withholdingTaxApplicable = options.withholdingTaxApplicable !== undefined ? Boolean(options.withholdingTaxApplicable) : Boolean(clientOrder.commercial?.withholdingTaxApplicable);
  const withholdingTaxRate = 2;
  const withholdingTaxAmount = withholdingTaxApplicable ? Math.round(taxableAmount * 0.02 * 100) / 100 : 0;

  const grossTotalAmount = taxableAmount + vatAmount;
  const advanceDepositRequiredPercentage = options.advanceDepositRequiredPercentage !== undefined ? Number(options.advanceDepositRequiredPercentage) : (Number(clientOrder.commercial?.advanceDepositRequiredPercentage) || 50);
  const advanceDepositAmountRequired = Math.round(grossTotalAmount * (advanceDepositRequiredPercentage / 100) * 100) / 100;

  const validityDays = Number(options.validityDays) || (type === 'tax_invoice' ? 30 : 15);
  const dueDate = options.dueDate ? new Date(options.dueDate) : new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

  const billingAddress = [
    client.address?.buildingName,
    client.address?.officeNumber ? `Office ${client.address.officeNumber}` : null,
    client.address?.subcity ? `Subcity ${client.address.subcity}` : null,
    client.address?.city || 'Addis Ababa'
  ].filter(Boolean).join(', ') || 'Addis Ababa, Ethiopia';

  const invoice = new Invoice({
    invoiceNumber,
    invoiceType: type,
    proformaReferenceCode: options.proformaReferenceCode || null,
    clientOrderId: clientOrder._id,
    jobOrderId: clientOrder.spawnedJobOrderId || null,
    clientId: client._id,
    status: options.status || 'issued',
    buyerCredentials: {
      legalCompanyName: client.legalName || client.displayName,
      tin: client.businessCompliance?.tin || '',
      vatRegistrationNumber: client.businessCompliance?.vatRegistrationNumber || '',
      billingAddress
    },
    issueDate: options.issueDate || new Date(),
    validityDays,
    paymentTermType: options.paymentTermType || 'immediate_due_on_receipt',
    dueDate,
    lineItems,
    pricingBreakdown: {
      subtotal,
      discountAmount,
      taxableAmount,
      vatRate,
      vatAmount,
      withholdingTaxApplicable,
      withholdingTaxRate,
      withholdingTaxAmount,
      grossTotalAmount,
      advanceDepositRequiredPercentage,
      advanceDepositAmountRequired
    },
    totalPaidAmount: 0,
    withholdingTaxVoucherAmount: 0,
    outstandingBalance: grossTotalAmount,
    isCreditDispatched: false,
    fiscalReceiptReference: options.fiscalReceiptReference || null,
    bankRemittanceAccounts: options.bankRemittanceAccounts || [
      {
        bankName: 'Commercial Bank of Ethiopia (CBE)',
        accountNumber: '1000123456789',
        accountName: 'Vector Advert Advertising PLC'
      },
      {
        bankName: 'Awash Bank',
        accountNumber: '01425123456700',
        accountName: 'Vector Advert Advertising PLC'
      }
    ],
    issuedBy: userId
  });

  return await invoice.save();
}

export async function getInvoices(filters = {}, pagination = {}) {
  const query = {};

  if (filters.invoiceType) query.invoiceType = filters.invoiceType;
  if (filters.status) query.status = filters.status;
  if (filters.clientId) query.clientId = filters.clientId;
  if (filters.clientOrderId) query.clientOrderId = filters.clientOrderId;
  if (filters.isCreditDispatched !== undefined) query.isCreditDispatched = filters.isCreditDispatched === 'true' || filters.isCreditDispatched === true;

  if (filters.overdue === true || filters.overdue === 'true') {
    query.dueDate = { $lt: new Date() };
    query.outstandingBalance = { $gt: 0 };
    query.status = { $nin: ['fully_paid', 'cancelled', 'bad_debt_write_off'] };
  }

  if (filters.search) {
    const term = filters.search.trim();
    query.$or = [
      { invoiceNumber: { $regex: term, $options: 'i' } },
      { 'buyerCredentials.legalCompanyName': { $regex: term, $options: 'i' } },
      { 'buyerCredentials.tin': { $regex: term, $options: 'i' } }
    ];
  }

  const page = parseInt(pagination.page, 10) || 1;
  const limit = parseInt(pagination.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const sort = pagination.sort || { createdAt: -1 };

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .populate('clientId', 'clientCode displayName legalName primaryPhone')
      .populate('clientOrderId', 'orderNumber projectTitle orderType')
      .populate('issuedBy', 'username role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Invoice.countDocuments(query)
  ]);

  return {
    invoices,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

export async function getInvoiceById(invoiceId) {
  const invoice = await Invoice.findById(invoiceId)
    .populate('clientId')
    .populate('clientOrderId')
    .populate('issuedBy', 'username role')
    .populate('approvedByFinance', 'username role');

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  const payments = await PaymentCollection.find({ invoiceId: invoice._id })
    .populate('collectedBy', 'firstName lastName')
    .populate('verifiedByFinance', 'username role')
    .sort({ paymentDate: -1 });

  return {
    invoice,
    payments
  };
}

export async function convertProformaToTaxInvoice(invoiceId, fiscalData = {}, userId) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  if (invoice.invoiceType !== 'proforma') {
    const error = new Error(`Invoice is already of type '${invoice.invoiceType}', only 'proforma' can be converted`);
    error.statusCode = 400;
    throw error;
  }

  if (invoice.status === 'cancelled') {
    const error = new Error('Cannot convert a cancelled proforma invoice');
    error.statusCode = 400;
    throw error;
  }

  const taxInvoiceNumber = await generateCode('INV', Invoice, 'invoiceNumber');

  invoice.proformaReferenceCode = invoice.invoiceNumber;
  invoice.invoiceNumber = taxInvoiceNumber;
  invoice.invoiceType = 'tax_invoice';
  invoice.issueDate = new Date();
  invoice.approvedByFinance = userId;

  if (fiscalData.fiscalReceiptReference) {
    invoice.fiscalReceiptReference = fiscalData.fiscalReceiptReference;
  }
  if (fiscalData.bankRemittanceAccounts && Array.isArray(fiscalData.bankRemittanceAccounts)) {
    invoice.bankRemittanceAccounts = fiscalData.bankRemittanceAccounts;
  }

  return await invoice.save();
}

export async function cancelInvoice(invoiceId, reason, userId) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  if (invoice.totalPaidAmount > 0) {
    const error = new Error('Cannot cancel an invoice with recorded payments. Reverse payments or issue a credit note.');
    error.statusCode = 400;
    throw error;
  }

  invoice.status = 'cancelled';
  return await invoice.save();
}

// ==========================================
// 2. Payment Collection & CRV Services
// ==========================================

export async function processPaymentCollection(paymentData, userId) {
  return await withTransaction(async (session) => {
    const clientOrder = await ClientOrder.findById(paymentData.clientOrderId).session(session);
    if (!clientOrder) {
      const error = new Error('Referenced ClientOrder does not exist');
      error.statusCode = 404;
      throw error;
    }

    const client = await Client.findById(clientOrder.clientId).session(session);
    if (!client) {
      const error = new Error('Referenced Client does not exist');
      error.statusCode = 404;
      throw error;
    }

    const amountPaidETB = Number(paymentData.amountPaidETB);
    if (isNaN(amountPaidETB) || amountPaidETB <= 0) {
      const error = new Error('Amount paid must be greater than 0 ETB');
      error.statusCode = 400;
      throw error;
    }

    let invoice = null;
    if (paymentData.invoiceId) {
      invoice = await Invoice.findById(paymentData.invoiceId).session(session);
      if (!invoice) {
        const error = new Error('Referenced Invoice does not exist');
        error.statusCode = 404;
        throw error;
      }
    }

    const receiptVoucherNumber = await generateCode('CRV', PaymentCollection, 'receiptVoucherNumber');

    // Update invoice if linked
    if (invoice) {
      if (paymentData.paymentMethod === 'withholding_tax_voucher_2pct') {
        invoice.withholdingTaxVoucherAmount = (invoice.withholdingTaxVoucherAmount || 0) + amountPaidETB;
      } else {
        invoice.totalPaidAmount = (invoice.totalPaidAmount || 0) + amountPaidETB;
      }

      invoice.outstandingBalance = Math.max(
        0,
        invoice.pricingBreakdown.grossTotalAmount - invoice.totalPaidAmount - invoice.withholdingTaxVoucherAmount
      );

      if (invoice.outstandingBalance <= 0) {
        invoice.status = 'fully_paid';
      } else {
        invoice.status = 'partially_paid';
      }

      await invoice.save({ session });
    }

    // Update ClientOrder advance deposit metrics
    clientOrder.commercial.advanceDepositAmountPaid = (clientOrder.commercial.advanceDepositAmountPaid || 0) + amountPaidETB;
    clientOrder.commercial.advanceReceiptNumber = receiptVoucherNumber;
    clientOrder.commercial.currentOutstandingBalance = Math.max(
      0,
      (clientOrder.commercial.grandTotal || 0) - clientOrder.commercial.advanceDepositAmountPaid
    );

    let triggersProductionClearance = false;

    // Rule 1 Execution: Advance Deposit Cleared -> Production Financial Clearance
    const requiredDeposit = clientOrder.commercial.advanceDepositAmountRequired || 0;
    if (clientOrder.commercial.advanceDepositAmountPaid >= requiredDeposit) {
      clientOrder.productionClearance.financialClearanceStatus = 'cleared_for_production';
      clientOrder.productionClearance.financialClearedAt = new Date();
      clientOrder.productionClearance.financialClearedBy = userId;
      clientOrder.productionClearance.proceedToProductionConfirmed = true;

      // If design proof is locked and agreed, immediately authorize production
      if (clientOrder.designTask?.agreedDesignProofId) {
        clientOrder.productionClearance.isProductionAuthorized = true;
        clientOrder.productionAuthorizedDate = new Date();
        clientOrder.status = 'production_authorized';
      }

      triggersProductionClearance = true;
    }

    await clientOrder.save({ session });

    // If client had an on-credit transaction or balance, update customer credit ledger
    if (client.creditTerms?.allowCredit || invoice?.isCreditDispatched) {
      const balanceBefore = client.financialMetrics?.currentOutstandingBalance || 0;
      const balanceAfter = Math.max(0, balanceBefore - amountPaidETB);

      client.financialMetrics.currentOutstandingBalance = balanceAfter;
      await client.save({ session });

      const transactionCode = await generateCode('CCL', CustomerCreditLedger, 'transactionCode');
      const ledgerEntry = new CustomerCreditLedger({
        transactionCode,
        clientId: client._id,
        clientOrderId: clientOrder._id,
        invoiceId: invoice?._id || null,
        transactionType: paymentData.paymentMethod === 'withholding_tax_voucher_2pct' ? 'withholding_tax_credit' : 'payment_credit',
        amount: amountPaidETB,
        balanceBefore,
        balanceAfter,
        notes: paymentData.notes || `CRV ${receiptVoucherNumber} payment received via ${paymentData.paymentMethod}`,
        recordedBy: userId
      });
      await ledgerEntry.save({ session });
    }

    // Update Client total lifetime paid
    client.financialMetrics.totalLifetimePaid = (client.financialMetrics.totalLifetimePaid || 0) + amountPaidETB;
    await client.save({ session });

    // Create PaymentCollection record
    const paymentCollection = new PaymentCollection({
      receiptVoucherNumber,
      invoiceId: invoice?._id || null,
      clientOrderId: clientOrder._id,
      clientId: client._id,
      receiptType: paymentData.receiptType,
      paymentMethod: paymentData.paymentMethod,
      amountPaidETB,
      paymentDate: paymentData.paymentDate || new Date(),
      destinationBankAccount: paymentData.destinationBankAccount || '',
      electronicTransfer: paymentData.electronicTransfer || {},
      chequeDetails: paymentData.chequeDetails || {},
      withholdingTaxCreditSlip: paymentData.withholdingTaxCreditSlip || {},
      triggersProductionClearance,
      collectedBy: paymentData.collectedBy || userId,
      verifiedByFinance: userId,
      paymentProofEvidenceId: paymentData.paymentProofEvidenceId || null,
      notes: paymentData.notes || ''
    });

    await paymentCollection.save({ session });

    return {
      paymentCollection,
      clientOrder,
      invoice
    };
  });
}

export async function getPaymentCollections(filters = {}, pagination = {}) {
  const query = {};

  if (filters.clientOrderId) query.clientOrderId = filters.clientOrderId;
  if (filters.invoiceId) query.invoiceId = filters.invoiceId;
  if (filters.clientId) query.clientId = filters.clientId;
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
  if (filters.receiptType) query.receiptType = filters.receiptType;

  if (filters.search) {
    const term = filters.search.trim();
    query.$or = [
      { receiptVoucherNumber: { $regex: term, $options: 'i' } },
      { 'electronicTransfer.bankTransactionReference': { $regex: term, $options: 'i' } },
      { 'chequeDetails.chequeNumber': { $regex: term, $options: 'i' } }
    ];
  }

  const page = parseInt(pagination.page, 10) || 1;
  const limit = parseInt(pagination.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const sort = pagination.sort || { paymentDate: -1 };

  const [payments, total] = await Promise.all([
    PaymentCollection.find(query)
      .populate('clientId', 'clientCode displayName legalName primaryPhone')
      .populate('clientOrderId', 'orderNumber projectTitle orderType')
      .populate('invoiceId', 'invoiceNumber invoiceType status')
      .populate('collectedBy', 'firstName lastName')
      .populate('verifiedByFinance', 'username role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    PaymentCollection.countDocuments(query)
  ]);

  return {
    payments,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

export async function getPaymentCollectionById(paymentId) {
  const payment = await PaymentCollection.findById(paymentId)
    .populate('clientId')
    .populate('clientOrderId')
    .populate('invoiceId')
    .populate('collectedBy')
    .populate('verifiedByFinance', 'username role');

  if (!payment) {
    const error = new Error('Payment collection voucher not found');
    error.statusCode = 404;
    throw error;
  }

  return payment;
}

export async function verifyPaymentCollection(paymentId, verificationData = {}, userId) {
  const payment = await PaymentCollection.findById(paymentId);
  if (!payment) {
    const error = new Error('Payment collection voucher not found');
    error.statusCode = 404;
    throw error;
  }

  payment.verifiedByFinance = userId;
  if (verificationData.notes) {
    payment.notes = (payment.notes ? `${payment.notes} | ` : '') + verificationData.notes;
  }

  if (payment.paymentMethod === 'cheque_corporate' && verificationData.clearingStatus) {
    payment.chequeDetails.clearingStatus = verificationData.clearingStatus;
    if (verificationData.clearingStatus === 'cleared_in_bank') {
      payment.chequeDetails.clearedDate = new Date();
    }
  }

  return await payment.save();
}

// ==========================================
// 3. Customer Credit & Receivables Control
// ==========================================

export async function dispatchOnCredit(invoiceId, creditData = {}, userId) {
  return await withTransaction(async (session) => {
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    if (invoice.status === 'cancelled') {
      const error = new Error('Cannot dispatch a cancelled invoice on credit');
      error.statusCode = 400;
      throw error;
    }

    const client = await Client.findById(invoice.clientId).session(session);
    if (!client) {
      const error = new Error('Client not found');
      error.statusCode = 404;
      throw error;
    }

    if (!client.creditTerms?.allowCredit) {
      const error = new Error('Client is not authorized for credit transactions');
      error.statusCode = 400;
      throw error;
    }

    if (client.creditTerms?.isCreditHold) {
      const error = new Error(`Client is currently on credit hold: ${client.creditTerms.creditHoldReason || 'Credit hold locked'}`);
      error.statusCode = 403;
      throw error;
    }

    const currentBalance = client.financialMetrics?.currentOutstandingBalance || 0;
    const creditLimit = client.creditTerms?.creditLimit || 0;
    const amountToDebit = invoice.outstandingBalance;

    if (currentBalance + amountToDebit > creditLimit) {
      const error = new Error(`Transaction exceeds authorized credit limit. Current balance: ${currentBalance} ETB, Requested: ${amountToDebit} ETB, Limit: ${creditLimit} ETB`);
      error.statusCode = 400;
      throw error;
    }

    // Mark invoice
    invoice.isCreditDispatched = true;
    invoice.status = 'credit_settled';
    await invoice.save({ session });

    // Update Client balance & credit status
    const newBalance = currentBalance + amountToDebit;
    client.financialMetrics.currentOutstandingBalance = newBalance;
    if (newBalance >= creditLimit * 0.9 && client.creditTerms.creditStatus === 'active_good_standing') {
      client.creditTerms.creditStatus = 'near_credit_limit';
    }
    await client.save({ session });

    // Record Customer Credit Ledger debit
    const transactionCode = await generateCode('CCL', CustomerCreditLedger, 'transactionCode');
    const ledgerEntry = new CustomerCreditLedger({
      transactionCode,
      clientId: client._id,
      clientOrderId: invoice.clientOrderId,
      invoiceId: invoice._id,
      transactionType: 'invoice_debit',
      amount: amountToDebit,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      dueDate: invoice.dueDate,
      daysPastDue: 0,
      agingBracket: 'current_0_30_days',
      notes: creditData.notes || `Dispatched on credit under terms: ${client.creditTerms.creditPeriodDays || 30} days`,
      recordedBy: userId
    });
    await ledgerEntry.save({ session });

    // Release ClientOrder for production
    const clientOrder = await ClientOrder.findById(invoice.clientOrderId).session(session);
    if (clientOrder) {
      clientOrder.productionClearance.financialClearanceStatus = 'corporate_credit_approved';
      clientOrder.productionClearance.financialClearedAt = new Date();
      clientOrder.productionClearance.financialClearedBy = userId;
      clientOrder.productionClearance.proceedToProductionConfirmed = true;

      // If design proof is locked and agreed, immediately authorize production
      if (clientOrder.designTask?.agreedDesignProofId) {
        clientOrder.productionClearance.isProductionAuthorized = true;
        clientOrder.productionAuthorizedDate = new Date();
        clientOrder.status = 'production_authorized';
      }

      await clientOrder.save({ session });
    }

    return {
      invoice,
      clientOrder,
      ledgerEntry
    };
  });
}

export async function getCustomerCreditLedger(clientId, filters = {}, pagination = {}) {
  const client = await Client.findById(clientId);
  if (!client) {
    const error = new Error('Client not found');
    error.statusCode = 404;
    throw error;
  }

  const query = { clientId };
  if (filters.transactionType) query.transactionType = filters.transactionType;
  if (filters.agingBracket) query.agingBracket = filters.agingBracket;

  const page = parseInt(pagination.page, 10) || 1;
  const limit = parseInt(pagination.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const [ledgerEntries, total] = await Promise.all([
    CustomerCreditLedger.find(query)
      .populate('clientOrderId', 'orderNumber projectTitle')
      .populate('invoiceId', 'invoiceNumber grossTotalAmount')
      .populate('recordedBy', 'username role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CustomerCreditLedger.countDocuments(query)
  ]);

  return {
    clientCreditProfile: {
      clientId: client._id,
      clientCode: client.clientCode,
      displayName: client.displayName,
      allowCredit: client.creditTerms?.allowCredit || false,
      creditLimit: client.creditTerms?.creditLimit || 0,
      creditPeriodDays: client.creditTerms?.creditPeriodDays || 0,
      gracePeriodDays: client.creditTerms?.gracePeriodDays || 5,
      currentOutstandingBalance: client.financialMetrics?.currentOutstandingBalance || 0,
      creditStatus: client.creditTerms?.creditStatus || 'active_good_standing',
      isCreditHold: client.creditTerms?.isCreditHold || false,
      creditHoldReason: client.creditTerms?.creditHoldReason || null
    },
    ledgerEntries,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

export async function getReceivablesAgingReport() {
  const clients = await Client.find({
    'financialMetrics.currentOutstandingBalance': { $gt: 0 }
  }).select('clientCode displayName legalName creditTerms financialMetrics');

  const now = new Date();

  // Aggregate active open invoice debits from ledger
  const activeDebits = await CustomerCreditLedger.find({
    transactionType: 'invoice_debit'
  }).populate('clientId', 'clientCode displayName legalName creditTerms');

  const agingBuckets = {
    current_0_30_days: 0,
    overdue_31_60_days: 0,
    overdue_61_90_days: 0,
    critical_over_90_days: 0,
    totalOutstanding: 0
  };

  const clientBreakdowns = [];

  for (const client of clients) {
    const clientDebits = activeDebits.filter(
      (d) => d.clientId && d.clientId._id.toString() === client._id.toString()
    );

    let b0_30 = 0;
    let b31_60 = 0;
    let b61_90 = 0;
    let b90Plus = 0;

    for (const debit of clientDebits) {
      const dueDate = debit.dueDate || debit.createdAt;
      const diffMs = now.getTime() - new Date(dueDate).getTime();
      const daysPastDue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      if (daysPastDue <= 30) {
        b0_30 += debit.amount;
      } else if (daysPastDue <= 60) {
        b31_60 += debit.amount;
      } else if (daysPastDue <= 90) {
        b61_90 += debit.amount;
      } else {
        b90Plus += debit.amount;
      }
    }

    const totalClient = client.financialMetrics?.currentOutstandingBalance || (b0_30 + b31_60 + b61_90 + b90Plus);

    agingBuckets.current_0_30_days += b0_30;
    agingBuckets.overdue_31_60_days += b31_60;
    agingBuckets.overdue_61_90_days += b61_90;
    agingBuckets.critical_over_90_days += b90Plus;
    agingBuckets.totalOutstanding += totalClient;

    clientBreakdowns.push({
      clientId: client._id,
      clientCode: client.clientCode,
      displayName: client.displayName,
      creditLimit: client.creditTerms?.creditLimit || 0,
      totalOutstanding: totalClient,
      isCreditHold: client.creditTerms?.isCreditHold || false,
      creditStatus: client.creditTerms?.creditStatus || 'active_good_standing',
      aging: {
        current_0_30_days: b0_30,
        overdue_31_60_days: b31_60,
        overdue_61_90_days: b61_90,
        critical_over_90_days: b90Plus
      }
    });
  }

  return {
    summary: agingBuckets,
    clients: clientBreakdowns
  };
}

export async function runDailyCreditAgingAndHoldCheck() {
  const now = new Date();
  const openDebits = await CustomerCreditLedger.find({
    transactionType: 'invoice_debit'
  });

  let evaluatedTransactions = 0;
  let clientsLockedCount = 0;
  const delinquentClientIds = new Set();

  for (const debit of openDebits) {
    const dueDate = debit.dueDate || debit.createdAt;
    const diffMs = now.getTime() - new Date(dueDate).getTime();
    const daysPastDue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    let bracket = 'current_0_30_days';
    if (daysPastDue > 90) {
      bracket = 'critical_over_90_days';
    } else if (daysPastDue > 60) {
      bracket = 'overdue_61_90_days';
    } else if (daysPastDue > 30) {
      bracket = 'overdue_31_60_days';
    }

    debit.daysPastDue = daysPastDue;
    debit.agingBracket = bracket;
    await debit.save();
    evaluatedTransactions++;

    if (daysPastDue > 5 && debit.clientId) {
      delinquentClientIds.add(debit.clientId.toString());
    }
  }

  // Also check open overdue invoices past grace period
  const overdueInvoices = await Invoice.find({
    status: { $in: ['issued', 'sent_to_client', 'partially_paid', 'credit_settled'] },
    outstandingBalance: { $gt: 0 },
    dueDate: { $lt: now }
  });

  for (const invoice of overdueInvoices) {
    const diffMs = now.getTime() - new Date(invoice.dueDate).getTime();
    const daysPastDue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    if (daysPastDue > 5 && invoice.clientId) {
      delinquentClientIds.add(invoice.clientId.toString());
    }
  }

  for (const clientId of delinquentClientIds) {
    const client = await Client.findById(clientId);
    if (client && client.creditTerms?.allowCredit) {
      const gracePeriod = client.creditTerms.gracePeriodDays || 5;
      client.creditTerms.isCreditHold = true;
      client.creditTerms.creditStatus = 'credit_hold_locked';
      client.creditTerms.creditHoldReason = `Delinquent receivables past grace period (${gracePeriod} days)`;
      await client.save();
      clientsLockedCount++;
    }
  }

  return {
    evaluatedTransactions,
    clientsLockedCount,
    evaluatedAt: now
  };
}
