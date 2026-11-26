import {
  ROLES,
  HR_ADMIN_ROLES,
  EXECUTIVE_ROLES,
  MANAGEMENT_ROLES,
  ACCOUNT_STATUS
} from '../constants/roles.js';
import {
  UNIT_ENUM,
  REQUEST_TYPE_ENUM,
  ITEM_TYPE_ENUM,
  GENERAL_STATUS_ENUM,
  GRV_STATUS_ENUM,
  DELIVERY_STATUS_ENUM,
  STOCK_STATUS_ENUM,
  APPROVAL_STATUS_ENUM,
  PAYMENT_STATUS_ENUM,
  ITEM_CONDITION_ENUM,
  STOCK_MOVEMENT_TYPE_ENUM,
  ADJUSTMENT_TYPE_ENUM
} from '../constants/inventoryEnums.js';

const ALL_ROLE_VALUES = Object.values(ROLES);
const ALL_ACCOUNT_STATUSES = Object.values(ACCOUNT_STATUS);

export const errorResponse = (description) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' }
    }
  }
});

export const jsonSuccessRef = (description, dataSchemaOrRef, extraProps = {}) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: typeof dataSchemaOrRef === 'string'
            ? { $ref: dataSchemaOrRef }
            : dataSchemaOrRef,
          ...extraProps
        }
      }
    }
  }
});

export const paginatedListResponse = (description, itemRef, { includeCount = false } = {}) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          ...(includeCount ? { count: { type: 'integer', example: 10 } } : {}),
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          pages: { type: 'integer', example: 3 },
          data: {
            type: 'array',
            items: { $ref: itemRef }
          }
        }
      }
    }
  }
});

export const simpleListResponse = (description, itemRef, { includeTotal = false, includeCount = true } = {}) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          ...(includeCount ? { count: { type: 'integer', example: 5 } } : {}),
          ...(includeTotal ? { total: { type: 'integer', example: 5 } } : {}),
          data: {
            type: 'array',
            items: { $ref: itemRef }
          }
        }
      }
    }
  }
});

export const bearerAuthNote = (roles = []) => {
  if (!roles || roles.length === 0) {
    return 'Requires `Authorization: Bearer <token>` (any active authenticated user).';
  }
  return `Requires \`Authorization: Bearer <token>\` with one of roles: \`${roles.join('`, `')}\`.`;
};

export const ROLE_GROUPS = {
  HR_ADMIN: HR_ADMIN_ROLES,
  EXECUTIVE: EXECUTIVE_ROLES,
  MANAGEMENT: MANAGEMENT_ROLES
};

export const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT token returned by `/api/auth/login` or `/api/auth/register` (`Authorization: Bearer <token>`).'
    }
  },
  parameters: {
    IdParam: {
      name: 'id',
      in: 'path',
      required: true,
      description: 'MongoDB ObjectId of the resource',
      schema: { type: 'string', example: '6745a1b2c3d4e5f6a7b8c9d0' }
    },
    PageParam: {
      name: 'page',
      in: 'query',
      required: false,
      description: '1-based page number',
      schema: { type: 'integer', minimum: 1, default: 1 }
    },
    LimitParam: {
      name: 'limit',
      in: 'query',
      required: false,
      description: 'Number of records per page',
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
    }
  },
  responses: {
    BadRequest: errorResponse('Validation error or invalid business state'),
    Unauthorized: errorResponse('Missing, expired, or invalid JWT token'),
    Forbidden: errorResponse('Account inactive or caller lacks required role permission'),
    NotFound: errorResponse('Requested resource was not found'),
    ServerError: errorResponse('Internal server error')
  },
  schemas: {
    ObjectId: {
      type: 'string',
      pattern: '^[a-fA-F0-9]{24}$',
      example: '6745a1b2c3d4e5f6a7b8c9d0'
    },
    RoleEnum: {
      type: 'string',
      enum: ALL_ROLE_VALUES
    },
    AccountStatusEnum: {
      type: 'string',
      enum: ALL_ACCOUNT_STATUSES
    },
    UnitEnum: {
      type: 'string',
      enum: UNIT_ENUM
    },
    RequestTypeEnum: {
      type: 'string',
      enum: REQUEST_TYPE_ENUM
    },
    ItemTypeEnum: {
      type: 'string',
      enum: ITEM_TYPE_ENUM
    },
    GeneralStatusEnum: {
      type: 'string',
      enum: GENERAL_STATUS_ENUM
    },
    GrvStatusEnum: {
      type: 'string',
      enum: GRV_STATUS_ENUM
    },
    DeliveryStatusEnum: {
      type: 'string',
      enum: DELIVERY_STATUS_ENUM
    },
    StockStatusEnum: {
      type: 'string',
      enum: STOCK_STATUS_ENUM
    },
    ApprovalStatusEnum: {
      type: 'string',
      enum: APPROVAL_STATUS_ENUM
    },
    PaymentStatusEnum: {
      type: 'string',
      enum: PAYMENT_STATUS_ENUM
    },
    ItemConditionEnum: {
      type: 'string',
      enum: ITEM_CONDITION_ENUM
    },
    StockMovementTypeEnum: {
      type: 'string',
      enum: STOCK_MOVEMENT_TYPE_ENUM
    },
    AdjustmentTypeEnum: {
      type: 'string',
      enum: ADJUSTMENT_TYPE_ENUM
    },
    SuccessMessageResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Operation completed successfully' }
      }
    },
    ErrorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed or resource not found' }
      }
    },
    PersonName: {
      type: 'object',
      required: ['first', 'last'],
      properties: {
        first: { type: 'string', example: 'Abebe' },
        middle: { type: 'string', example: 'Kebede' },
        last: { type: 'string', example: 'Tadesse' }
      }
    },
    UserSummary: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        email: { type: 'string', format: 'email', example: 'user@vectoradvert.com' },
        roles: { type: 'array', items: { $ref: '#/components/schemas/RoleEnum' } },
        accountStatus: { $ref: '#/components/schemas/AccountStatusEnum' },
        mustChangePassword: { type: 'boolean', example: false },
        telegramChatId: { type: 'string', nullable: true },
        telegramUsername: { type: 'string', nullable: true },
        lastLoginTime: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    },
    AuthPayload: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        email: { type: 'string', format: 'email' },
        roles: { type: 'array', items: { $ref: '#/components/schemas/RoleEnum' } },
        accountStatus: { $ref: '#/components/schemas/AccountStatusEnum' },
        mustChangePassword: { type: 'boolean' },
        lastLoginTime: { type: 'string', format: 'date-time' },
        temporaryPassword: { type: 'string', description: 'Returned only when newly provisioned by admin' },
        token: { type: 'string', description: 'Signed JWT Bearer token' }
      }
    },
    Employee: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        employeeNumber: { type: 'string', example: 'EMP-0001' },
        user: { oneOf: [{ $ref: '#/components/schemas/ObjectId' }, { $ref: '#/components/schemas/UserSummary' }], nullable: true },
        name: { $ref: '#/components/schemas/PersonName' },
        fullName: { type: 'string', example: 'Abebe Kebede Tadesse' },
        gender: { type: 'string', enum: ['male', 'female', 'other'] },
        dateOfBirth: { type: 'string', format: 'date' },
        primaryPhone: { type: 'string', example: '+251911223344' },
        secondaryPhone: { type: 'string' },
        email: { type: 'string', format: 'email' },
        department: { type: 'string', example: 'Design & Creative' },
        jobTitle: { type: 'string', example: 'Senior Graphic Designer' },
        employmentType: { type: 'string', enum: ['full_time', 'part_time', 'contract', 'intern', 'freelance'] },
        employmentStatus: { type: 'string', enum: ['active', 'probation', 'suspended', 'terminated', 'resigned', 'on_leave'] },
        hireDate: { type: 'string', format: 'date-time' },
        probationEndDate: { type: 'string', format: 'date-time', nullable: true },
        contractEndDate: { type: 'string', format: 'date-time', nullable: true },
        branch: { type: 'string', example: 'Head Office' },
        workLocation: { type: 'string', example: 'Addis Ababa' },
        managerId: { type: 'string', nullable: true },
        basicSalary: { type: 'number', description: 'Redacted for non-HR/non-self callers', example: 18000 },
        bankAccounts: {
          type: 'array',
          description: 'Redacted for non-HR/non-self callers',
          items: {
            type: 'object',
            properties: {
              bankName: { type: 'string' },
              holderName: { type: 'string' },
              accountNumber: { type: 'string' },
              branch: { type: 'string' },
              isPrimary: { type: 'boolean' }
            }
          }
        },
        profilePhoto: { type: 'string', nullable: true },
        nationalId: {
          type: 'object',
          properties: {
            fanNumber: { type: 'string' },
            finNumber: { type: 'string' },
            frontImage: { type: 'string' },
            backImage: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            rejectionReason: { type: 'string' }
          }
        },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { $ref: '#/components/schemas/ObjectId' },
              title: { type: 'string' },
              type: { type: 'string' },
              fileUrl: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
              rejectionReason: { type: 'string' },
              uploadedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        guarantors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { $ref: '#/components/schemas/ObjectId' },
              fullName: { type: 'string' },
              phone: { type: 'string' },
              relationship: { type: 'string' },
              nationalId: {
                type: 'object',
                properties: {
                  fanNumber: { type: 'string' },
                  finNumber: { type: 'string' },
                  frontImage: { type: 'string' },
                  backImage: { type: 'string' },
                  status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
                  rejectionReason: { type: 'string' }
                }
              }
            }
          }
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    },
    AttendanceConfig: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        locationReferences: {
          type: 'array',
          description: 'Configured office branches/locations used for geofence proximity validation',
          items: {
            type: 'object',
            required: ['officeName', 'location'],
            properties: {
              _id: { $ref: '#/components/schemas/ObjectId' },
              officeName: { type: 'string', example: 'Headquarters - Addis Ababa' },
              address: { type: 'string', example: 'Bole Road, Vector Tower, Addis Ababa, Ethiopia' },
              location: {
                type: 'object',
                required: ['lat', 'long'],
                properties: {
                  lat: { type: 'number', example: 9.005401 },
                  long: { type: 'number', example: 38.784015 }
                }
              },
              radiusMeters: { type: 'number', default: 200, example: 250 }
            }
          }
        },
        morningTime: {
          type: 'object',
          properties: {
            startTime: { type: 'string', example: '08:30' },
            endTime: { type: 'string', example: '12:30' }
          }
        },
        afternoonTime: {
          type: 'object',
          properties: {
            startTime: { type: 'string', example: '13:30' },
            endTime: { type: 'string', example: '17:30' }
          }
        },
        isSelfieRequired: { type: 'boolean', default: true },
        isLocationRequired: { type: 'boolean', default: true },
        autoOvertimeAllow: { type: 'boolean', default: false },
        lateAllowedMinutes: { type: 'number', default: 15 },
        maxAllowedDistanceMeters: { type: 'number', default: 200, example: 250 },
        isActive: { type: 'boolean', default: true }
      }
    },
    AttendanceRecord: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        employee: { type: 'object' },
        internship: { type: 'string', nullable: true },
        attendanceDate: { type: 'string', format: 'date-time' },
        morningCheck: { type: 'object' },
        afternoonCheck: { type: 'object' },
        attendanceStatus: { type: 'string', enum: ['present', 'half_day', 'absent', 'on_leave', 'field_visit', 'holiday'] },
        late: {
          type: 'object',
          properties: {
            isLate: { type: 'boolean', example: false },
            minutesLate: { type: 'number', example: 0 }
          }
        },
        overtime: {
          type: 'object',
          properties: {
            hasOvertime: { type: 'boolean', example: false },
            numberOfHours: { type: 'number', example: 0 }
          }
        },
        notes: { type: 'string' }
      }
    },
    OvertimeRequest: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        employee: { type: 'object' },
        attendance: { type: 'string', nullable: true },
        requestDate: { type: 'string', format: 'date-time' },
        startTime: { type: 'string', example: '17:30' },
        endTime: { type: 'string', example: '20:00' },
        totalHours: { type: 'number', example: 2.5 },
        requestReason: { type: 'string' },
        advanceApprovalRequired: { type: 'boolean', default: true },
        status: { type: 'string', enum: ['pending_manager', 'pending_hr', 'approved', 'rejected'] },
        managerDecision: { type: 'object' },
        hrDecision: { type: 'object' }
      }
    },
    FieldVisit: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        visitPurpose: { type: 'string', example: 'Billboard site survey - Bole' },
        visitDate: { type: 'string', format: 'date-time' },
        visitStartTime: { type: 'string', example: '09:00' },
        visitEndTime: { type: 'string', example: '13:00' },
        visitAddress: { type: 'string', example: 'Bole Medhanialem, Addis Ababa' },
        location: {
          type: 'object',
          properties: {
            lat: { type: 'number', example: 8.9974 },
            long: { type: 'number', example: 38.7868 }
          }
        },
        radiusMeters: { type: 'number', example: 300 },
        employees: { type: 'array', items: { type: 'string' } },
        leader: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['planned', 'in_progress', 'completed', 'cancelled'] },
        checkIns: { type: 'array', items: { type: 'object' } },
        visitReportNotes: { type: 'string' }
      }
    },
    LeaveBalance: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        employee: { type: 'object' },
        year: { type: 'integer', example: 2026 },
        annualLeave: { type: 'object', properties: { total: { type: 'number' }, used: { type: 'number' }, remaining: { type: 'number' } } },
        sickLeave: { type: 'object', properties: { total: { type: 'number' }, used: { type: 'number' }, remaining: { type: 'number' } } },
        casualLeave: { type: 'object', properties: { total: { type: 'number' }, used: { type: 'number' }, remaining: { type: 'number' } } },
        maternityLeave: { type: 'object', properties: { total: { type: 'number' }, used: { type: 'number' }, remaining: { type: 'number' } } },
        paternityLeave: { type: 'object', properties: { total: { type: 'number' }, used: { type: 'number' }, remaining: { type: 'number' } } },
        carriedForwardDays: { type: 'number', example: 0 }
      }
    },
    LeaveRequest: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        employee: { type: 'object' },
        leaveType: { type: 'string', enum: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other'] },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        startDayPeriod: { type: 'string', enum: ['full_day', 'morning', 'afternoon'], default: 'full_day' },
        endDayPeriod: { type: 'string', enum: ['full_day', 'morning', 'afternoon'], default: 'full_day' },
        totalLeaveDays: { type: 'number', example: 3 },
        requestReason: { type: 'string' },
        status: { type: 'string', enum: ['pending_manager', 'pending_hr', 'approved', 'rejected', 'cancelled'] },
        supportingAttachments: { type: 'array', items: { type: 'object' } },
        cancellationReason: { type: 'string' }
      }
    },
    JobPosting: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        jobTitle: { type: 'string', example: 'Printing Machine Operator' },
        department: { type: 'string', example: 'Production' },
        location: { type: 'string', example: 'Addis Ababa' },
        employmentType: { type: 'string', enum: ['full_time', 'part_time', 'contract', 'internship'] },
        experienceLevel: { type: 'string', enum: ['entry', 'mid', 'senior', 'lead', 'executive'] },
        jobDescription: { type: 'string' },
        jobRequirements: { type: 'array', items: { type: 'string' } },
        postingStatus: { type: 'string', enum: ['draft', 'published', 'closed', 'on_hold', 'archived'] },
        numberOfOpenings: { type: 'integer', example: 2 },
        applicationDeadline: { type: 'string', format: 'date-time' }
      }
    },
    JobApplication: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        jobPosting: { type: 'string' },
        applicantName: { type: 'string' },
        applicantContact: { type: 'object', properties: { email: { type: 'string' }, phone: { type: 'string' } } },
        resume: { type: 'string' },
        portfolioLink: { type: 'string' },
        linkedInLink: { type: 'string' },
        coverLetter: { type: 'string' },
        yearsOfExperience: { type: 'number' },
        applicationStatus: {
          type: 'string',
          enum: ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn']
        },
        applicantRating: { type: 'number', minimum: 1, maximum: 5 },
        applicationNotes: { type: 'string' },
        attachments: { type: 'array', items: { type: 'object' } },
        interviews: { type: 'array', items: { $ref: '#/components/schemas/Interview' } }
      }
    },
    Interview: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        interviewFormat: { type: 'string', enum: ['in-person', 'online', 'phone'], default: 'in-person' },
        scheduledDate: { type: 'string', format: 'date-time' },
        interviewLocation: { type: 'string' },
        onlineMeetingLink: { type: 'string' },
        meetingLinkSendingStatus: { type: 'string', enum: ['pending', 'sent', 'failed'], default: 'pending' },
        interviewer: { type: 'string' },
        interviewStatus: { type: 'string', enum: ['scheduled', 'completed', 'cancelled', 'no_show'] },
        interviewFeedback: { type: 'string' },
        hiringDecision: { type: 'string', enum: ['pending', 'recommended', 'strong_hire', 'hold', 'rejected'] },
        interviewScore: { type: 'number' },
        interviewNotes: { type: 'string' },
        attachments: { type: 'array', items: { type: 'object' } }
      }
    },
    Internship: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        internshipNumber: { type: 'string', example: 'INT-0001' },
        name: { $ref: '#/components/schemas/PersonName' },
        gender: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string', format: 'email' },
        type: { type: 'string', enum: ['tutorial', 'paid_internship', 'unpaid_internship', 'apprenticeship'], default: 'tutorial' },
        stipendAmount: { type: 'number', default: 0 },
        status: { type: 'string', enum: ['applied', 'active', 'completed', 'terminated', 'withdrawn', 'converted_to_employee'] },
        academicProfile: { type: 'object' },
        placement: { type: 'object' },
        documents: { type: 'array', items: { type: 'object' } },
        evaluations: { type: 'array', items: { type: 'object' } },
        notes: { type: 'string' }
      }
    },
    UploadResult: {
      type: 'object',
      properties: {
        fileName: { type: 'string', example: '1732612345678-123456-document.pdf' },
        originalName: { type: 'string', example: 'document.pdf' },
        fileUrl: { type: 'string', example: '/uploads/attachments/1732612345678-123456-document.pdf' },
        fileType: { type: 'string', example: 'application/pdf' },
        fileSize: { type: 'integer', example: 245760 }
      }
    },
    Evidence: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        entityType: { type: 'string', example: 'GRV' },
        entityId: { $ref: '#/components/schemas/ObjectId' },
        entityOwner: { type: 'string', nullable: true },
        attachments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { $ref: '#/components/schemas/ObjectId' },
              title: { type: 'string' },
              description: { type: 'string' },
              fileName: { type: 'string' },
              fileUrl: { type: 'string' },
              fileType: { type: 'string' },
              fileSize: { type: 'number' },
              verificationStatus: { type: 'string', enum: ['pending', 'verified', 'rejected'] },
              rejectionReason: { type: 'string' },
              uploadedBy: { type: 'string' },
              uploadedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        notes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { $ref: '#/components/schemas/ObjectId' },
              content: { type: 'string' },
              author: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    Clearance: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        employee: { type: 'object' },
        resignationDate: { type: 'string', format: 'date' },
        lastWorkingDay: { type: 'string', format: 'date' },
        reasonForLeaving: { type: 'string' },
        overallStatus: { type: 'string', enum: ['initiated', 'in_progress', 'approved', 'rejected', 'finalized'] },
        departments: { type: 'object', description: 'Tracks department_head, store, it, finance, hr sign-offs' },
        customDepartments: { type: 'array', items: { type: 'object' } },
        certificateUrl: { type: 'string', nullable: true }
      }
    },
    ProfessionalUpgrade: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        employee: { type: 'object' },
        upgradeType: { type: 'string', example: 'certification' },
        upgradeTitle: { type: 'string', example: 'PMP Certification' },
        institution: { type: 'string' },
        fieldOfStudy: { type: 'string' },
        startDate: { type: 'string', format: 'date' },
        expectedCompletionDate: { type: 'string', format: 'date' },
        completionDate: { type: 'string', format: 'date', nullable: true },
        estimatedCost: { type: 'number', default: 0 },
        companySponsorshipRequested: { type: 'boolean', default: false },
        status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'] },
        supportingDocuments: { type: 'array', items: { type: 'string' } },
        reviewNotes: { type: 'string' }
      }
    },
    Training: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        title: { type: 'string', example: 'Workshop Safety & Large Format Maintenance' },
        description: { type: 'string' },
        trainingType: { type: 'string', enum: ['internal', 'external', 'online', 'workshop'], default: 'internal' },
        trainerName: { type: 'string' },
        provider: { type: 'string' },
        department: { type: 'array', items: { type: 'string' } },
        location: { type: 'string' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        duration: { type: 'string' },
        budget: { type: 'number', default: 0 },
        status: { type: 'string', enum: ['planned', 'ongoing', 'completed', 'cancelled'], default: 'planned' },
        participants: { type: 'array', items: { type: 'object' } },
        attachments: { type: 'array', items: { type: 'object' } },
        note: { type: 'string' }
      }
    },
    Plan: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        name: { type: 'string', example: 'Q2 Production Expansion Plan' },
        parentPlan: { type: 'string', nullable: true },
        type: { type: 'string', example: 'departmental' },
        department: { type: 'string', example: 'Production' },
        keyGoal: { type: 'string' },
        expectedOutput: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        status: { type: 'string', enum: ['pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'] },
        budget: { type: 'number', default: 0 },
        leader: { type: 'string' },
        teams: { type: 'array', items: { type: 'string' } },
        tasks: { type: 'array', items: { type: 'object' } },
        documents: { type: 'array', items: { type: 'object' } },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        note: { type: 'string' }
      }
    },
    PayrollConfig: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        companyName: { type: 'string', example: 'Vector Advert ERP' },
        currency: { type: 'string', example: 'ETB' },
        payFrequency: { type: 'string', enum: ['monthly', 'bi_weekly', 'weekly'], default: 'monthly' },
        standardWorkingDaysPerMonth: { type: 'integer', example: 22 },
        standardWorkingHoursPerDay: { type: 'integer', example: 8 },
        payrollCutoffDay: { type: 'integer', example: 25 },
        pensionContribution: {
          type: 'object',
          properties: {
            employeePensionRate: { type: 'number', example: 7 },
            employerPensionRate: { type: 'number', example: 11 },
            isPensionMandatory: { type: 'boolean', example: true }
          }
        },
        incomeTaxSlabs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slabName: { type: 'string' },
              minIncome: { type: 'number' },
              maxIncome: { type: 'number', nullable: true },
              taxRate: { type: 'number' },
              deductibleAmount: { type: 'number' }
            }
          }
        },
        overtimeMultipliers: {
          type: 'object',
          properties: {
            normalDayMultiplier: { type: 'number', example: 1.5 },
            nightShiftMultiplier: { type: 'number', example: 1.75 },
            weekendMultiplier: { type: 'number', example: 2.0 },
            publicHolidayMultiplier: { type: 'number', example: 2.5 }
          }
        },
        taxExemptAllowanceLimits: {
          type: 'object',
          properties: {
            transportAllowanceLimit: { type: 'number', example: 2200 },
            foodAllowanceLimit: { type: 'number', example: 0 },
            mobileAllowanceLimit: { type: 'number', example: 0 }
          }
        },
        latePenalty: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', example: false },
            graceMinutes: { type: 'number', example: 15 },
            ratePerHour: { type: 'number', example: 0 }
          }
        },
        isActive: { type: 'boolean', example: true }
      }
    },
    SalaryStructure: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        employee: { type: 'object' },
        effectiveFrom: { type: 'string', format: 'date-time' },
        effectiveTo: { type: 'string', format: 'date-time', nullable: true },
        status: { type: 'string', enum: ['active', 'inactive', 'draft', 'superseded'], default: 'active' },
        baseSalary: { type: 'number', example: 18000 },
        paymentMethod: { type: 'string', enum: ['bank_transfer', 'cash', 'cheque'], default: 'bank_transfer' },
        bankAccount: { type: 'object' },
        isOvertimeEligible: { type: 'boolean', default: true },
        isPensionEligible: { type: 'boolean', default: true },
        isTaxExempt: { type: 'boolean', default: false },
        earnings: { type: 'array', items: { type: 'object' } },
        deductions: { type: 'array', items: { type: 'object' } },
        notes: { type: 'string' }
      }
    },
    PayrollRun: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        payrollCode: { type: 'string', example: 'PR-2026-11' },
        title: { type: 'string', example: 'Payroll for November 2026' },
        periodMonth: { type: 'integer', minimum: 1, maximum: 12, example: 11 },
        periodYear: { type: 'integer', example: 2026 },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        paymentDate: { type: 'string', format: 'date-time' },
        payrollStatus: {
          type: 'string',
          enum: ['draft', 'calculating', 'pending_hr_review', 'pending_finance_approval', 'pending_executive_approval', 'approved', 'disbursed', 'cancelled']
        },
        totalEmployees: { type: 'integer', example: 45 },
        financialSummary: { type: 'object' },
        approvals: { type: 'object' },
        disbursementDetails: { type: 'object' },
        notes: { type: 'string' }
      }
    },
    Payslip: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        payslipNumber: { type: 'string', example: 'PS-202611-0001' },
        payrollRun: { type: 'object' },
        employee: { type: 'object' },
        earnings: { type: 'object' },
        deductions: { type: 'object' },
        netSalary: { type: 'number', example: 14250.5 },
        paymentStatus: { type: 'string', enum: ['pending', 'paid', 'hold', 'cancelled'] }
      }
    },
    SalaryAdvanceLoan: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        loanCode: { type: 'string', example: 'LN-2026-0001' },
        employee: { type: 'object' },
        requestType: { type: 'string', enum: ['salary_advance', 'staff_loan'], default: 'salary_advance' },
        amountRequested: { type: 'number', example: 5000 },
        amountApproved: { type: 'number', example: 5000 },
        totalInstallments: { type: 'integer', example: 5 },
        monthlyDeductionAmount: { type: 'number', example: 1000 },
        remainingBalance: { type: 'number', example: 5000 },
        reason: { type: 'string' },
        repaymentStatus: { type: 'string', enum: ['pending_approval', 'approved', 'active', 'repaid', 'rejected'] },
        approvals: { type: 'object' }
      }
    },
    StockItem: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        code: { type: 'string', example: 'STK-0001' },
        name: { type: 'string', example: 'Frontlit Flex Banner Roll 3.2m' },
        description: { type: 'string' },
        category: { type: 'string', example: 'Printing Media' },
        itemType: { $ref: '#/components/schemas/ItemTypeEnum' },
        unit: { $ref: '#/components/schemas/UnitEnum' },
        baseUnit: { $ref: '#/components/schemas/UnitEnum' },
        multiplierNumerator: { type: 'number', example: 50 },
        multiplierDenominator: { type: 'number', example: 1 },
        multiplier: { type: 'number', example: 50 },
        reorderLevelQuantity: { type: 'number', example: 5 },
        minimumStockQuantity: { type: 'number', example: 2 },
        maximumStockQuantity: { type: 'number', example: 30 },
        unitCost: { type: 'number', example: 12500 },
        averageUnitCost: { type: 'number', example: 250 },
        stockStatus: { $ref: '#/components/schemas/StockStatusEnum' },
        defaultWarehouseId: { type: 'string' },
        supplierId: { type: 'string' }
      }
    },
    StockBalance: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        stockItemId: { type: 'object' },
        warehouseId: { type: 'object' },
        locationId: { type: 'object', nullable: true },
        balanceQuantity: { type: 'number' },
        balanceTotalQuantity: { type: 'number' },
        reservedQuantity: { type: 'number' },
        availableQuantity: { type: 'number' }
      }
    },
    StockMovement: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        movementCode: { type: 'string', example: 'MOV-0001' },
        stockItemId: { type: 'object' },
        warehouseId: { type: 'object' },
        movementType: { $ref: '#/components/schemas/StockMovementTypeEnum' },
        referenceType: { type: 'string' },
        referenceId: { $ref: '#/components/schemas/ObjectId' },
        quantityIn: { type: 'number' },
        quantityOut: { type: 'number' },
        balanceQuantityAfter: { type: 'number' },
        unit: { type: 'string' },
        movementDate: { type: 'string', format: 'date-time' },
        notes: { type: 'string' }
      }
    },
    Warehouse: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        code: { type: 'string', example: 'WH-0001' },
        name: { type: 'string', example: 'Main Central Warehouse' },
        description: { type: 'string' },
        warehouseType: { type: 'string', enum: ['central', 'workshop', 'office', 'transit'], default: 'central' },
        address: { type: 'string' },
        managerId: { type: 'string' },
        status: { $ref: '#/components/schemas/GeneralStatusEnum' }
      }
    },
    WarehouseLocation: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        warehouseId: { $ref: '#/components/schemas/ObjectId' },
        code: { type: 'string', example: 'A-01-R2' },
        name: { type: 'string' },
        description: { type: 'string' },
        locationType: { type: 'string', enum: ['aisle', 'rack', 'shelf', 'bin', 'floor_area'], default: 'shelf' },
        status: { $ref: '#/components/schemas/GeneralStatusEnum' }
      }
    },
    UnitOfMeasure: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        name: { type: 'string', example: 'Roll' },
        code: { $ref: '#/components/schemas/UnitEnum' },
        symbol: { type: 'string', example: 'roll' },
        description: { type: 'string' },
        status: { $ref: '#/components/schemas/GeneralStatusEnum' }
      }
    },
    StockAdjustment: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        adjustmentCode: { type: 'string', example: 'ADJ-0001' },
        warehouseId: { $ref: '#/components/schemas/ObjectId' },
        adjustmentType: { $ref: '#/components/schemas/AdjustmentTypeEnum' },
        adjustmentDate: { type: 'string', format: 'date-time' },
        reason: { type: 'string' },
        items: { type: 'array', items: { type: 'object' } },
        status: { type: 'string', enum: ['draft', 'pending_approval', 'approved', 'rejected'] },
        approvalComment: { type: 'string' },
        rejectionReason: { type: 'string' },
        notes: { type: 'string' }
      }
    },
    StockTransfer: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        transferCode: { type: 'string', example: 'TRF-0001' },
        sourceWarehouseId: { $ref: '#/components/schemas/ObjectId' },
        destinationWarehouseId: { $ref: '#/components/schemas/ObjectId' },
        items: { type: 'array', items: { type: 'object' } },
        status: { type: 'string', enum: ['pending_approval', 'in_transit', 'received', 'cancelled'] },
        notes: { type: 'string' }
      }
    },
    StockCount: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        countCode: { type: 'string', example: 'CNT-0001' },
        warehouseId: { $ref: '#/components/schemas/ObjectId' },
        countDate: { type: 'string', format: 'date-time' },
        items: { type: 'array', items: { type: 'object' } },
        status: { type: 'string', enum: ['in_progress', 'completed', 'reconciled', 'cancelled'] },
        approvalComment: { type: 'string' },
        notes: { type: 'string' }
      }
    },
    AssetRegister: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        assetCode: { type: 'string', example: 'AST-0001' },
        name: { type: 'string', example: 'Mimaki JV300 Large Format Printer' },
        description: { type: 'string' },
        category: { type: 'string', example: 'Machinery' },
        serialNumber: { type: 'string' },
        purchaseDate: { type: 'string', format: 'date' },
        purchaseCost: { type: 'number' },
        supplierId: { type: 'string' },
        warehouseId: { type: 'string' },
        locationId: { type: 'string' },
        assignedTo: { type: 'string' },
        condition: { type: 'string', enum: ['new', 'good', 'fair', 'needs_repair', 'scrapped'], default: 'good' },
        status: { type: 'string', enum: ['in_use', 'maintenance', 'idle', 'disposed'], default: 'in_use' },
        warrantyExpiry: { type: 'string', format: 'date' },
        notes: { type: 'string' }
      }
    },
    AssetMaintenance: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        maintenanceCode: { type: 'string', example: 'MNT-0001' },
        assetId: { $ref: '#/components/schemas/ObjectId' },
        maintenanceType: { type: 'string', enum: ['preventive', 'corrective', 'emergency', 'inspection'], default: 'preventive' },
        description: { type: 'string' },
        maintenanceDate: { type: 'string', format: 'date-time' },
        serviceProvider: { type: 'string' },
        cost: { type: 'number', default: 0 },
        nextMaintenanceDate: { type: 'string', format: 'date' },
        status: { type: 'string', enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'completed' },
        notes: { type: 'string' }
      }
    },
    EndOfDayReport: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        reportCode: { type: 'string', example: 'EOD-0001' },
        warehouseId: { $ref: '#/components/schemas/ObjectId' },
        reportDate: { type: 'string', format: 'date-time' },
        openingTotalQuantity: { type: 'number' },
        receivedTotalQuantity: { type: 'number' },
        issuedTotalQuantity: { type: 'number' },
        returnedTotalQuantity: { type: 'number' },
        wasteTotalQuantity: { type: 'number' },
        closingTotalQuantity: { type: 'number' }
      }
    },
    GRV: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        grvNumber: { type: 'string', example: 'GRV-0001' },
        purchaseOrderId: { type: 'string', nullable: true },
        supplierId: { type: 'object' },
        warehouseId: { type: 'object' },
        supplierInvoiceNumber: { type: 'string' },
        deliveryNoteNumber: { type: 'string' },
        deliveryStatus: { $ref: '#/components/schemas/DeliveryStatusEnum' },
        grvStatus: { $ref: '#/components/schemas/GrvStatusEnum' },
        items: { type: 'array', items: { type: 'object' } },
        storeKeeperComment: { type: 'string' },
        notes: { type: 'string' }
      }
    },
    StaffStoreRequest: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        requestNumber: { type: 'string', example: 'STR-0001' },
        requestType: { $ref: '#/components/schemas/RequestTypeEnum' },
        jobOrderId: { type: 'string', nullable: true },
        departmentId: { type: 'string', nullable: true },
        warehouseId: { type: 'string', nullable: true },
        requiredDate: { type: 'string', format: 'date' },
        purpose: { type: 'string' },
        approvalStatus: { $ref: '#/components/schemas/ApprovalStatusEnum' },
        approvalComment: { type: 'string' },
        rejectionReason: { type: 'string' },
        issuedStatus: { type: 'string', enum: ['unissued', 'partially_issued', 'fully_issued'] },
        notes: { type: 'string' },
        items: { type: 'array', items: { type: 'object' } }
      }
    },
    SIV: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        sivNumber: { type: 'string', example: 'SIV-0001' },
        staffRequestId: { type: 'object' },
        warehouseId: { type: 'object' },
        receivedBy: { type: 'string' },
        items: { type: 'array', items: { type: 'object' } },
        notes: { type: 'string' }
      }
    },
    StoreReturn: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        returnNumber: { type: 'string' },
        warehouseId: { type: 'object' },
        sivId: { type: 'string', nullable: true },
        staffRequestId: { type: 'string', nullable: true },
        items: { type: 'array', items: { type: 'object' } },
        notes: { type: 'string' }
      }
    },
    SupplierReturn: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        returnNumber: { type: 'string' },
        originalGrvId: { type: 'string', nullable: true },
        supplierId: { type: 'string' },
        warehouseId: { type: 'string' },
        items: { type: 'array', items: { type: 'object' } },
        reason: { type: 'string' }
      }
    },
    WasteRecord: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        wasteNumber: { type: 'string' },
        warehouseId: { type: 'object' },
        reason: { type: 'string' },
        items: { type: 'array', items: { type: 'object' } },
        recordedAt: { type: 'string', format: 'date-time' }
      }
    },
    PurchaseRequest: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        requestNumber: { type: 'string', example: 'PRQ-0001' },
        requestType: { $ref: '#/components/schemas/RequestTypeEnum' },
        departmentId: { type: 'string' },
        jobOrderId: { type: 'string' },
        approvalStatus: { $ref: '#/components/schemas/ApprovalStatusEnum' },
        approvalComment: { type: 'string' },
        rejectionReason: { type: 'string' },
        procurementStatus: { type: 'string' },
        items: { type: 'array', items: { type: 'object' } },
        purpose: { type: 'string' },
        notes: { type: 'string' }
      }
    },
    PurchaseAssignment: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        assignmentCode: { type: 'string' },
        purchaseRequestId: { type: 'object' },
        assignedTo: { type: 'object' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        dueDate: { type: 'string', format: 'date-time' },
        status: { type: 'string' },
        notes: { type: 'string' }
      }
    },
    VendorPriceComparison: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        comparisonNumber: { type: 'string' },
        purchaseRequestId: { type: 'string' },
        quotations: { type: 'array', items: { type: 'object' } },
        selectedSupplierId: { type: 'string', nullable: true },
        selectionReason: { type: 'string' },
        approvalStatus: { $ref: '#/components/schemas/ApprovalStatusEnum' }
      }
    },
    PurchaseOrder: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        poNumber: { type: 'string', example: 'PO-0001' },
        purchaseRequestId: { type: 'string', nullable: true },
        comparisonId: { type: 'string', nullable: true },
        supplierId: { type: 'object' },
        warehouseId: { type: 'object' },
        expectedDeliveryDate: { type: 'string', format: 'date-time' },
        paymentTerms: { type: 'string' },
        items: { type: 'array', items: { type: 'object' } },
        subtotal: { type: 'number' },
        taxAmount: { type: 'number' },
        deliveryCost: { type: 'number' },
        discount: { type: 'number' },
        totalAmount: { type: 'number' },
        status: { type: 'string' }
      }
    },
    Auction: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        auctionNumber: { type: 'string' },
        title: { type: 'string' },
        items: { type: 'array', items: { type: 'object' } },
        bids: { type: 'array', items: { type: 'object' } },
        status: { type: 'string' }
      }
    },
    Supplier: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        code: { type: 'string', example: 'SUP-0001' },
        name: { type: 'string', example: 'Ethio Sign Supply PLC' },
        phone: { type: 'string' },
        email: { type: 'string', format: 'email' },
        address: { type: 'string' },
        tinNumber: { type: 'string' },
        status: { $ref: '#/components/schemas/GeneralStatusEnum' },
        creditBalance: { type: 'number' }
      }
    },
    SupplierCreditTransaction: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        creditNumber: { type: 'string' },
        supplierId: { type: 'object' },
        grvId: { type: 'string', nullable: true },
        purchaseOrderId: { type: 'string', nullable: true },
        totalAmount: { type: 'number' },
        paidAmount: { type: 'number' },
        remainingAmount: { type: 'number' },
        paymentStatus: { $ref: '#/components/schemas/PaymentStatusEnum' },
        dueDate: { type: 'string', format: 'date' }
      }
    },
    SupplierPayment: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        paymentNumber: { type: 'string' },
        supplierId: { type: 'object' },
        creditTransactionId: { type: 'object' },
        amount: { type: 'number' },
        paymentMethod: { type: 'string', enum: ['bank_transfer', 'cash', 'cheque', 'mobile_money'], default: 'bank_transfer' },
        referenceNumber: { type: 'string' },
        bankName: { type: 'string' },
        paymentDate: { type: 'string', format: 'date-time' },
        notes: { type: 'string' }
      }
    },
    TaxRecord: {
      type: 'object',
      properties: {
        _id: { $ref: '#/components/schemas/ObjectId' },
        name: { type: 'string', example: 'VAT 15%' },
        rate: { type: 'number', example: 15 },
        taxType: { type: 'string', example: 'vat' },
        status: { $ref: '#/components/schemas/GeneralStatusEnum' }
      }
    }
  }
};
