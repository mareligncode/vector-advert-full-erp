import Supplier from '../models/Supplier.js';
import CreditTransaction from '../models/CreditTransaction.js';
import CreditPayment from '../models/CreditPayment.js';
import TaxConfiguration from '../models/TaxConfiguration.js';
import { generateCode, withTransaction } from '../utils/inventoryService.js';
import { attachFilesToEvidence, getEvidenceForEntity } from '../utils/evidenceHelper.js';

// ==========================================
// 1. Supplier Controllers
// ==========================================

export const getSuppliers = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(query).sort({ name: 1 });
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const transactions = await CreditTransaction.find({ supplierId: supplier._id })
      .populate('purchaseOrderId', 'purchaseOrderCode')
      .populate('grvId', 'grvCode')
      .sort({ transactionDate: -1 });

    // Universal Evidence Table Integration (Supplier licenses, TIN docs, bank agreements)
    const evidence = await getEvidenceForEntity('Supplier', supplier._id);

    res.json({
      success: true,
      data: {
        ...supplier.toObject(),
        transactions,
        evidence: evidence?.attachments || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const code = req.body.code || (await generateCode('SUP', Supplier, 'code'));
    const supplier = new Supplier({ ...req.body, code });
    await supplier.save();

    // Universal Evidence Table Attachment for Business License / Tax Cert
    if (req.body.attachments?.length > 0 || req.files?.length > 0) {
      const filesToAttach = req.files?.length > 0 ? req.files : req.body.attachments;
      await attachFilesToEvidence({
        entityType: 'Supplier',
        entityId: supplier._id,
        files: filesToAttach,
        user: req.user,
        title: `Supplier ${supplier.name} Registration & License Documents`
      });
    }

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (req.body.attachments?.length > 0 || req.files?.length > 0) {
      const filesToAttach = req.files?.length > 0 ? req.files : req.body.attachments;
      await attachFilesToEvidence({
        entityType: 'Supplier',
        entityId: supplier._id,
        files: filesToAttach,
        user: req.user,
        title: `Supplier ${supplier.name} Updated Files`
      });
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const hasTransactions = await CreditTransaction.findOne({ supplierId: req.params.id });
    if (hasTransactions) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete supplier with transaction history. Set status to inactive instead.'
      });
    }

    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. Credit Transactions & Payments
// ==========================================

export const getCreditTransactions = async (req, res) => {
  try {
    const { supplierId, paymentStatus, page = 1, limit = 50 } = req.query;
    const query = {};

    if (supplierId) query.supplierId = supplierId;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const total = await CreditTransaction.countDocuments(query);
    const transactions = await CreditTransaction.find(query)
      .populate('supplierId', 'name code phone')
      .populate('purchaseOrderId', 'purchaseOrderCode')
      .populate('grvId', 'grvCode storeGrvNumber')
      .populate('createdBy', 'email')
      .sort({ transactionDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCreditTransactionById = async (req, res) => {
  try {
    const transaction = await CreditTransaction.findById(req.params.id)
      .populate('supplierId')
      .populate('purchaseOrderId')
      .populate('grvId')
      .populate('createdBy', 'email');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const payments = await CreditPayment.find({ creditTransactionId: transaction._id }).sort({
      paymentDate: -1
    });

    const evidence = await getEvidenceForEntity('CreditTransaction', transaction._id);

    res.json({
      success: true,
      data: {
        ...transaction.toObject(),
        payments,
        evidence: evidence?.attachments || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCreditPayments = async (req, res) => {
  try {
    const { supplierId, creditTransactionId } = req.query;
    const query = {};
    if (supplierId) query.supplierId = supplierId;
    if (creditTransactionId) query.creditTransactionId = creditTransactionId;

    const payments = await CreditPayment.find(query)
      .populate('supplierId', 'name code')
      .populate('creditTransactionId', 'transactionCode')
      .populate('recordedBy', 'email')
      .sort({ paymentDate: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordCreditPayment = async (req, res) => {
  try {
    const {
      creditTransactionId,
      amount,
      paymentMethod = 'bank_transfer',
      referenceNumber,
      bankName,
      notes = '',
      attachments = []
    } = req.body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      });
    }

    const tx = await CreditTransaction.findById(creditTransactionId);
    if (!tx) {
      return res.status(404).json({ success: false, message: 'Credit transaction not found' });
    }

    const paymentCode = await generateCode('PAY', CreditPayment, 'paymentCode');

    const payment = new CreditPayment({
      paymentCode,
      creditTransactionId,
      supplierId: tx.supplierId,
      paymentDate: new Date(),
      amount: paymentAmount,
      paymentMethod,
      referenceNumber,
      bankName,
      recordedBy: req.user._id,
      status: 'completed',
      notes
    });

    await withTransaction(async (session) => {
      const opts = session ? { session } : {};
      await payment.save(opts);

      tx.debitAmount = Number((tx.debitAmount + paymentAmount).toFixed(2));
      tx.balance = Math.max(0, Number((tx.creditAmount - tx.debitAmount).toFixed(2)));
      tx.paymentStatus = tx.balance <= 0 ? 'paid' : 'partially_paid';
      await tx.save(opts);
    });

    // Universal Evidence Table Attachment for Bank Deposit Slip / Transfer Receipt
    if (attachments.length > 0 || req.files?.length > 0) {
      const filesToAttach = req.files?.length > 0 ? req.files : attachments;
      await attachFilesToEvidence({
        entityType: 'CreditPayment',
        entityId: payment._id,
        files: filesToAttach,
        user: req.user,
        title: `Payment ${payment.paymentCode} Bank Deposit / Transfer Advice`,
        description: `Reference: ${payment.referenceNumber || 'N/A'}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Supplier payment recorded and ledger updated successfully',
      data: { payment, transaction: tx }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. Tax Configurations
// ==========================================

export const getTaxConfigurations = async (req, res) => {
  try {
    const taxes = await TaxConfiguration.find().sort({ rate: 1 });
    res.json({ success: true, count: taxes.length, data: taxes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTaxConfiguration = async (req, res) => {
  try {
    const tax = new TaxConfiguration(req.body);
    await tax.save();
    res.status(201).json({ success: true, data: tax });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTaxConfiguration = async (req, res) => {
  try {
    const tax = await TaxConfiguration.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!tax) {
      return res.status(404).json({ success: false, message: 'Tax configuration not found' });
    }
    res.json({ success: true, data: tax });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
