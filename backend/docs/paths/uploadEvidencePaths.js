import { bearerAuthNote, jsonSuccessRef, paginatedListResponse, ROLE_GROUPS } from '../components.js';

export const uploadEvidencePaths = {
  // ======================== FILE UPLOADS ========================
  '/api/upload/single': {
    post: {
      tags: ['Uploads & Evidence'],
      summary: 'Upload a single file to `/uploads/<category>/`',
      description: 'Max file size: 20 MB. Allowed formats: `jpeg, jpg, png, webp, gif, pdf, doc, docx, xls, xlsx, ppt, pptx, txt, zip, rar`.',
      security: [{ bearerAuth: [] }, {}],
      parameters: [
        {
          name: 'category',
          in: 'query',
          required: false,
          description: 'Target subdirectory under `/uploads` (e.g. `attachments`, `employees`, `attendance`, `recruitment`)',
          schema: { type: 'string', default: 'attachments' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: { type: 'string', format: 'binary' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('File uploaded', '#/components/schemas/UploadResult'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/api/upload/multiple': {
    post: {
      tags: ['Uploads & Evidence'],
      summary: 'Upload up to 10 files to `/uploads/<category>/`',
      security: [{ bearerAuth: [] }, {}],
      parameters: [
        {
          name: 'category',
          in: 'query',
          required: false,
          schema: { type: 'string', default: 'attachments' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['files'],
              properties: {
                files: {
                  type: 'array',
                  maxItems: 10,
                  items: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Files uploaded', {
          type: 'array',
          items: { $ref: '#/components/schemas/UploadResult' }
        }),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },

  // ======================== UNIVERSAL EVIDENCE HUB ========================
  '/api/evidence': {
    get: {
      tags: ['Uploads & Evidence'],
      summary: 'List all polymorphic Evidence containers across modules',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'entityType', in: 'query', schema: { type: 'string' }, description: 'e.g. `GRV`, `SIV`, `StockItem`, `Clearance`' },
        { name: 'entityOwner', in: 'query', schema: { type: 'string' } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'verified', 'rejected'] } }
      ],
      responses: {
        200: paginatedListResponse('Evidence records', '#/components/schemas/Evidence'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/evidence/{entityType}/{entityId}': {
    get: {
      tags: ['Uploads & Evidence'],
      summary: 'Get Evidence container (attachments & audit notes) for any entity',
      description: bearerAuthNote() + ' Returns `data: null` if no evidence exists yet.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'entityType', in: 'path', required: true, schema: { type: 'string', example: 'GRV' } },
        { name: 'entityId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: jsonSuccessRef('Entity evidence record', '#/components/schemas/Evidence')
      }
    }
  },
  '/api/evidence/{entityType}/{entityId}/attachments': {
    post: {
      tags: ['Uploads & Evidence'],
      summary: 'Attach file(s) or evidence URLs to an entity',
      description: bearerAuthNote() + ' Accepts `multipart/form-data` (any file field) or JSON attachment payload.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'entityType', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'entityId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: { type: 'string', format: 'binary' },
                title: { type: 'string' },
                description: { type: 'string' },
                entityOwner: { type: 'string' }
              }
            }
          },
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                fileUrl: { type: 'string' },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Evidence attachment added', '#/components/schemas/Evidence'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/api/evidence/{entityType}/{entityId}/attachments/{attachmentId}/review': {
    patch: {
      tags: ['Uploads & Evidence'],
      summary: 'Verify or reject an uploaded evidence attachment',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'entityType', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'entityId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'attachmentId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['verified', 'rejected', 'pending'] },
                rejectionReason: { type: 'string', description: 'Required when status is `rejected`' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Evidence attachment reviewed', '#/components/schemas/Evidence'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/evidence/{entityType}/{entityId}/attachments/{attachmentId}': {
    delete: {
      tags: ['Uploads & Evidence'],
      summary: 'Delete an evidence attachment',
      description: bearerAuthNote() + ' Permitted for original uploader or Management roles.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'entityType', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'entityId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'attachmentId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: jsonSuccessRef('Attachment removed', '#/components/schemas/Evidence'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/evidence/{entityType}/{entityId}/notes': {
    post: {
      tags: ['Uploads & Evidence'],
      summary: 'Add an audit/review note to an entity Evidence record',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'entityType', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'entityId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['content'],
              properties: {
                content: { type: 'string' },
                entityOwner: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Note added', '#/components/schemas/Evidence'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/api/evidence/{entityType}/{entityId}/notes/{noteId}': {
    delete: {
      tags: ['Uploads & Evidence'],
      summary: 'Delete an audit/review note',
      description: bearerAuthNote() + ' Permitted for note author or Management roles.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'entityType', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'entityId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'noteId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: jsonSuccessRef('Note deleted', '#/components/schemas/Evidence'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  }
};
