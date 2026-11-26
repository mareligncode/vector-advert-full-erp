import { bearerAuthNote, jsonSuccessRef, paginatedListResponse, ROLE_GROUPS } from '../components.js';

export const attendanceOvertimeFieldPaths = {
  // ======================== ATTENDANCE ========================
  '/api/attendance/config': {
    get: {
      tags: ['Attendance'],
      summary: 'Get active office geofence and shift configuration',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonSuccessRef('Active attendance config', '#/components/schemas/AttendanceConfig'),
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    },
    put: {
      tags: ['Attendance'],
      summary: 'Update office geofence, shifts, and selfie policy',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AttendanceConfig' } } }
      },
      responses: {
        200: jsonSuccessRef('Attendance config updated', '#/components/schemas/AttendanceConfig'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/attendance/check-in': {
    post: {
      tags: ['Attendance'],
      summary: 'Check in for morning or afternoon shift',
      description: bearerAuthNote() + ' Supports selfie image upload (`selfie`) and optional GPS coordinates.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                selfie: { type: 'string', format: 'binary' },
                lat: { type: 'number', example: 9.0192 },
                long: { type: 'number', example: 38.7525 },
                shift: { type: 'string', enum: ['morning', 'afternoon'], default: 'morning' },
                employeeId: { $ref: '#/components/schemas/ObjectId', description: 'HR Admin only' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Checked in successfully', '#/components/schemas/AttendanceRecord'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/api/attendance/check-out': {
    post: {
      tags: ['Attendance'],
      summary: 'Check out from active shift',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                selfie: { type: 'string', format: 'binary' },
                lat: { type: 'number' },
                long: { type: 'number' },
                shift: { type: 'string', enum: ['morning', 'afternoon'] },
                employeeId: { $ref: '#/components/schemas/ObjectId' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Checked out successfully', '#/components/schemas/AttendanceRecord'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/api/attendance/today': {
    get: {
      tags: ['Attendance'],
      summary: "Get logged-in employee's attendance record for today",
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonSuccessRef("Today's attendance record (or null)", '#/components/schemas/AttendanceRecord')
      }
    }
  },
  '/api/attendance/me': {
    get: {
      tags: ['Attendance'],
      summary: "Get logged-in employee's attendance history",
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
      ],
      responses: {
        200: paginatedListResponse('Attendance history', '#/components/schemas/AttendanceRecord')
      }
    }
  },
  '/api/attendance/summary': {
    get: {
      tags: ['Attendance'],
      summary: 'Get monthly attendance metrics summary',
      description: bearerAuthNote() + ' `employeeId` override is restricted to Management roles.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'employeeId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'month', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 12 } },
        { name: 'year', in: 'query', schema: { type: 'integer', example: 2026 } }
      ],
      responses: {
        200: jsonSuccessRef('Monthly attendance summary', { type: 'object' })
      }
    }
  },
  '/api/attendance': {
    get: {
      tags: ['Attendance'],
      summary: 'List all employee attendance records',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'employeeId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'department', in: 'query', schema: { type: 'string' } },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'isLate', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        { name: 'hasOvertime', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } }
      ],
      responses: {
        200: paginatedListResponse('Attendance records list', '#/components/schemas/AttendanceRecord'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/attendance/{id}': {
    put: {
      tags: ['Attendance'],
      summary: 'Manually adjust an attendance record',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AttendanceRecord' } } }
      },
      responses: {
        200: jsonSuccessRef('Attendance record updated', '#/components/schemas/AttendanceRecord'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },

  // ======================== OVERTIME ========================
  '/api/overtime': {
    post: {
      tags: ['Overtime'],
      summary: 'Submit an overtime request',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['requestDate', 'startTime', 'endTime', 'totalHours', 'requestReason'],
              properties: {
                requestDate: { type: 'string', format: 'date' },
                startTime: { type: 'string', example: '17:30' },
                endTime: { type: 'string', example: '20:30' },
                totalHours: { type: 'number', example: 3 },
                requestReason: { type: 'string' },
                attendanceId: { $ref: '#/components/schemas/ObjectId' },
                advanceApprovalRequired: { type: 'boolean', default: true }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Overtime request submitted', '#/components/schemas/OvertimeRequest'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    },
    get: {
      tags: ['Overtime'],
      summary: 'List all overtime requests',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'employeeId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
      ],
      responses: {
        200: paginatedListResponse('Overtime requests', '#/components/schemas/OvertimeRequest'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/overtime/me': {
    get: {
      tags: ['Overtime'],
      summary: 'List logged-in employee overtime requests',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: paginatedListResponse('My overtime requests', '#/components/schemas/OvertimeRequest')
      }
    }
  },
  '/api/overtime/{id}': {
    get: {
      tags: ['Overtime'],
      summary: 'Get overtime request by ID',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Overtime request details', '#/components/schemas/OvertimeRequest'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/overtime/{id}/decision': {
    patch: {
      tags: ['Overtime'],
      summary: 'Approve or reject overtime request (manager or HR stage)',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['decision'],
              properties: {
                decision: { type: 'string', enum: ['approved', 'rejected'] },
                comments: { type: 'string' },
                stage: { type: 'string', enum: ['manager', 'hr'] },
                bypassDoubleApproval: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Overtime decision recorded', '#/components/schemas/OvertimeRequest'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },

  // ======================== FIELD VISITS ========================
  '/api/field-visits': {
    post: {
      tags: ['Field Visits'],
      summary: 'Schedule a new field visit / outdoor site assignment',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['visitPurpose', 'visitDate', 'visitStartTime', 'visitEndTime', 'visitAddress', 'location'],
              properties: {
                visitPurpose: { type: 'string' },
                visitDate: { type: 'string', format: 'date' },
                visitStartTime: { type: 'string', example: '09:00' },
                visitEndTime: { type: 'string', example: '12:30' },
                visitAddress: { type: 'string' },
                location: {
                  type: 'object',
                  required: ['lat', 'long'],
                  properties: {
                    lat: { type: 'number', example: 9.0192 },
                    long: { type: 'number', example: 38.7525 }
                  }
                },
                radiusMeters: { type: 'number', default: 300 },
                employees: { type: 'array', items: { $ref: '#/components/schemas/ObjectId' } },
                leader: { $ref: '#/components/schemas/ObjectId' },
                visitReportNotes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Field visit created', '#/components/schemas/FieldVisit'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    get: {
      tags: ['Field Visits'],
      summary: 'List field visits',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'leaderId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'employeeId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: paginatedListResponse('Field visits list', '#/components/schemas/FieldVisit')
      }
    }
  },
  '/api/field-visits/me': {
    get: {
      tags: ['Field Visits'],
      summary: 'List field visits assigned to the logged-in employee',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: paginatedListResponse('Assigned field visits', '#/components/schemas/FieldVisit')
      }
    }
  },
  '/api/field-visits/{id}': {
    get: {
      tags: ['Field Visits'],
      summary: 'Get field visit details',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Field visit details', '#/components/schemas/FieldVisit'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    patch: {
      tags: ['Field Visits'],
      summary: 'Update field visit status, notes, or assigned staff',
      description: bearerAuthNote() + ' Permitted for Management roles or the visit team leader.',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/FieldVisit' } } }
      },
      responses: {
        200: jsonSuccessRef('Field visit updated', '#/components/schemas/FieldVisit'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/field-visits/{id}/check-in': {
    post: {
      tags: ['Field Visits'],
      summary: 'Geo-fence selfie check-in at field visit location',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['lat', 'long'],
              properties: {
                selfie: { type: 'string', format: 'binary' },
                lat: { type: 'number' },
                long: { type: 'number' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Field visit check-in recorded', '#/components/schemas/FieldVisit'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  }
};
