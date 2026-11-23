import mongoose from 'mongoose';

const bidItemSchema = new mongoose.Schema(
  {
    auctionItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    taxRate: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    _id: true
  }
);

const bidSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    bidNumber: {
      type: String,
      trim: true
    },
    submissionDate: {
      type: Date,
      default: Date.now
    },
    subtotal: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    deliveryCost: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    deliveryTime: {
      type: String
    },
    paymentTerms: {
      type: String
    },
    status: {
      type: String,
      enum: ['submitted', 'shortlisted', 'accepted', 'rejected'],
      default: 'submitted'
    },
    items: [bidItemSchema]
  },
  {
    _id: true
  }
);

const auctionItemSchema = new mongoose.Schema(
  {
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem'
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String
    },
    baseUnit: {
      type: String
    },
    multiplier: {
      type: Number,
      default: 1
    },
    totalQuantity: {
      type: Number,
      default: 0
    },
    estimatedUnitPrice: {
      type: Number,
      default: 0
    },
    estimatedTotalPrice: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    _id: true
  }
);

const purchaserAuctionSchema = new mongoose.Schema(
  {
    auctionCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    purchaseRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseRequest',
      required: true
    },
    auctionTitle: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    items: [auctionItemSchema],
    invitedSuppliers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
      }
    ],
    bids: [bidSchema],
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'awarded', 'cancelled'],
      default: 'draft'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.PurchaserAuction ||
  mongoose.model('PurchaserAuction', purchaserAuctionSchema);
