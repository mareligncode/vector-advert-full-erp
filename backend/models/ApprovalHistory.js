import mongoose from 'mongoose';

const approvalHistorySchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      required: true,
      enum: [
        'StaffRequest',
        'PurchaseRequest',
        'PurchaseOrder',
        'GoodsReceivedVoucher',
        'StoreIssueVoucher',
        'StockTransfer',
        'StockAdjustment',
        'CreditPayment'
      ],
      index: true
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'submitted',
        'approved',
        'rejected',
        'partially_approved',
        'returned_for_revision',
        'cancelled'
      ]
    },
    previousStatus: {
      type: String
    },
    newStatus: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String
    },
    comment: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true
  }
);

approvalHistorySchema.index({ documentType: 1, documentId: 1, timestamp: -1 });

export default mongoose.models.ApprovalHistory || mongoose.model('ApprovalHistory', approvalHistorySchema);
