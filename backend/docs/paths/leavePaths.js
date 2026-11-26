import { bearerAuthNote, jsonSuccessRef, paginatedListResponse, ROLE_GROUPS, simpleListResponse } from '../components.js';

export const leavePaths = {
  '/api/leave/balances/me': {
    get: {
      tags: ['Leave Management'],
      summary: 'Get leave balance for the logged-in employee',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'year', in: 'query', schema: { type: 'integer', example: 2026 } }],
      responses: {
        200: jsonSuccessRef('Personal leave balance', '#/components/schemas/LeaveBalance'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/leave/balances': {
    get: {
      tags: ['Leave Management'],
      summary: 'List all employee leave balances',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'year', in: 'query', schema: { type: 'integer' } },
        { name: 'department', in: 'query', schema: { type: 'string' } },
        { name: 'employeeId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: paginatedListResponse('Leave balances list', '#/components/schemas/LeaveBalance'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/leave/balances/initialize': {
    post: {
      tags: ['Leave Management'],
      summary: 'Initialize annual leave balances for all eligible employees',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                year: { type: 'integer', example: 2026 },
                carryForwardMax: { type: 'number', default: 5 }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Leave balances initialized', { type: 'object' }),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/leave/balances/{id}': {
    put: {
      tags: ['Leave Management'],
      summary: 'Adjust an employee leave balance record',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                annualLeave: { type: 'object' },
                sickLeave: { type: 'object' },
                casualLeave: { type: 'object' },
                maternityLeave: { type: 'object' },
                paternityLeave: { type: 'object' },
                carriedForwardDays: { type: 'number' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Leave balance updated', '#/components/schemas/LeaveBalance'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/leave/balances/employee/{employeeId}': {
    get: {
      tags: ['Leave Management'],
      summary: 'Get leave balance history for a specific employee',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'employeeId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }],
      responses: {
        200: simpleListResponse('Employee leave balances', '#/components/schemas/LeaveBalance', { includeCount: false }),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/leave/requests': {
    post: {
      tags: ['Leave Management'],
      summary: 'Submit a new leave request',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['leaveType', 'startDate', 'endDate', 'totalLeaveDays', 'requestReason'],
              properties: {
                leaveType: { type: 'string', enum: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other'] },
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
                startDayPeriod: { type: 'string', enum: ['full_day', 'morning', 'afternoon'], default: 'full_day' },
                endDayPeriod: { type: 'string', enum: ['full_day', 'morning', 'afternoon'], default: 'full_day' },
                totalLeaveDays: { type: 'number', example: 3 },
                requestReason: { type: 'string' },
                supportingAttachments: { type: 'array', items: { type: 'object' } },
                employeeId: { $ref: '#/components/schemas/ObjectId', description: 'Optional HR Admin override' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Leave request submitted', '#/components/schemas/LeaveRequest'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    },
    get: {
      tags: ['Leave Management'],
      summary: 'List all leave requests with filters',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'leaveType', in: 'query', schema: { type: 'string' } },
        { name: 'department', in: 'query', schema: { type: 'string' } },
        { name: 'employeeId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
      ],
      responses: {
        200: paginatedListResponse('Leave requests list', '#/components/schemas/LeaveRequest'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/leave/requests/me': {
    get: {
      tags: ['Leave Management'],
      summary: 'List logged-in employee leave requests',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'leaveType', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: paginatedListResponse('Personal leave requests', '#/components/schemas/LeaveRequest')
      }
    }
  },
  '/api/leave/requests/{id}': {
    get: {
      tags: ['Leave Management'],
      summary: 'Get leave request details',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Leave request details', '#/components/schemas/LeaveRequest'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/leave/requests/{id}/review': {
    patch: {
      tags: ['Leave Management'],
      summary: 'Approve or reject leave request (Manager -> HR workflow)',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['action'],
              properties: {
                action: { type: 'string', enum: ['approved', 'rejected'] },
                comments: { type: 'string' },
                stage: { type: 'string', enum: ['manager', 'hr'] },
                bypassDoubleApproval: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Leave request reviewed', '#/components/schemas/LeaveRequest'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/leave/requests/{id}/cancel': {
    post: {
      tags: ['Leave Management'],
      summary: 'Cancel a leave request',
      description: bearerAuthNote() + ' Permitted for request owner or HR Admin roles.',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { cancellationReason: { type: 'string' } }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Leave request cancelled', '#/components/schemas/LeaveRequest'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  }
};
