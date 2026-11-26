import { bearerAuthNote, jsonSuccessRef, paginatedListResponse, ROLE_GROUPS } from '../components.js';

export const employeePaths = {
  '/api/employees/me': {
    get: {
      tags: ['Employees'],
      summary: 'Get linked employee profile of logged-in user',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonSuccessRef('Linked employee record', '#/components/schemas/Employee'),
        401: { $ref: '#/components/responses/Unauthorized' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/employees': {
    get: {
      tags: ['Employees'],
      summary: 'List employees with filtering, search, and pagination',
      description: bearerAuthNote() + ' Sensitive fields (`basicSalary`, `bankAccounts`) are redacted for non-HR users.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Matches name, employeeNumber, email, or phone' },
        { name: 'department', in: 'query', schema: { type: 'string' } },
        { name: 'jobTitle', in: 'query', schema: { type: 'string' } },
        { name: 'employmentStatus', in: 'query', schema: { type: 'string', enum: ['active', 'probation', 'suspended', 'terminated', 'resigned', 'on_leave'] } },
        { name: 'employmentType', in: 'query', schema: { type: 'string', enum: ['full_time', 'part_time', 'contract', 'intern', 'freelance'] } },
        { name: 'branch', in: 'query', schema: { type: 'string' } },
        { name: 'workLocation', in: 'query', schema: { type: 'string' } },
        { name: 'isLinked', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' } },
        { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } }
      ],
      responses: {
        200: paginatedListResponse('Paginated employee list', '#/components/schemas/Employee'),
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    },
    post: {
      tags: ['Employees'],
      summary: 'Create employee profile (optionally provisioning linked login account)',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'primaryPhone'],
              properties: {
                employeeNumber: { type: 'string' },
                name: { $ref: '#/components/schemas/PersonName' },
                gender: { type: 'string', enum: ['male', 'female', 'other'] },
                dateOfBirth: { type: 'string', format: 'date' },
                primaryPhone: { type: 'string', example: '+251911223344' },
                secondaryPhone: { type: 'string' },
                email: { type: 'string', format: 'email' },
                department: { type: 'string' },
                jobTitle: { type: 'string' },
                employmentType: { type: 'string', enum: ['full_time', 'part_time', 'contract', 'intern', 'freelance'] },
                employmentStatus: { type: 'string', enum: ['active', 'probation', 'suspended', 'terminated', 'resigned', 'on_leave'] },
                basicSalary: { type: 'number' },
                branch: { type: 'string' },
                workLocation: { type: 'string' },
                user: { $ref: '#/components/schemas/ObjectId', description: 'Existing User ObjectId to link' },
                createUser: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    roles: { type: 'array', items: { $ref: '#/components/schemas/RoleEnum' } }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Employee created', '#/components/schemas/Employee', { createdUser: { type: 'object', nullable: true } }),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/employees/{id}': {
    get: {
      tags: ['Employees'],
      summary: 'Get employee by MongoDB ObjectId or employeeNumber',
      description: bearerAuthNote() + ' Redacts `basicSalary` and `bankAccounts` unless caller is HR or viewing own profile.',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, description: 'Employee `_id` or `employeeNumber`', schema: { type: 'string' } }],
      responses: {
        200: jsonSuccessRef('Employee details', '#/components/schemas/Employee'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    put: {
      tags: ['Employees'],
      summary: 'Update employee details',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN) + ' Preserves existing National ID and guarantor verification metadata.',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Employee' }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Employee updated', '#/components/schemas/Employee'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    delete: {
      tags: ['Employees'],
      summary: 'Delete employee record',
      description: bearerAuthNote(ROLE_GROUPS.EXECUTIVE),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: 'Employee deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/employees/{id}/profile-photo': {
    post: {
      tags: ['Employees'],
      summary: 'Upload or update employee profile photo',
      description: bearerAuthNote() + ' Permitted for HR Admin roles or the employee themselves (`self`). Supports `multipart/form-data` (`photo`) or JSON (`fileUrl`).',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                photo: { type: 'string', format: 'binary' },
                fileUrl: { type: 'string' }
              }
            }
          },
          'application/json': {
            schema: {
              type: 'object',
              required: ['fileUrl'],
              properties: { fileUrl: { type: 'string' } }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Profile photo updated', '#/components/schemas/Employee', { profilePhoto: { type: 'string' } }),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    delete: {
      tags: ['Employees'],
      summary: 'Remove employee profile photo',
      description: bearerAuthNote() + ' Permitted for HR Admin roles or self.',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Profile photo removed', '#/components/schemas/Employee'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/employees/{id}/national-id/photos': {
    post: {
      tags: ['Employees'],
      summary: 'Upload front/back National ID photos & details (sets status to pending)',
      description: bearerAuthNote() + ' Permitted for HR Admin roles or self.',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                frontImage: { type: 'string', format: 'binary' },
                backImage: { type: 'string', format: 'binary' },
                frontImageUrl: { type: 'string' },
                backImageUrl: { type: 'string' },
                fanNumber: { type: 'string' },
                finNumber: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('National ID photos updated', '#/components/schemas/Employee', { nationalId: { type: 'object' } }),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/employees/{id}/status': {
    patch: {
      tags: ['Employees'],
      summary: 'Change employee employment status',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
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
                status: { type: 'string', enum: ['active', 'probation', 'suspended', 'terminated', 'resigned', 'on_leave'] },
                contractEndDate: { type: 'string', format: 'date' },
                probationEndDate: { type: 'string', format: 'date' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Employment status updated', '#/components/schemas/Employee'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/employees/{id}/link-user': {
    post: {
      tags: ['Employees'],
      summary: 'Link an existing User account to an Employee',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId'],
              properties: { userId: { $ref: '#/components/schemas/ObjectId' } }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('User linked to employee', '#/components/schemas/Employee'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/employees/{id}/create-user': {
    post: {
      tags: ['Employees'],
      summary: 'Create a new User login account and link to Employee',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['password'],
              properties: {
                email: { type: 'string', format: 'email', description: 'Falls back to employee.email if omitted' },
                password: { type: 'string', minLength: 6 },
                roles: { type: 'array', items: { $ref: '#/components/schemas/RoleEnum' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('User created and linked', '#/components/schemas/Employee'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/employees/{id}/unlink-user': {
    post: {
      tags: ['Employees'],
      summary: 'Unlink User account from Employee',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('User unlinked from employee', '#/components/schemas/Employee'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/employees/{id}/documents': {
    post: {
      tags: ['Employees'],
      summary: 'Upload an HR/compliance document for employee',
      description: bearerAuthNote() + ' Permitted for HR Admin roles or self.',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['title'],
              properties: {
                file: { type: 'string', format: 'binary' },
                title: { type: 'string', example: 'Employment Contract' },
                type: { type: 'string', example: 'contract' },
                fileUrl: { type: 'string' }
              }
            }
          },
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'fileUrl'],
              properties: {
                title: { type: 'string' },
                type: { type: 'string' },
                fileUrl: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Document added to employee', '#/components/schemas/Employee', { document: { type: 'object' } }),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/employees/{id}/documents/{documentId}': {
    delete: {
      tags: ['Employees'],
      summary: 'Delete an employee document',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/IdParam' },
        { name: 'documentId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Document deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/employees/{id}/documents/{documentId}/approve': {
    patch: {
      tags: ['Employees'],
      summary: 'Approve or reject an employee document',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/IdParam' },
        { name: 'documentId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['approved', 'rejected'] },
                rejectionReason: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Document verification updated', '#/components/schemas/Employee'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/employees/{id}/national-id/approve': {
    patch: {
      tags: ['Employees'],
      summary: 'Approve or reject employee National ID verification',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
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
                status: { type: 'string', enum: ['approved', 'rejected'] },
                rejectionReason: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('National ID verification updated', '#/components/schemas/Employee'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/employees/{id}/guarantors/{guarantorId}/national-id/approve': {
    patch: {
      tags: ['Employees'],
      summary: 'Approve or reject guarantor National ID verification',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/IdParam' },
        { name: 'guarantorId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['approved', 'rejected'] },
                rejectionReason: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Guarantor National ID verification updated', '#/components/schemas/Employee'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  }
};
