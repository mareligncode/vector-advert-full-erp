import { bearerAuthNote, jsonSuccessRef, paginatedListResponse, ROLE_GROUPS, simpleListResponse } from '../components.js';

export const hrLifecyclePaths = {
  // ======================== CLEARANCES ========================
  '/api/clearances': {
    post: {
      tags: ['Clearances'],
      summary: 'Initiate employee exit clearance workflow',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['resignationDate', 'lastWorkingDay', 'reasonForLeaving'],
              properties: {
                employeeId: { $ref: '#/components/schemas/ObjectId', description: 'HR Admin override' },
                resignationDate: { type: 'string', format: 'date' },
                lastWorkingDay: { type: 'string', format: 'date' },
                reasonForLeaving: { type: 'string' },
                customDepartments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Clearance initiated', '#/components/schemas/Clearance'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    },
    get: {
      tags: ['Clearances'],
      summary: 'List exit clearance requests',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'employeeId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'department', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: paginatedListResponse('Clearances list', '#/components/schemas/Clearance'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/clearances/me': {
    get: {
      tags: ['Clearances'],
      summary: 'Get clearance status for logged-in employee',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: simpleListResponse('My clearance records', '#/components/schemas/Clearance', { includeCount: false })
      }
    }
  },
  '/api/clearances/{id}': {
    get: {
      tags: ['Clearances'],
      summary: 'Get exit clearance details',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Clearance details', '#/components/schemas/Clearance'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    patch: {
      tags: ['Clearances'],
      summary: 'Update clearance dates or resignation details',
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
                resignationDate: { type: 'string', format: 'date' },
                lastWorkingDay: { type: 'string', format: 'date' },
                reasonForLeaving: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Clearance updated', '#/components/schemas/Clearance'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    delete: {
      tags: ['Clearances'],
      summary: 'Delete an exit clearance record',
      description: bearerAuthNote(ROLE_GROUPS.EXECUTIVE),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: 'Clearance deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/clearances/{id}/department/{department}': {
    patch: {
      tags: ['Clearances'],
      summary: 'Sign off department clearance stage',
      description: bearerAuthNote() + ' Role checked per department (`department_head`, `store`, `it`, `finance`, `hr`).',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/IdParam' },
        { name: 'department', in: 'path', required: true, schema: { type: 'string', enum: ['department_head', 'store', 'it', 'finance', 'hr'] } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['approved', 'rejected', 'pending'] },
                note: { type: 'string' },
                items: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Department sign-off recorded', '#/components/schemas/Clearance'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/clearances/{id}/finalize': {
    post: {
      tags: ['Clearances'],
      summary: 'Finalize exit clearance, upload certificate, and deactivate account',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN) + ' Requires all 5 departments approved.',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: false,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                certificate: { type: 'string', format: 'binary' },
                certificateUrl: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Clearance finalized', '#/components/schemas/Clearance'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },

  // ======================== PROFESSIONAL UPGRADES ========================
  '/api/professional-upgrades': {
    post: {
      tags: ['Professional Upgrades'],
      summary: 'Submit a training/certification/degree sponsorship request',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['upgradeType', 'upgradeTitle', 'institution', 'startDate'],
              properties: {
                employeeId: { $ref: '#/components/schemas/ObjectId' },
                upgradeType: { type: 'string' },
                upgradeTitle: { type: 'string' },
                institution: { type: 'string' },
                fieldOfStudy: { type: 'string' },
                startDate: { type: 'string', format: 'date' },
                expectedCompletionDate: { type: 'string', format: 'date' },
                estimatedCost: { type: 'number', default: 0 },
                companySponsorshipRequested: { type: 'boolean', default: false },
                supportingDocuments: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Professional upgrade request submitted', '#/components/schemas/ProfessionalUpgrade'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    },
    get: {
      tags: ['Professional Upgrades'],
      summary: 'List all professional upgrade requests',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'employee', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'upgradeType', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: paginatedListResponse('Professional upgrades list', '#/components/schemas/ProfessionalUpgrade'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/professional-upgrades/me': {
    get: {
      tags: ['Professional Upgrades'],
      summary: 'List logged-in employee professional upgrade requests',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: simpleListResponse('My professional upgrades', '#/components/schemas/ProfessionalUpgrade', { includeCount: false })
      }
    }
  },
  '/api/professional-upgrades/{id}': {
    get: {
      tags: ['Professional Upgrades'],
      summary: 'Get professional upgrade request details',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Professional upgrade details', '#/components/schemas/ProfessionalUpgrade'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    patch: {
      tags: ['Professional Upgrades'],
      summary: 'Update professional upgrade request fields',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfessionalUpgrade' } } } },
      responses: {
        200: jsonSuccessRef('Professional upgrade updated', '#/components/schemas/ProfessionalUpgrade'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    delete: {
      tags: ['Professional Upgrades'],
      summary: 'Delete professional upgrade request',
      description: bearerAuthNote(ROLE_GROUPS.EXECUTIVE),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: 'Upgrade deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/professional-upgrades/{id}/review': {
    patch: {
      tags: ['Professional Upgrades'],
      summary: 'Approve, reject, or update completion status of upgrade request',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
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
                status: { type: 'string', enum: ['approved', 'rejected', 'in_progress', 'completed', 'cancelled'] },
                reviewNotes: { type: 'string' },
                completionDate: { type: 'string', format: 'date' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Upgrade review saved', '#/components/schemas/ProfessionalUpgrade'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },

  // ======================== TRAININGS ========================
  '/api/trainings': {
    post: {
      tags: ['Trainings'],
      summary: 'Create a training program/session',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'startDate', 'endDate'],
              properties: {
                title: { type: 'string' },
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
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Training created', '#/components/schemas/Training'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    get: {
      tags: ['Trainings'],
      summary: 'List training programs',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'trainingType', in: 'query', schema: { type: 'string' } },
        { name: 'department', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: paginatedListResponse('Trainings list', '#/components/schemas/Training')
      }
    }
  },
  '/api/trainings/my-trainings': {
    get: {
      tags: ['Trainings'],
      summary: 'List trainings in which logged-in employee is enrolled',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: simpleListResponse('My trainings', '#/components/schemas/Training', { includeCount: false })
      }
    }
  },
  '/api/trainings/{id}': {
    get: {
      tags: ['Trainings'],
      summary: 'Get training details',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Training details', '#/components/schemas/Training'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    patch: {
      tags: ['Trainings'],
      summary: 'Update training details',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Training' } } } },
      responses: {
        200: jsonSuccessRef('Training updated', '#/components/schemas/Training'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    delete: {
      tags: ['Trainings'],
      summary: 'Delete training session',
      description: bearerAuthNote(ROLE_GROUPS.EXECUTIVE),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: 'Training deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/trainings/{id}/participants': {
    post: {
      tags: ['Trainings'],
      summary: 'Enroll an employee in a training session',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['employeeId'],
              properties: {
                employeeId: { $ref: '#/components/schemas/ObjectId' },
                remarks: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Participant added', '#/components/schemas/Training'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/trainings/{id}/participants/{participantId}': {
    patch: {
      tags: ['Trainings'],
      summary: 'Update participant completion, score, certificate, or attendance',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/IdParam' },
        { name: 'participantId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                completionStatus: { type: 'string' },
                certificateUrl: { type: 'string' },
                score: { type: 'number' },
                remarks: { type: 'string' },
                completedAt: { type: 'string', format: 'date-time' },
                attendanceItem: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', format: 'date' },
                    status: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Participant updated', '#/components/schemas/Training'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },

  // ======================== STRATEGIC PLANS ========================
  '/api/plans': {
    post: {
      tags: ['Plans'],
      summary: 'Create a strategic/departmental operational plan',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'type', 'department'],
              properties: {
                name: { type: 'string' },
                parentPlan: { $ref: '#/components/schemas/ObjectId', nullable: true },
                type: { type: 'string' },
                department: { type: 'string' },
                keyGoal: { type: 'string' },
                expectedOutput: { type: 'string' },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
                description: { type: 'string' },
                kpis: { type: 'array', items: { type: 'object' } },
                target: { type: 'string' },
                budget: { type: 'number', default: 0 },
                leader: { $ref: '#/components/schemas/ObjectId' },
                teams: { type: 'array', items: { type: 'string' } },
                tasks: { type: 'array', items: { type: 'object' } },
                planDate: { type: 'string', format: 'date' },
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
                supportTeams: { type: 'array', items: { type: 'string' } },
                note: { type: 'string' },
                documents: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Plan created', '#/components/schemas/Plan'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    get: {
      tags: ['Plans'],
      summary: 'List plans with filters',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'department', in: 'query', schema: { type: 'string' } },
        { name: 'type', in: 'query', schema: { type: 'string' } },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'parentPlan', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'leader', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: paginatedListResponse('Plans list', '#/components/schemas/Plan')
      }
    }
  },
  '/api/plans/{id}': {
    get: {
      tags: ['Plans'],
      summary: 'Get plan details',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Plan details', '#/components/schemas/Plan'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    patch: {
      tags: ['Plans'],
      summary: 'Update plan details',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Plan' } } } },
      responses: {
        200: jsonSuccessRef('Plan updated', '#/components/schemas/Plan'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    delete: {
      tags: ['Plans'],
      summary: 'Delete plan',
      description: bearerAuthNote(ROLE_GROUPS.EXECUTIVE),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: 'Plan deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/plans/{id}/approval': {
    patch: {
      tags: ['Plans'],
      summary: 'Approve, reject, or change executive lifecycle status of plan',
      description: bearerAuthNote(ROLE_GROUPS.EXECUTIVE),
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
                status: { type: 'string', enum: ['approved', 'rejected', 'in_progress', 'completed', 'cancelled'] },
                note: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Plan approval status updated', '#/components/schemas/Plan'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/plans/{id}/tasks': {
    post: {
      tags: ['Plans'],
      summary: 'Add a task to a plan',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title'],
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                checklist: { type: 'array', items: { type: 'object' } },
                assignedEmployee: { $ref: '#/components/schemas/ObjectId' },
                dueDate: { type: 'string', format: 'date' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Task added to plan', '#/components/schemas/Plan'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/plans/{id}/tasks/{taskId}': {
    patch: {
      tags: ['Plans'],
      summary: 'Update a task or mark checklist completion inside a plan',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/IdParam' },
        { name: 'taskId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                checklist: { type: 'array', items: { type: 'object' } },
                assignedEmployee: { $ref: '#/components/schemas/ObjectId' },
                doneBy: { $ref: '#/components/schemas/ObjectId' },
                status: { type: 'string' },
                dueDate: { type: 'string', format: 'date' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Plan task updated', '#/components/schemas/Plan'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/api/plans/{id}/documents': {
    post: {
      tags: ['Plans'],
      summary: 'Attach a supporting document to a plan',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'url'],
              properties: {
                title: { type: 'string' },
                type: { type: 'string', default: 'Other' },
                url: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Document attached to plan', '#/components/schemas/Plan'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  }
};
