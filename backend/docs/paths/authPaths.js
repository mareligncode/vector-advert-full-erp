import { bearerAuthNote, errorResponse, jsonSuccessRef, ROLE_GROUPS } from '../components.js';

export const authPaths = {
  '/api/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a user account (bootstrap CEO or provisioned staff)',
      description:
        'Public only when zero users exist in the system (bootstraps the initial CEO account). After bootstrap, requires Bearer authentication and caller role authorization via `getAllowedRegistrationRoles`.',
      security: [{ bearerAuth: [] }, {}],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email', example: 'staff@vectoradvert.com' },
                password: { type: 'string', minLength: 6, description: 'Optional for admin-provisioned accounts; a temporary password is auto-generated if omitted' },
                roles: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/RoleEnum' },
                  example: ['employee']
                }
              }
            }
          }
        }
      },
      responses: {
        201: jsonSuccessRef('User registered successfully', '#/components/schemas/AuthPayload'),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Authenticate user and obtain JWT token',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'admin@vectoradvert.com' },
                password: { type: 'string', example: 'Password@123' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Login successful', '#/components/schemas/AuthPayload'),
        400: { $ref: '#/components/responses/BadRequest' },
        401: errorResponse('Invalid email or password'),
        403: errorResponse('Account is inactive or suspended')
      }
    }
  },
  '/api/auth/forgot-password': {
    post: {
      tags: ['Auth'],
      summary: 'Request password reset code via email or linked Telegram',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email', example: 'staff@vectoradvert.com' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Reset request processed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  emailDelivered: { type: 'boolean' },
                  telegramDelivered: { type: 'boolean' },
                  resetCode: { type: 'string', description: 'Returned in non-production fallback if delivery channels unavailable' }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/api/auth/reset-password': {
    post: {
      tags: ['Auth'],
      summary: 'Reset password using verification code',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'code', 'newPassword'],
              properties: {
                email: { type: 'string', format: 'email' },
                code: { type: 'string', example: '482910' },
                newPassword: { type: 'string', minLength: 6, example: 'NewStrongPass123' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Password reset successfully', { type: 'object', nullable: true }),
        400: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/api/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Get authenticated user profile',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonSuccessRef('Current user profile', '#/components/schemas/UserSummary'),
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    }
  },
  '/api/auth/change-password': {
    post: {
      tags: ['Auth'],
      summary: 'Change current user password',
      description: bearerAuthNote() + ' Clears `mustChangePassword` and returns a fresh JWT token.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: { type: 'string' },
                newPassword: { type: 'string', minLength: 6, description: 'Must differ from currentPassword' },
                confirmPassword: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('Password changed successfully', '#/components/schemas/AuthPayload'),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    }
  },
  '/api/auth/registration-permissions': {
    get: {
      tags: ['Auth'],
      summary: 'Inspect which roles the current user can provision',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonSuccessRef('Allowed registration roles', {
          type: 'object',
          properties: {
            canRegister: { type: 'boolean' },
            callerRoles: { type: 'array', items: { $ref: '#/components/schemas/RoleEnum' } },
            allowedRoles: { type: 'array', items: { $ref: '#/components/schemas/RoleEnum' } }
          }
        }),
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    }
  },
  '/api/auth/telegram/link-code': {
    post: {
      tags: ['Auth'],
      summary: 'Generate Telegram bot deep-link verification code',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonSuccessRef('Telegram connect code generated', {
          type: 'object',
          properties: {
            connectCode: { type: 'string' },
            deepLink: { type: 'string' },
            isLinked: { type: 'boolean' },
            telegramUsername: { type: 'string', nullable: true }
          }
        }),
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    }
  },
  '/api/auth/telegram/unlink': {
    post: {
      tags: ['Auth'],
      summary: 'Unlink Telegram notifications from current user account',
      description: bearerAuthNote(),
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Telegram account unlinked',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } }
        },
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    }
  },
  '/api/auth/users/{id}/roles': {
    patch: {
      tags: ['Auth'],
      summary: 'Update user roles',
      description: bearerAuthNote(ROLE_GROUPS.EXECUTIVE),
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['roles'],
              properties: {
                roles: { type: 'array', items: { $ref: '#/components/schemas/RoleEnum' } }
              }
            }
          }
        }
      },
      responses: {
        200: jsonSuccessRef('User roles updated', '#/components/schemas/UserSummary'),
        400: { $ref: '#/components/responses/BadRequest' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  }
};
