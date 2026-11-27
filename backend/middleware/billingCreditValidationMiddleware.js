import mongoose from 'mongoose';
import Client from '../models/Client.js';
import ClientOrder from '../models/ClientOrder.js';
import Invoice from '../models/Invoice.js';
import {
  INVOICE_TYPE_ENUM,
  PAYMENT_METHOD_ENUM,
  RECEIPT_TYPE_ENUM
} from '../constants/operationsEnums.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Barrier middleware to prevent authorizing or dispatching orders/invoices
 * for clients who have been placed on Credit Hold.
 */
export async function checkCreditHold(req, res, next) {
  try {
    let clientId = req.body?.clientId;

    if (!clientId) {
      const orderId = req.params?.orderId || req.params?.id || req.body?.clientOrderId || req.body?.orderId;
      if (orderId && isValidObjectId(orderId)) {
        const order = await ClientOrder.findById(orderId).select('clientId');
        if (order) clientId = order.clientId;
      }
    }

    if (!clientId) {
      const invoiceId = req.params?.invoiceId || req.params?.id || req.body?.invoiceId;
      if (invoiceId && isValidObjectId(invoiceId)) {
        const invoice = await Invoice.findById(invoiceId).select('clientId');
        if (invoice) clientId = invoice.clientId;
      }
    }

    if (!clientId) {
      const proofId = req.params?.id;
      if (proofId && isValidObjectId(proofId)) {
        const proof = await mongoose.model('DesignProof').findById(proofId).select('orderId');
        if (proof?.orderId) {
          const order = await ClientOrder.findById(proof.orderId).select('clientId');
          if (order) clientId = order.clientId;
        }
      }
    }

    if (clientId) {
      const client = await Client.findById(clientId).select('creditTerms displayName');
      if (client?.creditTerms?.isCreditHold) {
        return res.status(403).json({
          success: false,
          message: 'Production blocked: Client is on Credit Hold due to overdue invoices or exceeded credit limit.',
          data: {
            clientId: client._id,
            clientName: client.displayName,
            isCreditHold: true,
            creditHoldReason: client.creditTerms.creditHoldReason || 'Overdue credit hold'
          }
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validates Cash Receipt Voucher (CRV) / Payment Collection submissions.
 */
export function validatePaymentInput(req, res, next) {
  const { clientOrderId, invoiceId, amountPaidETB, receiptType, paymentMethod, electronicTransfer, chequeDetails, withholdingTaxCreditSlip } = req.body;
  const errors = [];

  if (!clientOrderId || !isValidObjectId(clientOrderId)) {
    errors.push('Valid clientOrderId is required');
  }

  if (invoiceId && !isValidObjectId(invoiceId)) {
    errors.push('invoiceId must be a valid ObjectId if provided');
  }

  if (amountPaidETB === undefined || isNaN(Number(amountPaidETB)) || Number(amountPaidETB) <= 0) {
    errors.push('amountPaidETB must be a numeric value greater than 0');
  }

  if (!receiptType || !RECEIPT_TYPE_ENUM.includes(receiptType)) {
    errors.push(`Invalid receiptType. Allowed values: ${RECEIPT_TYPE_ENUM.join(', ')}`);
  }

  if (!paymentMethod || !PAYMENT_METHOD_ENUM.includes(paymentMethod)) {
    errors.push(`Invalid paymentMethod. Allowed values: ${PAYMENT_METHOD_ENUM.join(', ')}`);
  }

  // Method-specific verification
  if (['bank_transfer_cbe', 'bank_transfer_awash', 'bank_transfer_other'].includes(paymentMethod)) {
    if (!electronicTransfer?.bankTransactionReference?.trim()) {
      errors.push('Bank transfer reference (electronicTransfer.bankTransactionReference) is required for bank transfers');
    }
  }

  if (paymentMethod === 'cheque_corporate') {
    if (!chequeDetails?.chequeNumber?.trim()) {
      errors.push('chequeDetails.chequeNumber is required for corporate cheques');
    }
    if (!chequeDetails?.issuingBank?.trim()) {
      errors.push('chequeDetails.issuingBank is required for corporate cheques');
    }
  }

  if (paymentMethod === 'withholding_tax_voucher_2pct') {
    if (!withholdingTaxCreditSlip?.withholdingTaxSlipNumber?.trim()) {
      errors.push('withholdingTaxCreditSlip.withholdingTaxSlipNumber is required for withholding tax receipts');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for payment collection payload',
      errors
    });
  }

  next();
}

/**
 * Validates invoice generation parameters from a sales order.
 */
export function validateInvoiceFromOrderInput(req, res, next) {
  const orderId = req.params?.orderId || req.body?.orderId;
  const { invoiceType } = req.body;
  const errors = [];

  if (!orderId || !isValidObjectId(orderId)) {
    errors.push('Valid orderId is required');
  }

  if (invoiceType && !INVOICE_TYPE_ENUM.includes(invoiceType)) {
    errors.push(`Invalid invoiceType. Allowed values: ${INVOICE_TYPE_ENUM.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for invoice generation',
      errors
    });
  }

  next();
}
