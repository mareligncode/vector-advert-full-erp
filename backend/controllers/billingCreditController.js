import * as billingCreditService from '../services/billingCreditService.js';

// ==========================================
// 1. Invoice Controllers
// ==========================================

export async function createInvoiceFromOrder(req, res, next) {
  try {
    const orderId = req.params.orderId || req.body.orderId;
    const { invoiceType, ...options } = req.body;
    const invoice = await billingCreditService.generateInvoiceFromOrder(
      orderId,
      invoiceType,
      req.user?._id,
      options
    );

    res.status(201).json({
      success: true,
      message: `${invoice.invoiceType === 'tax_invoice' ? 'Commercial Tax' : 'Proforma'} Invoice created successfully`,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoices(req, res, next) {
  try {
    const result = await billingCreditService.getInvoices(req.query, req.query);
    res.status(200).json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: result.invoices,
      meta: {
        total: result.total,
        page: result.page,
        pages: result.pages
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceById(req, res, next) {
  try {
    const result = await billingCreditService.getInvoiceById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Invoice retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function convertProformaHandler(req, res, next) {
  try {
    const invoice = await billingCreditService.convertProformaToTaxInvoice(
      req.params.id,
      req.body,
      req.user?._id
    );

    res.status(200).json({
      success: true,
      message: 'Proforma Invoice successfully converted to Commercial Tax Invoice',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelInvoiceHandler(req, res, next) {
  try {
    const invoice = await billingCreditService.cancelInvoice(
      req.params.id,
      req.body.reason,
      req.user?._id
    );

    res.status(200).json({
      success: true,
      message: 'Invoice successfully cancelled',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function dispatchOnCreditHandler(req, res, next) {
  try {
    const result = await billingCreditService.dispatchOnCredit(
      req.params.id,
      req.body,
      req.user?._id
    );

    res.status(200).json({
      success: true,
      message: 'Invoice dispatched on corporate credit and order cleared for production',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 2. Payment Collection Controllers
// ==========================================

export async function collectPayment(req, res, next) {
  try {
    const result = await billingCreditService.processPaymentCollection(
      req.body,
      req.user?._id
    );

    res.status(201).json({
      success: true,
      message: 'Cash Receipt Voucher (CRV) recorded successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentCollections(req, res, next) {
  try {
    const result = await billingCreditService.getPaymentCollections(req.query, req.query);
    res.status(200).json({
      success: true,
      message: 'Payment collection vouchers retrieved successfully',
      data: result.payments,
      meta: {
        total: result.total,
        page: result.page,
        pages: result.pages
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentCollectionById(req, res, next) {
  try {
    const payment = await billingCreditService.getPaymentCollectionById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Payment collection voucher retrieved successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const payment = await billingCreditService.verifyPaymentCollection(
      req.params.id,
      req.body,
      req.user?._id
    );

    res.status(200).json({
      success: true,
      message: 'Payment voucher verified by Finance',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 3. Customer Credit & Aging Controllers
// ==========================================

export async function getClientCreditLedger(req, res, next) {
  try {
    const result = await billingCreditService.getCustomerCreditLedger(
      req.params.clientId,
      req.query,
      req.query
    );

    res.status(200).json({
      success: true,
      message: 'Customer credit ledger retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getAgingReport(req, res, next) {
  try {
    const report = await billingCreditService.getReceivablesAgingReport();
    res.status(200).json({
      success: true,
      message: 'Receivables aging report generated successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
}

export async function triggerAgingEvaluation(req, res, next) {
  try {
    const result = await billingCreditService.runDailyCreditAgingAndHoldCheck();
    res.status(200).json({
      success: true,
      message: 'Credit aging evaluation completed and credit holds refreshed',
      data: result
    });
  } catch (error) {
    next(error);
  }
}
