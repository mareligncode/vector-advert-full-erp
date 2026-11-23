import mongoose from 'mongoose';
import {
  UNIT_ENUM,
  ITEM_TYPE_ENUM,
  STOCK_STATUS_ENUM
} from '../constants/inventoryEnums.js';

const stockItemSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    itemType: {
      type: String,
      enum: ITEM_TYPE_ENUM,
      default: 'inventory',
      required: true
    },
    unit: {
      type: String,
      enum: UNIT_ENUM,
      required: true
    },
    baseUnit: {
      type: String,
      enum: UNIT_ENUM,
      required: true
    },
    multiplierNumerator: {
      type: Number,
      required: true,
      default: 1,
      min: 0.000001
    },
    multiplierDenominator: {
      type: Number,
      required: true,
      default: 1,
      min: 0.000001
    },
    multiplier: {
      type: Number,
      required: true,
      default: 1,
      min: 0.000001
    },
    reorderLevelQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    reorderLevelTotalQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    minimumStockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    minimumStockTotalQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    maximumStockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    maximumStockTotalQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    unitCost: {
      type: Number,
      default: 0,
      min: 0
    },
    averageUnitCost: {
      type: Number,
      default: 0,
      min: 0
    },
    defaultWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse'
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    stockStatus: {
      type: String,
      enum: STOCK_STATUS_ENUM,
      default: 'out_of_stock',
      index: true
    },
    autoRegisteredFromGRV: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.StockItem || mongoose.model('StockItem', stockItemSchema);
