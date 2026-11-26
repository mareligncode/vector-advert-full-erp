import { bearerAuthNote, jsonSuccessRef, paginatedListResponse, ROLE_GROUPS, simpleListResponse } from '../components.js';

export const recruitmentInternshipPaths = {
  // ======================== RECRUITMENT - JOBS ========================
  '/api/recruitment/jobs': {
    get: {
      tags: ['Recruitment'],
      summary: 'List job postings',
      description: 'Public callers only see `published` job postings. Authenticated management callers may filter any status.',
      security: [{ bearerAuth: [] }, {}],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'published', 'closed', 'on_hold', 'archived'] } },
        { name: 'department', in: 'query', schema: { type: 'string' } },
        { name: 'employmentType', in: 'query', schema: { type: 'string' } },
        { name: 'experienceLevel', in: 'query', schema: { type: 'string' } },
        { name: 'search', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: paginatedListResponse('Job postings list', '#/components/schemas/JobPosting')
      }
    },
    post: {
      tags: ['Recruitment'],
      summary: 'Create a new job posting',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['jobTitle', 'department'],
              properties: {
                jobTitle: { type: 'string' },
                department: { type: 'string' },
                location: { type: 'string' },
                employmentType: { type: 'string', enum: ['full_time', 'part_time', 'contract', 'internship'] },
                experienceLevel: { type: 'string', enum: ['entry', 'mid', 'senior', 'lead', 'executive'] },
                jobDescription: { type: 'string' },
                jobRequirements: { type: 'array', items: { type: 'string' } },
                postingStatus: { type: 'string', enum: ['draft', 'published', 'closed', 'on_hold', 'archived'], default: 'draft' },
                numberOfOpenings: { type: 'integer', default: 1 },
                applicationDeadline: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Job posting created', '#/components/schemas/JobPosting'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/recruitment/jobs/{id}': {
    get: {
      tags: ['Recruitment'],
      summary: 'Get job posting details',
      description: 'Public access allowed only when `postingStatus` is `published` (403 otherwise without auth).',
      security: [{ bearerAuth: [] }, {}],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Job posting details', '#/components/schemas/JobPosting'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    put: {
      tags: ['Recruitment'],
      summary: 'Update a job posting',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/JobPosting' } } } },
      responses: {
        200: jsonSuccessRef('Job posting updated', '#/components/schemas/JobPosting'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    delete: {
      tags: ['Recruitment'],
      summary: 'Delete job posting and cascade delete associated applications',
      description: bearerAuthNote(ROLE_GROUPS.EXECUTIVE),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: 'Job posting deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/recruitment/jobs/{id}/status': {
    patch: {
      tags: ['Recruitment'],
      summary: 'Change job posting status',
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
                status: { type: 'string', enum: ['draft', 'published', 'closed', 'on_hold', 'archived'] }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Job posting status updated', '#/components/schemas/JobPosting'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/recruitment/interviews': {
    get: {
      tags: ['Recruitment'],
      summary: 'List scheduled interviews across job applications',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['scheduled', 'completed', 'cancelled', 'no_show'] } },
        { name: 'interviewerId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
      ],
      responses: {
        200: simpleListResponse('Scheduled interviews list', '#/components/schemas/Interview'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/recruitment/applications': {
    post: {
      tags: ['Recruitment'],
      summary: 'Submit a public job application',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['jobPostingId', 'applicantName', 'applicantContact'],
              properties: {
                jobPostingId: { $ref: '#/components/schemas/ObjectId' },
                applicantName: { type: 'string', example: 'Dawit Bekele' },
                applicantContact: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' }
                  }
                },
                resume: { type: 'string' },
                portfolioLink: { type: 'string' },
                linkedInLink: { type: 'string' },
                coverLetter: { type: 'string' },
                yearsOfExperience: { type: 'number' },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Application submitted', '#/components/schemas/JobApplication'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    },
    get: {
      tags: ['Recruitment'],
      summary: 'List job applications',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'jobPostingId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'rating', in: 'query', schema: { type: 'number' } }
      ],
      responses: {
        200: paginatedListResponse('Job applications list', '#/components/schemas/JobApplication'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/recruitment/applications/{id}': {
    get: {
      tags: ['Recruitment'],
      summary: 'Get job application details',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Job application details', '#/components/schemas/JobApplication'),
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    delete: {
      tags: ['Recruitment'],
      summary: 'Delete job application',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: 'Application deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/recruitment/applications/{id}/status': {
    patch: {
      tags: ['Recruitment'],
      summary: 'Update application pipeline status, rating, and HR notes',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                applicationStatus: {
                  type: 'string',
                  enum: ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn']
                },
                applicantRating: { type: 'number', minimum: 1, maximum: 5 },
                applicationNotes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Application status updated', '#/components/schemas/JobApplication'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/recruitment/applications/{id}/attachments': {
    post: {
      tags: ['Recruitment'],
      summary: 'Add CV or portfolio attachment to an application',
      description: 'Supports `multipart/form-data` (`file`) or JSON attachment metadata.',
      security: [{ bearerAuth: [] }, {}],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: { type: 'string', format: 'binary' },
                title: { type: 'string' },
                fileUrl: { type: 'string' },
                fileName: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Attachment uploaded', '#/components/schemas/JobApplication'),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/api/recruitment/applications/{id}/attachments/{attachmentId}': {
    delete: {
      tags: ['Recruitment'],
      summary: 'Delete an application attachment',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/IdParam' },
        { name: 'attachmentId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Attachment removed', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/recruitment/applications/{id}/convert-to-employee': {
    post: {
      tags: ['Recruitment'],
      summary: 'Hire applicant and convert application to an Employee record',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['employeeNumber'],
              properties: {
                employeeNumber: { type: 'string', example: 'EMP-0105' },
                basicSalary: { type: 'number' },
                jobTitle: { type: 'string' },
                department: { type: 'string' },
                managerId: { $ref: '#/components/schemas/ObjectId' },
                workLocation: { type: 'string' },
                branch: { type: 'string' },
                employmentType: { type: 'string' },
                probationEndDate: { type: 'string', format: 'date' },
                createUserAccount: { type: 'boolean', default: true },
                password: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Applicant converted to employee', '#/components/schemas/Employee'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/recruitment/applications/{id}/interviews': {
    post: {
      tags: ['Recruitment'],
      summary: 'Schedule an interview for a job application',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['scheduledDate'],
              properties: {
                interviewFormat: { type: 'string', enum: ['in-person', 'online', 'phone'], default: 'in-person' },
                scheduledDate: { type: 'string', format: 'date-time' },
                interviewLocation: { type: 'string' },
                onlineMeetingLink: { type: 'string' },
                meetingLinkSendingStatus: { type: 'string', enum: ['pending', 'sent', 'failed'], default: 'pending' },
                interviewerId: { $ref: '#/components/schemas/ObjectId' },
                interviewNotes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Interview scheduled', '#/components/schemas/JobApplication'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/recruitment/applications/{applicationId}/interviews/{interviewId}': {
    put: {
      tags: ['Recruitment'],
      summary: 'Update scheduled interview details',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'applicationId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'interviewId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Interview' } } } },
      responses: {
        200: jsonSuccessRef('Interview updated', '#/components/schemas/JobApplication'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    delete: {
      tags: ['Recruitment'],
      summary: 'Cancel/remove a scheduled interview',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'applicationId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'interviewId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      responses: {
        200: jsonSuccessRef('Interview deleted', '#/components/schemas/JobApplication'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/recruitment/applications/{applicationId}/interviews/{interviewId}/feedback': {
    patch: {
      tags: ['Recruitment'],
      summary: 'Record interview scorecard feedback and hiring recommendation',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'applicationId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'interviewId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                interviewFeedback: { type: 'string' },
                hiringDecision: { type: 'string', enum: ['pending', 'recommended', 'strong_hire', 'hold', 'rejected'] },
                interviewScore: { type: 'number' },
                interviewStatus: { type: 'string', default: 'completed' },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Interview feedback recorded', '#/components/schemas/JobApplication'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/recruitment/applications/{applicationId}/interviews/{interviewId}/attachments': {
    post: {
      tags: ['Recruitment'],
      summary: 'Upload interview assessment or scorecard attachment',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'applicationId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'interviewId', in: 'path', required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: { file: { type: 'string', format: 'binary' }, fileUrl: { type: 'string' } }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Interview attachment added', '#/components/schemas/JobApplication'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },

  // ======================== INTERNSHIPS ========================
  '/api/internships': {
    get: {
      tags: ['Internships'],
      summary: 'List internships and apprenticeship programs',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['applied', 'active', 'completed', 'terminated', 'withdrawn', 'converted_to_employee'] } },
        { name: 'type', in: 'query', schema: { type: 'string' } },
        { name: 'department', in: 'query', schema: { type: 'string' } },
        { name: 'supervisorId', in: 'query', schema: { $ref: '#/components/schemas/ObjectId' } },
        { name: 'search', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: paginatedListResponse('Internships list', '#/components/schemas/Internship'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    post: {
      tags: ['Internships'],
      summary: 'Create a new intern/trainee profile',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email'],
              properties: {
                internshipNumber: { type: 'string' },
                name: { $ref: '#/components/schemas/PersonName' },
                gender: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string', format: 'email' },
                address: { type: 'object' },
                emergencyContact: { type: 'object' },
                type: { type: 'string', default: 'tutorial' },
                stipendAmount: { type: 'number', default: 0 },
                academicProfile: { type: 'object' },
                placement: { type: 'object' },
                documents: { type: 'array', items: { type: 'object' } },
                notes: { type: 'string' },
                createUserAccount: { type: 'boolean' },
                password: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Internship record created', '#/components/schemas/Internship'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/internships/{id}': {
    get: {
      tags: ['Internships'],
      summary: 'Get internship details',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: jsonSuccessRef('Internship details', '#/components/schemas/Internship'),
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    put: {
      tags: ['Internships'],
      summary: 'Update internship profile',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Internship' } } } },
      responses: {
        200: jsonSuccessRef('Internship updated', '#/components/schemas/Internship'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    delete: {
      tags: ['Internships'],
      summary: 'Delete internship record',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: 'Internship deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/internships/{id}/status': {
    patch: {
      tags: ['Internships'],
      summary: 'Update internship lifecycle status',
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
                status: { type: 'string', enum: ['applied', 'active', 'completed', 'terminated', 'withdrawn', 'converted_to_employee'] },
                note: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Internship status updated', '#/components/schemas/Internship'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/internships/{id}/documents': {
    post: {
      tags: ['Internships'],
      summary: 'Upload intern document or university letter',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: { type: 'string', format: 'binary' },
                description: { type: 'string' },
                fileName: { type: 'string' },
                fileUrl: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Internship document uploaded', '#/components/schemas/Internship'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/internships/{id}/documents/{documentId}': {
    delete: {
      tags: ['Internships'],
      summary: 'Delete an intern document',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/IdParam' },
        { name: 'documentId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Document deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/internships/{id}/evaluations': {
    post: {
      tags: ['Internships'],
      summary: 'Record intern performance evaluation and certificate',
      description: bearerAuthNote(ROLE_GROUPS.MANAGEMENT),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                feedback: { type: 'string' },
                certificateIssued: { type: 'boolean' },
                certificateUrl: { type: 'string' },
                evaluatedBy: { $ref: '#/components/schemas/ObjectId' },
                attachments: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Evaluation recorded', '#/components/schemas/Internship'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/internships/{id}/convert-to-employee': {
    post: {
      tags: ['Internships'],
      summary: 'Convert intern into full Employee',
      description: bearerAuthNote(ROLE_GROUPS.HR_ADMIN),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['employeeNumber'],
              properties: {
                employeeNumber: { type: 'string', example: 'EMP-0120' },
                basicSalary: { type: 'number' },
                jobTitle: { type: 'string' },
                department: { type: 'string' },
                managerId: { $ref: '#/components/schemas/ObjectId' },
                workLocation: { type: 'string' },
                branch: { type: 'string' },
                employmentType: { type: 'string' },
                probationEndDate: { type: 'string', format: 'date' }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('Intern converted to employee', '#/components/schemas/Employee'),
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  }
};
