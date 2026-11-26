export const UNIT_ENUM = [
  'pcs',
  'meter_square',
  'roll',
  'meter',
  'gram',
  'liter',
  'set',
  'pack',
  'centimeter',
  'gallon',
  'box',
  'sheet',
  'milimeter'
];

export const REQUEST_TYPE_ENUM = ['office', 'workshop', 'store_replenishment','external'];

export const ITEM_TYPE_ENUM = ['inventory', 'non_inventory', 'service'];

export const GENERAL_STATUS_ENUM = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'partially_approved',
  'completed',
  'cancelled'
];

export const GRV_STATUS_ENUM = [
  'draft',
  'pending_store_acceptance',
  'partially_accepted',
  'accepted',
  'rejected',
  'cancelled'
];

export const DELIVERY_STATUS_ENUM = [
  'fully_delivered',
  'partially_delivered',
  'over_delivered',
  'not_delivered'
];

export const STOCK_STATUS_ENUM = [
  'in_stock',
  'low_stock',
  'out_of_stock',
  'overstock',
  'discontinued'
];

export const APPROVAL_STATUS_ENUM = [
  'pending',
  'approved',
  'rejected',
  'returned_for_revision',
  'partially_approved'
];

export const PAYMENT_STATUS_ENUM = ['unpaid', 'partially_paid', 'paid', 'overdue'];

export const ITEM_CONDITION_ENUM = ['new', 'good', 'damaged', 'defective', 'expired'];

export const STOCK_MOVEMENT_TYPE_ENUM = [
  'grv_receipt',
  'siv_issue',
  'staff_return',
  'supplier_return',
  'transfer_in',
  'transfer_out',
  'adjustment_plus',
  'adjustment_minus',
  'waste',
  'initial_balance'
];

export const ADJUSTMENT_TYPE_ENUM = [
  'damage',
  'expiration',
  'theft_loss',
  'count_discrepancy',
  'data_correction',
  'revaluation'
];
