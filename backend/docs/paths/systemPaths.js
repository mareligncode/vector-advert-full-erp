export const systemPaths = {
  '/': {
    get: {
      tags: ['System'],
      summary: 'API health check',
      description: 'Public health probe confirming the Express server is online and providing links to Swagger documentation.',
      security: [],
      responses: {
        200: {
          description: 'Backend API is online',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'online' },
                  message: { type: 'string', example: 'Vector Advert Full ERP - HR Backend API is running' },
                  version: { type: 'string', example: '1.0.0' },
                  docsUrl: { type: 'string', example: '/api-docs' },
                  openApiSpecUrl: { type: 'string', example: '/api-docs.json' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api-docs.json': {
    get: {
      tags: ['System'],
      summary: 'Download raw OpenAPI 3.0.3 JSON specification',
      description: 'Returns the complete OpenAPI 3.0.3 JSON document for Postman, Insomnia, or SDK code generation.',
      security: [],
      responses: {
        200: {
          description: 'OpenAPI 3.0.3 specification JSON',
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        }
      }
    }
  }
};
