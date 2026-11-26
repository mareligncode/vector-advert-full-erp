import { ROLES } from '../../constants/roles.js';
import { bearerAuthNote, jsonSuccessRef, paginatedListResponse, ROLE_GROUPS, simpleListResponse } from '../components.js';

const PAYROLL_VIEW_ROLES = [...ROLE_GROUPS.HR_ADMIN, ROLES.FINANCE, ...ROLE_GROUPS.EXECUTIVE];
const PAYROLL_CONFIG_ROLES = [ROLES.SUPER_ADMIN, ROLES.CEO, ROLES.CAO, ROLES.COO, ROLES.HR_MANAGER, ROLES.FINANCE];
const PAYROLL_APPROVE_ROLES = [...ROLE_GROUPS.MANAGEMENT, ROLES.FINANCE, ...ROLE_GROUPS.EXECUTIVE];
const DISBURSE_ROLES = [ROLES.FINANCE, ROLES.SUPER_ADMIN, ROLES.CEO];

export const payrollPaths = {
  '/api/payroll/analytics/summary': {
    get: {
      tags: ['Payroll'],
      summary: 'Get YTD payroll financial analytics summary',
      description: bearerAuthNote(PAYROLL_VIEW_ROLES),
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonSuccessRef('Payroll analytics summary', {
          type: 'object',
          properties: {
            currentYear: { type: 'integer', example: 2026 },
            activeEmployeesCount: { type: 'integer' },
            totalDisbursedYTD: { type: 'number' },
            totalTaxYTD: { type: 'number' },
            totalPensionYTD: { type: 'number' },
            recentRuns: { type: 'array', items: { $ref: '#/components/schemas/PayrollRun' } }
          }
        }),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/payroll/config': {
    get: {
      tags: ['Payroll'],
      summary: 'Get active payroll rules, tax slabs, pension & overtime multipliers',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonSuccessRef('Active payroll configuration', '#/components/schemas/PayrollConfig')
      }
    },
    put: {
      tags: ['Payroll'],
      summary: 'Update payroll configuration and tax rules',
      description: bearerAuthNote(PAYROLL_CONFIG_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PayrollConfig' } } } },
      responses: {
        200: jsonSuccessRef('Payroll configuration updated', '#/components/schemas/PayrollConfig'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/payroll/structures': {
    get: {
      tags: ['Payroll'],
      summary: 'List employee salary structures',
      description: bearerAuthNote(PAYROLL_VIEW_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'draft', 'superseded'] } },
        { name: 'search', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: paginatedListResponse('Salary structures list', '#/components/schemas/SalaryStructure'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    post: {
      tags: ['Payroll'],
      summary: 'Create or supersede active salary structure for an employee',
      description: bearerAuthNote(PAYROLL_VIEW_ROLES) + ' Also synchronizes `Employee.basicSalary`.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['employeeId', 'baseSalary'],
              properties: {
                employeeId: { $ref: '#/components/schemas/ObjectId' },
                baseSalary: { type: 'number', example: 22000 },
                paymentMethod: { type: 'string', enum: ['bank_transfer', 'cash', 'cheque'], default: 'bank_transfer' },
                bankAccount: { type: 'object' },
                isOvertimeEligible: { type: 'boolean', default: true },
                isPensionEligible: { type: 'boolean', default: true },
                isTaxExempt: { type: 'boolean', default: false },
                earnings: { type: 'array', items: { type: 'object' } },
                deductions: { type: 'array', items: { type: 'object' } },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Salary structure saved', '#/components/schemas/SalaryStructure'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/payroll/structures/employee/{employeeId}': {
    get: {
      tags: ['Payroll'],
      summary: 'Get active salary structure (or default preview) for an employee',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'employeeId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }],
      responses: {
        200: jsonSuccessRef('Employee salary structure', '#/components/schemas/SalaryStructure', { isDefaultPreview: { type: 'boolean' } }),
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/payroll/runs': {
    get: {
      tags: ['Payroll'],
      summary: 'List monthly payroll batch runs',
      description: bearerAuthNote(PAYROLL_VIEW_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'year', in: 'query', schema: { type: 'integer' } },
        { name: 'month', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 12 } },
        { name: 'status', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: paginatedListResponse('Payroll runs list', '#/components/schemas/PayrollRun'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/payroll/runs/{id}': {
    get: {
      tags: ['Payroll'],
      summary: 'Get payroll run details together with all generated payslips',
      description: bearerAuthNote(PAYROLL_VIEW_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Payroll run and child payslips', {
          type: 'object',
          properties: {
            run: { $ref: '#/components/schemas/PayrollRun' },
            payslips: { type: 'array', items: { $ref: '#/components/schemas/Payslip' } }
          }
        }),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    delete: {
      tags: ['Payroll'],
      summary: 'Cancel a non-disbursed payroll run and remove generated payslips',
      description: bearerAuthNote(PAYROLL_VIEW_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: 'Payroll run cancelled', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/payroll/runs/generate': {
    post: {
      tags: ['Payroll'],
      summary: 'Calculate and generate a payroll batch run for a month/year',
      description: bearerAuthNote(PAYROLL_VIEW_ROLES),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['periodMonth', 'periodYear'],
              properties: {
                periodMonth: { type: 'integer', minimum: 1, maximum: 12, example: 11 },
                periodYear: { type: 'integer', example: 2026 },
                title: { type: 'string' },
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
                paymentDate: { type: 'string', format: 'date' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Payroll run generated', '#/components/schemas/PayrollRun'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/payroll/runs/{id}/recalculate': {
    post: {
      tags: ['Payroll'],
      summary: 'Recalculate an un-disbursed payroll batch run',
      description: bearerAuthNote(PAYROLL_VIEW_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Payroll run recalculated', '#/components/schemas/PayrollRun'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/payroll/runs/{id}/approve': {
    post: {
      tags: ['Payroll'],
      summary: 'Approve or reject a payroll run stage (HR -> Finance -> Executive)',
      description: bearerAuthNote(PAYROLL_APPROVE_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['stage', 'decision'],
              properties: {
                stage: { type: 'string', enum: ['hrApproval', 'financeApproval', 'executiveApproval'] },
                decision: { type: 'string', enum: ['approved', 'rejected'] },
                comments: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Payroll approval stage recorded', '#/components/schemas/PayrollRun'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/payroll/runs/{id}/disburse': {
    post: {
      tags: ['Payroll'],
      summary: 'Mark payroll run disbursed, pay payslips, and deduct active loan installments',
      description: bearerAuthNote(DISBURSE_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                sourceBankAccount: { type: 'string' },
                paymentReference: { type: 'string' },
                paymentDate: { type: 'string', format: 'date' },
                proofDocumentUrl: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Payroll run disbursed', '#/components/schemas/PayrollRun'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/payroll/payslips': {
    get: {
      tags: ['Payroll'],
      summary: 'List all payslips across runs',
      description: bearerAuthNote(PAYROLL_VIEW_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'payrollRunId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'employeeId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'paymentStatus', in: 'query', schema: { type: 'string', enum: ['pending', 'paid', 'hold', 'cancelled'] } }
      ],
      responses: {
        200: paginatedListResponse('Payslips list', '#/components/schemas/Payslip'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/payroll/payslips/my-payslips': {
    get: {
      tags: ['Payroll'],
      summary: "Get logged-in employee's payslips",
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: simpleListResponse('Personal payslips', '#/components/schemas/Payslip', { includeCount: false, includeTotal: true }),
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/payroll/payslips/{id}': {
    get: {
      tags: ['Payroll'],
      summary: 'Get individual payslip details',
      description: bearerAuthNote() + ' Permitted for payslip owner or HR/Finance/Executives.',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Payslip details', '#/components/schemas/Payslip'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/payroll/payslips/{id}/html': {
    get: {
      tags: ['Payroll'],
      summary: 'Render printable HTML view of a payslip',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: {
          description: 'Rendered HTML payslip document',
          content: {
            'text/html': {
              schema: { type: 'string' }
            }
          }
        },
        404: { description: 'Payslip not found' }
      }
    }
  },
  '/api/payroll/loans': {
    get: {
      tags: ['Payroll'],
      summary: 'List all salary advance and staff loan requests',
      description: bearerAuthNote(PAYROLL_VIEW_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'type', in: 'query', schema: { type: 'string', enum: ['salary_advance', 'staff_loan'] } }
      ],
      responses: {
        200: paginatedListResponse('Loans list', '#/components/schemas/SalaryAdvanceLoan'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    post: {
      tags: ['Payroll'],
      summary: 'Submit a salary advance or staff loan request',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amountRequested', 'reason'],
              properties: {
                employeeId: { $ref: '#/components/schemas/ObjectId' },
                requestType: { type: 'string', enum: ['salary_advance', 'staff_loan'], default: 'salary_advance' },
                amountRequested: { type: 'number', example: 5000 },
                totalInstallments: { type: 'integer', minimum: 1, default: 1 },
                reason: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Loan request submitted', '#/components/schemas/SalaryAdvanceLoan'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/api/payroll/loans/my-loans': {
    get: {
      tags: ['Payroll'],
      summary: 'Get logged-in employee loan requests',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: simpleListResponse('Personal loan requests', '#/components/schemas/SalaryAdvanceLoan', { includeCount: false, includeTotal: true })
      }
    }
  },
  '/api/payroll/loans/{id}/approve': {
    post: {
      tags: ['Payroll'],
      summary: 'Approve or reject a loan stage (Manager -> HR -> Finance)',
      description: bearerAuthNote(PAYROLL_APPROVE_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['stage', 'decision'],
              properties: {
                stage: { type: 'string', enum: ['managerApproval', 'hrApproval', 'financeApproval'] },
                decision: { type: 'string', enum: ['approved', 'rejected'] },
                approvedAmount: { type: 'number' },
                comments: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Loan approval stage updated', '#/components/schemas/SalaryAdvanceLoan'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/payroll/loans/{id}/disburse': {
    post: {
      tags: ['Payroll'],
      summary: 'Disburse loan and activate automatic monthly payroll deductions',
      description: bearerAuthNote(DISBURSE_ROLES),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                disbursementReference: { type: 'string' },
                disbursementDate: { type: 'string', format: 'date' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Loan disbursed and active', '#/components/schemas/SalaryAdvanceLoan'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  }
};
