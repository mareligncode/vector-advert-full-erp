import { ROLES } from '../../constants/roles.js';
import { bearerAuthNote, jsonSuccessRef, paginatedListResponse, ROLE_GROUPS, simpleListResponse } from '../components.js';

const PURCHASING_ROLES = [ROLES.PURCHASING, ...ROLE_GROUPS.MANAGEMENT];
const STORE_ROLES = [ROLES.STORE_KEEPER, ...ROLE_GROUPS.MANAGEMENT];
const STORE_OR_PURCHASING = [ROLES.STORE_KEEPER, ROLES.PURCHASING, ...ROLE_GROUPS.MANAGEMENT];
const CREDIT_VIEW_ROLES = [ROLES.FINANCE, ROLES.PURCHASING, ...ROLE_GROUPS.MANAGEMENT];
const FINANCE_OPS_ROLES = [ROLES.FINANCE, ...ROLE_GROUPS.MANAGEMENT];

export const supplyChainPaths = {
  // ======================== GRV (GOODS RECEIVING VOUCHERS) ========================
  '/api/grv': {
    get: {
      tags: ['GRV'],
      summary: 'List Goods Receiving Vouchers',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/GrvStatusEnum' } },
        { name: 'warehouseId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'supplierId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'purchaserId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: paginatedListResponse('GRV list', '#/components/schemas/GRV', { includeCount: true })
      }
    },
    post: {
      tags: ['GRV'],
      summary: 'Create a Goods Receiving Voucher (pending store acceptance)',
      description: bearerAuthNote(PURCHASING_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['supplierId', 'warehouseId', 'supplierInvoiceNumber', 'items'],
              properties: {
                purchaseOrderId: { $ref: '#/components/schemas/ObjectId' },
                supplierId: { $ref: '#/components/schemas/ObjectId' },
                warehouseId: { $ref: '#/components/schemas/ObjectId' },
                supplierInvoiceNumber: { type: 'string' },
                deliveryNoteNumber: { type: 'string' },
                deliveryStatus: { $ref: '#/components/schemas/DeliveryStatusEnum' },
                deliveryStatusRemarks: { type: 'string' },
                items: { type: 'array', items: { type: 'object' } },
                notes: { type: 'string' },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('GRV created', '#/components/schemas/GRV'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/grv/{id}': {
    get: {
      tags: ['GRV'],
      summary: 'Get GRV details with Evidence attachments',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('GRV details', '#/components/schemas/GRV'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    put: {
      tags: ['GRV'],
      summary: 'Modify GRV prior to store acceptance',
      description: bearerAuthNote(PURCHASING_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GRV' } } } },
      responses: {
        200: jsonSuccessRef('GRV updated', '#/components/schemas/GRV'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/grv/{id}/accept': {
    put: {
      tags: ['GRV'],
      summary: 'Storekeeper accepts GRV, increasing StockBalance & recording StockMovement',
      description: bearerAuthNote(STORE_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                storeKeeperComment: { type: 'string' },
                deliveryStatus: { $ref: '#/components/schemas/DeliveryStatusEnum' },
                deliveryStatusRemarks: { type: 'string' },
                items: { type: 'array', items: { type: 'object' } },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('GRV accepted', '#/components/schemas/GRV'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/grv/{id}/reject': {
    put: {
      tags: ['GRV'],
      summary: 'Storekeeper rejects GRV delivery',
      description: bearerAuthNote(STORE_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                storeKeeperComment: { type: 'string' },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('GRV rejected', '#/components/schemas/GRV'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },

  // ======================== STORE REQUESTS, SIV, RETURNS & WASTE ========================
  '/api/store-requests/requests': {
    get: {
      tags: ['Store Requests & SIV'],
      summary: 'List staff store requisition requests',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        { name: 'requestType', in: 'query', schema: { $ref: '#/components/schemas/RequestTypeEnum' } },
        { name: 'approvalStatus', in: 'query', schema: { $ref: '#/components/schemas/ApprovalStatusEnum' } },
        { name: 'issuedStatus', in: 'query', schema: { type: 'string' } },
        { name: 'requestedBy', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: paginatedListResponse('Store requests list', '#/components/schemas/StaffStoreRequest', { includeCount: true })
      }
    },
    post: {
      tags: ['Store Requests & SIV'],
      summary: 'Submit a new store material requisition request',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['items'],
              properties: {
                requestType: { $ref: '#/components/schemas/RequestTypeEnum' },
                jobOrderId: { type: 'string', description: 'Required when `requestType` is `workshop`' },
                departmentId: { type: 'string' },
                workshopId: { type: 'string' },
                warehouseId: { $ref: '#/components/schemas/ObjectId' },
                requiredDate: { type: 'string', format: 'date' },
                purpose: { type: 'string' },
                items: { type: 'array', items: { type: 'object' } },
                notes: { type: 'string' },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Store request submitted', '#/components/schemas/StaffStoreRequest'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/api/store-requests/requests/{id}': {
    get: {
      tags: ['Store Requests & SIV'],
      summary: 'Get store request details with Evidence attachments',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Store request details', '#/components/schemas/StaffStoreRequest'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/store-requests/requests/{id}/approve': {
    put: {
      tags: ['Store Requests & SIV'],
      summary: 'Approve store request quantities',
      description: bearerAuthNote(STORE_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { $ref: '#/components/schemas/ObjectId' },
                      approvedQuantity: { type: 'number' },
                      approvalStatus: { type: 'string' },
                      rejectionReason: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Store request approved', '#/components/schemas/StaffStoreRequest'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/store-requests/requests/{id}/reject': {
    put: {
      tags: ['Store Requests & SIV'],
      summary: 'Reject store request',
      description: bearerAuthNote(STORE_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { type: 'object', properties: { rejectionReason: { type: 'string' } } }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Store request rejected', '#/components/schemas/StaffStoreRequest'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/store-requests/siv': {
    get: {
      tags: ['Store Requests & SIV'],
      summary: 'List Store Issue Vouchers (SIV)',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        { name: 'warehouseId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'staffRequestId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: paginatedListResponse('SIV list', '#/components/schemas/SIV', { includeCount: true })
      }
    },
    post: {
      tags: ['Store Requests & SIV'],
      summary: 'Issue stock items against a store request (creates SIV & deducts balance)',
      description: bearerAuthNote(STORE_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['staffRequestId', 'items'],
              properties: {
                staffRequestId: { $ref: '#/components/schemas/ObjectId' },
                warehouseId: { $ref: '#/components/schemas/ObjectId' },
                receivedBy: { $ref: '#/components/schemas/ObjectId' },
                items: { type: 'array', items: { type: 'object' } },
                notes: { type: 'string' },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('SIV issued', '#/components/schemas/SIV'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/store-requests/siv/{id}': {
    get: {
      tags: ['Store Requests & SIV'],
      summary: 'Get SIV details with Evidence attachments',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('SIV details', '#/components/schemas/SIV'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/store-requests/returns': {
    get: {
      tags: ['Store Requests & SIV'],
      summary: 'List staff store material returns',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: { 200: simpleListResponse('Store returns', '#/components/schemas/StoreReturn') }
    },
    post: {
      tags: ['Store Requests & SIV'],
      summary: 'Return issued materials back to warehouse stock',
      description: bearerAuthNote(STORE_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StoreReturn' } } } },
      responses: {
        201: jsonSuccessRef('Store return recorded', '#/components/schemas/StoreReturn'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/store-requests/supplier-returns': {
    get: {
      tags: ['Store Requests & SIV'],
      summary: 'List supplier returns (defective/excess deliveries)',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: { 200: simpleListResponse('Supplier returns', '#/components/schemas/SupplierReturn') }
    },
    post: {
      tags: ['Store Requests & SIV'],
      summary: 'Record a return of goods to supplier',
      description: bearerAuthNote(STORE_OR_PURCHASING),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SupplierReturn' } } } },
      responses: {
        201: jsonSuccessRef('Supplier return recorded', '#/components/schemas/SupplierReturn'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/store-requests/waste': {
    get: {
      tags: ['Store Requests & SIV'],
      summary: 'List material waste/spoilage records',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: { 200: simpleListResponse('Waste records', '#/components/schemas/WasteRecord') }
    },
    post: {
      tags: ['Store Requests & SIV'],
      summary: 'Record damaged/expired material waste & deduct inventory',
      description: bearerAuthNote(STORE_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WasteRecord' } } } },
      responses: {
        201: jsonSuccessRef('Waste record created', '#/components/schemas/WasteRecord'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },

  // ======================== PROCUREMENT ========================
  '/api/procurement/requests': {
    get: {
      tags: ['Procurement'],
      summary: 'List purchase requests',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        { name: 'approvalStatus', in: 'query', schema: { $ref: '#/components/schemas/ApprovalStatusEnum' } },
        { name: 'procurementStatus', in: 'query', schema: { type: 'string' } },
        { name: 'requestedBy', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: paginatedListResponse('Purchase requests', '#/components/schemas/PurchaseRequest', { includeCount: true })
      }
    },
    post: {
      tags: ['Procurement'],
      summary: 'Submit a new purchase request',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['items'],
              properties: {
                departmentId: { type: 'string' },
                requestType: { $ref: '#/components/schemas/RequestTypeEnum' },
                jobOrderId: { type: 'string' },
                requiredDate: { type: 'string', format: 'date' },
                purpose: { type: 'string' },
                items: { type: 'array', items: { type: 'object' } },
                notes: { type: 'string' },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Purchase request submitted', '#/components/schemas/PurchaseRequest'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/api/procurement/requests/{id}': {
    get: {
      tags: ['Procurement'],
      summary: 'Get purchase request details with Evidence attachments',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Purchase request details', '#/components/schemas/PurchaseRequest'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/procurement/requests/{id}/approve': {
    put: {
      tags: ['Procurement'],
      summary: 'Approve a purchase request',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Purchase request approved', '#/components/schemas/PurchaseRequest'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/procurement/requests/{id}/reject': {
    put: {
      tags: ['Procurement'],
      summary: 'Reject a purchase request',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: { 'application/json': { schema: { type: 'object', properties: { rejectionReason: { type: 'string' } } } } }
      },
      responses: {
        200: jsonSuccessRef('Purchase request rejected', '#/components/schemas/PurchaseRequest'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/procurement/assignments': {
    get: {
      tags: ['Procurement'],
      summary: 'List purchaser buyer assignments',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'assignedTo', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'status', in: 'query', schema: { type: 'string' } }
      ],
      responses: { 200: simpleListResponse('Purchase assignments', '#/components/schemas/PurchaseAssignment') }
    },
    post: {
      tags: ['Procurement'],
      summary: 'Assign a purchase request to a purchasing officer',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['purchaseRequestId', 'assignedTo'],
              properties: {
                purchaseRequestId: { $ref: '#/components/schemas/ObjectId' },
                assignedTo: { $ref: '#/components/schemas/ObjectId' },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
                dueDate: { type: 'string', format: 'date-time' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Purchase assignment created', '#/components/schemas/PurchaseAssignment'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/procurement/assignments/{id}/status': {
    put: {
      tags: ['Procurement'],
      summary: 'Update purchaser assignment status',
      description: bearerAuthNote(PURCHASING_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Assignment status updated', '#/components/schemas/PurchaseAssignment'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/procurement/comparisons': {
    get: {
      tags: ['Procurement'],
      summary: 'List vendor price comparison sheets',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: { 200: simpleListResponse('Vendor price comparisons', '#/components/schemas/VendorPriceComparison') }
    },
    post: {
      tags: ['Procurement'],
      summary: 'Create a vendor price comparison / proforma evaluation',
      description: bearerAuthNote(PURCHASING_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VendorPriceComparison' } } } },
      responses: {
        201: jsonSuccessRef('Comparison created', '#/components/schemas/VendorPriceComparison'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/procurement/comparisons/{id}': {
    get: {
      tags: ['Procurement'],
      summary: 'Get vendor price comparison details',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Comparison details', '#/components/schemas/VendorPriceComparison'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/procurement/comparisons/{id}/approve': {
    put: {
      tags: ['Procurement'],
      summary: 'Approve vendor price comparison and select winning supplier',
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
                selectedSupplierId: { $ref: '#/components/schemas/ObjectId' },
                selectionReason: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Comparison approved', '#/components/schemas/VendorPriceComparison'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/procurement/orders': {
    get: {
      tags: ['Procurement'],
      summary: 'List Purchase Orders (PO)',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'supplierId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'warehouseId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: paginatedListResponse('Purchase orders', '#/components/schemas/PurchaseOrder', { includeCount: true })
      }
    },
    post: {
      tags: ['Procurement'],
      summary: 'Create a Purchase Order',
      description: bearerAuthNote(PURCHASING_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['supplierId', 'warehouseId', 'items'],
              properties: {
                purchaseRequestId: { $ref: '#/components/schemas/ObjectId' },
                comparisonId: { $ref: '#/components/schemas/ObjectId' },
                supplierId: { $ref: '#/components/schemas/ObjectId' },
                warehouseId: { $ref: '#/components/schemas/ObjectId' },
                expectedDeliveryDate: { type: 'string', format: 'date-time' },
                paymentTerms: { type: 'string' },
                items: { type: 'array', items: { type: 'object' } },
                subtotal: { type: 'number' },
                taxAmount: { type: 'number' },
                deliveryCost: { type: 'number' },
                discount: { type: 'number' },
                totalAmount: { type: 'number' },
                notes: { type: 'string' },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Purchase order created', '#/components/schemas/PurchaseOrder'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/procurement/orders/{id}': {
    get: {
      tags: ['Procurement'],
      summary: 'Get Purchase Order details with Evidence attachments',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Purchase order details', '#/components/schemas/PurchaseOrder'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/procurement/auctions': {
    get: {
      tags: ['Procurement'],
      summary: 'List supplier tenders/auctions',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: { 200: simpleListResponse('Auctions list', '#/components/schemas/Auction') }
    },
    post: {
      tags: ['Procurement'],
      summary: 'Create a supplier tender/auction',
      description: bearerAuthNote(PURCHASING_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Auction' } } } },
      responses: {
        201: jsonSuccessRef('Auction created', '#/components/schemas/Auction'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/procurement/auctions/{id}/bids': {
    post: {
      tags: ['Procurement'],
      summary: 'Submit a supplier bid to an auction',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: {
        200: jsonSuccessRef('Bid submitted', '#/components/schemas/Auction'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },

  // ======================== SUPPLIERS, CREDITS, PAYMENTS & TAXES ========================
  '/api/supplier-credits/suppliers': {
    get: {
      tags: ['Supplier Credits'],
      summary: 'List registered suppliers',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/GeneralStatusEnum' } }
      ],
      responses: { 200: simpleListResponse('Suppliers list', '#/components/schemas/Supplier') }
    },
    post: {
      tags: ['Supplier Credits'],
      summary: 'Register a new supplier',
      description: bearerAuthNote(PURCHASING_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Supplier' } } } },
      responses: {
        201: jsonSuccessRef('Supplier created', '#/components/schemas/Supplier'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/supplier-credits/suppliers/{id}': {
    get: {
      tags: ['Supplier Credits'],
      summary: 'Get supplier details with credit transactions and Evidence',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Supplier details', '#/components/schemas/Supplier'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    put: {
      tags: ['Supplier Credits'],
      summary: 'Update supplier details',
      description: bearerAuthNote(PURCHASING_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Supplier' } } } },
      responses: {
        200: jsonSuccessRef('Supplier updated', '#/components/schemas/Supplier'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    delete: {
      tags: ['Supplier Credits'],
      summary: 'Delete supplier',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: 'Supplier deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/supplier-credits/credits': {
    get: {
      tags: ['Supplier Credits'],
      summary: 'List supplier payable credit transactions',
      description: bearerAuthNote(CREDIT_VIEW_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        { name: 'supplierId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'paymentStatus', in: 'query', schema: { $ref: '#/components/schemas/PaymentStatusEnum' } }
      ],
      responses: {
        200: paginatedListResponse('Supplier credits', '#/components/schemas/SupplierCreditTransaction', { includeCount: true }),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/supplier-credits/credits/{id}': {
    get: {
      tags: ['Supplier Credits'],
      summary: 'Get supplier credit transaction details',
      description: bearerAuthNote(CREDIT_VIEW_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Credit transaction details', '#/components/schemas/SupplierCreditTransaction'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/supplier-credits/payments': {
    get: {
      tags: ['Supplier Credits'],
      summary: 'List supplier payment settlements',
      description: bearerAuthNote(FINANCE_OPS_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'supplierId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'creditTransactionId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: simpleListResponse('Supplier payments', '#/components/schemas/SupplierPayment'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    post: {
      tags: ['Supplier Credits'],
      summary: 'Record a payment against a supplier credit balance',
      description: bearerAuthNote(FINANCE_OPS_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['creditTransactionId', 'amount'],
              properties: {
                creditTransactionId: { $ref: '#/components/schemas/ObjectId' },
                amount: { type: 'number', minimum: 0.01 },
                paymentMethod: { type: 'string', enum: ['bank_transfer', 'cash', 'cheque', 'mobile_money'], default: 'bank_transfer' },
                referenceNumber: { type: 'string' },
                bankName: { type: 'string' },
                notes: { type: 'string' },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Supplier payment recorded', '#/components/schemas/SupplierPayment'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/supplier-credits/taxes': {
    get: {
      tags: ['Supplier Credits'],
      summary: 'List tax definitions (VAT, withholding, etc.)',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: { 200: simpleListResponse('Tax rules', '#/components/schemas/TaxRecord') }
    },
    post: {
      tags: ['Supplier Credits'],
      summary: 'Create a tax configuration record',
      description: bearerAuthNote(FINANCE_OPS_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TaxRecord' } } } },
      responses: {
        201: jsonSuccessRef('Tax rule created', '#/components/schemas/TaxRecord'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/supplier-credits/taxes/{id}': {
    put: {
      tags: ['Supplier Credits'],
      summary: 'Update tax configuration record',
      description: bearerAuthNote(FINANCE_OPS_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TaxRecord' } } } },
      responses: {
        200: jsonSuccessRef('Tax rule updated', '#/components/schemas/TaxRecord'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  }
};
