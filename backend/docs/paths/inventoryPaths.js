import { ROLES } from '../../constants/roles.js';
import { bearerAuthNote, jsonSuccessRef, paginatedListResponse, ROLE_GROUPS, simpleListResponse } from '../components.js';

const ITEM_WRITE_ROLES = [ROLES.STORE_KEEPER, ROLES.PURCHASING, ...ROLE_GROUPS.MANAGEMENT];
const STORE_OPS_ROLES = [ROLES.STORE_KEEPER, ...ROLE_GROUPS.MANAGEMENT];

export const inventoryPaths = {
  // ======================== STOCK ITEMS ========================
  '/api/inventory/items': {
    get: {
      tags: ['Inventory'],
      summary: 'List catalog stock items',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        { name: 'category', in: 'query', schema: { type: 'string' } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'stockStatus', in: 'query', schema: { $ref: '#/components/schemas/StockStatusEnum' } },
        { name: 'itemType', in: 'query', schema: { $ref: '#/components/schemas/ItemTypeEnum' } }
      ],
      responses: {
        200: paginatedListResponse('Stock items catalog', '#/components/schemas/StockItem', { includeCount: true })
      }
    },
    post: {
      tags: ['Inventory'],
      summary: 'Create a catalog stock item',
      description: bearerAuthNote(ITEM_WRITE_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'category', 'unit', 'baseUnit'],
              properties: {
                code: { type: 'string', description: 'Auto-generated as `STK-*` if omitted' },
                name: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                itemType: { $ref: '#/components/schemas/ItemTypeEnum' },
                unit: { $ref: '#/components/schemas/UnitEnum' },
                baseUnit: { $ref: '#/components/schemas/UnitEnum' },
                multiplierNumerator: { type: 'number', default: 1 },
                multiplierDenominator: { type: 'number', default: 1 },
                reorderLevelQuantity: { type: 'number', default: 0 },
                minimumStockQuantity: { type: 'number', default: 0 },
                maximumStockQuantity: { type: 'number', default: 0 },
                unitCost: { type: 'number', default: 0 },
                defaultWarehouseId: { $ref: '#/components/schemas/ObjectId' },
                supplierId: { $ref: '#/components/schemas/ObjectId' },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Stock item created', '#/components/schemas/StockItem'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/inventory/items/{id}': {
    get: {
      tags: ['Inventory'],
      summary: 'Get stock item details with warehouse balances and Evidence attachments',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Stock item details', '#/components/schemas/StockItem'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    put: {
      tags: ['Inventory'],
      summary: 'Update stock item properties',
      description: bearerAuthNote(ITEM_WRITE_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StockItem' } } } },
      responses: {
        200: jsonSuccessRef('Stock item updated', '#/components/schemas/StockItem'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    delete: {
      tags: ['Inventory'],
      summary: 'Delete stock item (only if zero stock on hand)',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: 'Stock item deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },

  // ======================== BALANCES & MOVEMENTS ========================
  '/api/inventory/balances': {
    get: {
      tags: ['Inventory'],
      summary: 'Query real-time stock balances per warehouse/bin',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'warehouseId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'stockItemId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'lowStock', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } }
      ],
      responses: {
        200: simpleListResponse('Stock balances', '#/components/schemas/StockBalance')
      }
    }
  },
  '/api/inventory/movements': {
    get: {
      tags: ['Inventory'],
      summary: 'Query stock ledger movement history',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        { name: 'stockItemId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'warehouseId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'movementType', in: 'query', schema: { $ref: '#/components/schemas/StockMovementTypeEnum' } },
        { name: 'referenceType', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: paginatedListResponse('Stock movement ledger', '#/components/schemas/StockMovement', { includeCount: true })
      }
    }
  },

  // ======================== WAREHOUSES, LOCATIONS & UNITS ========================
  '/api/inventory/warehouses': {
    get: {
      tags: ['Inventory'],
      summary: 'List warehouses',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: { 200: simpleListResponse('Warehouses', '#/components/schemas/Warehouse') }
    },
    post: {
      tags: ['Inventory'],
      summary: 'Create a warehouse',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Warehouse' } } } },
      responses: {
        201: jsonSuccessRef('Warehouse created', '#/components/schemas/Warehouse'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/inventory/warehouses/{id}': {
    put: {
      tags: ['Inventory'],
      summary: 'Update warehouse details',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Warehouse' } } } },
      responses: {
        200: jsonSuccessRef('Warehouse updated', '#/components/schemas/Warehouse'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    delete: {
      tags: ['Inventory'],
      summary: 'Delete warehouse (when empty)',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: 'Warehouse deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/inventory/locations': {
    get: {
      tags: ['Inventory'],
      summary: 'List warehouse rack/shelf/bin locations',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'warehouseId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } }],
      responses: { 200: simpleListResponse('Warehouse locations', '#/components/schemas/WarehouseLocation') }
    },
    post: {
      tags: ['Inventory'],
      summary: 'Create warehouse location',
      description: bearerAuthNote(STORE_OPS_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WarehouseLocation' } } } },
      responses: {
        201: jsonSuccessRef('Warehouse location created', '#/components/schemas/WarehouseLocation'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/inventory/locations/{id}': {
    put: {
      tags: ['Inventory'],
      summary: 'Update warehouse location',
      description: bearerAuthNote(STORE_OPS_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WarehouseLocation' } } } },
      responses: {
        200: jsonSuccessRef('Location updated', '#/components/schemas/WarehouseLocation'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/inventory/units': {
    get: {
      tags: ['Inventory'],
      summary: 'List units of measure',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: { 200: simpleListResponse('Units of measure', '#/components/schemas/UnitOfMeasure') }
    },
    post: {
      tags: ['Inventory'],
      summary: 'Create unit of measure',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UnitOfMeasure' } } } },
      responses: {
        201: jsonSuccessRef('Unit created', '#/components/schemas/UnitOfMeasure'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },

  // ======================== ADJUSTMENTS, TRANSFERS & COUNTS ========================
  '/api/inventory/adjustments': {
    get: {
      tags: ['Inventory'],
      summary: 'List stock adjustment requests',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'warehouseId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'status', in: 'query', schema: { type: 'string' } }
      ],
      responses: { 200: simpleListResponse('Stock adjustments', '#/components/schemas/StockAdjustment') }
    },
    post: {
      tags: ['Inventory'],
      summary: 'Create stock adjustment request',
      description: bearerAuthNote(STORE_OPS_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StockAdjustment' } } } },
      responses: {
        201: jsonSuccessRef('Stock adjustment created', '#/components/schemas/StockAdjustment'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/inventory/adjustments/{id}/approve': {
    put: {
      tags: ['Inventory'],
      summary: 'Approve stock adjustment and update StockBalance/StockMovement atomically',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                approvalComment: { type: 'string' },
                comments: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Adjustment approved', '#/components/schemas/StockAdjustment'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/inventory/adjustments/{id}/reject': {
    put: {
      tags: ['Inventory'],
      summary: 'Reject a pending stock adjustment request with reason',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                rejectionReason: { type: 'string' },
                comments: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Adjustment rejected', '#/components/schemas/StockAdjustment'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/inventory/transfers': {
    get: {
      tags: ['Inventory'],
      summary: 'List inter-warehouse stock transfers',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'sourceWarehouseId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'destinationWarehouseId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'status', in: 'query', schema: { type: 'string' } }
      ],
      responses: { 200: simpleListResponse('Stock transfers', '#/components/schemas/StockTransfer') }
    },
    post: {
      tags: ['Inventory'],
      summary: 'Create inter-warehouse stock transfer',
      description: bearerAuthNote(STORE_OPS_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StockTransfer' } } } },
      responses: {
        201: jsonSuccessRef('Transfer created', '#/components/schemas/StockTransfer'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/inventory/transfers/{id}/receive': {
    put: {
      tags: ['Inventory'],
      summary: 'Receive stock transfer at destination warehouse',
      description: bearerAuthNote(STORE_OPS_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                receiverComment: { type: 'string' },
                comments: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Transfer received', '#/components/schemas/StockTransfer'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/inventory/counts': {
    get: {
      tags: ['Inventory'],
      summary: 'List physical inventory cycle counts',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: { 200: simpleListResponse('Stock counts', '#/components/schemas/StockCount') }
    },
    post: {
      tags: ['Inventory'],
      summary: 'Create a physical stock count sheet',
      description: bearerAuthNote(STORE_OPS_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StockCount' } } } },
      responses: {
        201: jsonSuccessRef('Stock count created', '#/components/schemas/StockCount'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/inventory/counts/{id}/reconcile': {
    put: {
      tags: ['Inventory'],
      summary: 'Reconcile physical stock count with live warehouse balances',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                approvalComment: { type: 'string' },
                comments: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Stock count reconciled', '#/components/schemas/StockCount'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },

  // ======================== ASSETS & EOD REPORTS ========================
  '/api/inventory/assets': {
    get: {
      tags: ['Inventory'],
      summary: 'List fixed assets & machinery register',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: { 200: simpleListResponse('Assets register', '#/components/schemas/AssetRegister') }
    },
    post: {
      tags: ['Inventory'],
      summary: 'Register a new fixed asset',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetRegister' } } } },
      responses: {
        201: jsonSuccessRef('Asset created', '#/components/schemas/AssetRegister'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/inventory/assets/maintenance/list': {
    get: {
      tags: ['Inventory'],
      summary: 'List asset maintenance logs',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'assetId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } }],
      responses: { 200: simpleListResponse('Asset maintenance logs', '#/components/schemas/AssetMaintenance') }
    }
  },
  '/api/inventory/assets/maintenance': {
    post: {
      tags: ['Inventory'],
      summary: 'Record an asset maintenance activity',
      description: bearerAuthNote(STORE_OPS_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetMaintenance' } } } },
      responses: {
        201: jsonSuccessRef('Maintenance recorded', '#/components/schemas/AssetMaintenance'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/inventory/assets/{id}': {
    get: {
      tags: ['Inventory'],
      summary: 'Get asset details with maintenance logs and Evidence docs',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Asset details', '#/components/schemas/AssetRegister'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    put: {
      tags: ['Inventory'],
      summary: 'Update asset details',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetRegister' } } } },
      responses: {
        200: jsonSuccessRef('Asset updated', '#/components/schemas/AssetRegister'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/inventory/eod-reports': {
    get: {
      tags: ['Inventory'],
      summary: 'List End-of-Day store movement summary reports',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'warehouseId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } }],
      responses: { 200: simpleListResponse('End of Day reports', '#/components/schemas/EndOfDayReport') }
    },
    post: {
      tags: ['Inventory'],
      summary: 'Generate an End-of-Day warehouse movement report',
      description: bearerAuthNote(STORE_OPS_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['warehouseId'],
              properties: {
                warehouseId: { $ref: '#/components/schemas/ObjectId' },
                reportDate: { type: 'string', format: 'date' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('End of Day report generated', '#/components/schemas/EndOfDayReport'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  }
};
