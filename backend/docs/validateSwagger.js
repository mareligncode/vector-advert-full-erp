import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerSpec from './swagger.js';

import authRoutes from '../routes/authRoutes.js';
import employeeRoutes from '../routes/employeeRoutes.js';
import attendanceRoutes from '../routes/attendanceRoutes.js';
import overtimeRoutes from '../routes/overtimeRoutes.js';
import fieldVisitRoutes from '../routes/fieldVisitRoutes.js';
import leaveRoutes from '../routes/leaveRoutes.js';
import recruitmentRoutes from '../routes/recruitmentRoutes.js';
import internshipRoutes from '../routes/internshipRoutes.js';
import uploadRoutes from '../routes/uploadRoutes.js';
import evidenceRoutes from '../routes/evidenceRoutes.js';
import clearanceRoutes from '../routes/clearanceRoutes.js';
import professionalUpgradeRoutes from '../routes/professionalUpgradeRoutes.js';
import trainingRoutes from '../routes/trainingRoutes.js';
import planRoutes from '../routes/planRoutes.js';
import payrollRoutes from '../routes/payrollRoutes.js';
import inventoryRoutes from '../routes/inventoryRoutes.js';
import grvRoutes from '../routes/grvRoutes.js';
import storeRequestRoutes from '../routes/storeRequestRoutes.js';
import procurementRoutes from '../routes/procurementRoutes.js';
import supplierCreditRoutes from '../routes/supplierCreditRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mountedRouters = [
  ['/api/auth', authRoutes],
  ['/api/employees', employeeRoutes],
  ['/api/attendance', attendanceRoutes],
  ['/api/overtime', overtimeRoutes],
  ['/api/field-visits', fieldVisitRoutes],
  ['/api/leave', leaveRoutes],
  ['/api/recruitment', recruitmentRoutes],
  ['/api/internships', internshipRoutes],
  ['/api/upload', uploadRoutes],
  ['/api/evidence', evidenceRoutes],
  ['/api/clearances', clearanceRoutes],
  ['/api/professional-upgrades', professionalUpgradeRoutes],
  ['/api/trainings', trainingRoutes],
  ['/api/plans', planRoutes],
  ['/api/payroll', payrollRoutes],
  ['/api/inventory', inventoryRoutes],
  ['/api/grv', grvRoutes],
  ['/api/store-requests', storeRequestRoutes],
  ['/api/procurement', procurementRoutes],
  ['/api/supplier-credits', supplierCreditRoutes]
];

const normalizeExpressPathToOpenApi = (basePath, routePath) => {
  const joined = `${basePath}${routePath === '/' ? '' : routePath}`.replace(/\/+/g, '/');
  return joined.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
};

const expressOperations = new Set(['GET /', 'GET /api-docs.json']);

for (const [basePath, router] of mountedRouters) {
  for (const layer of router.stack || []) {
    if (!layer.route) continue;
    const pathStr = normalizeExpressPathToOpenApi(basePath, layer.route.path);
    for (const [method, enabled] of Object.entries(layer.route.methods || {})) {
      if (enabled) {
        expressOperations.add(`${method.toUpperCase()} ${pathStr}`);
      }
    }
  }
}

const swaggerOperations = new Set();
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);
const brokenRefs = [];
const emptyDescriptionsOrResponses = [];

const collectRefs = (node, loc = 'root') => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item, idx) => collectRefs(item, `${loc}[${idx}]`));
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === '$ref' && typeof v === 'string') {
      if (!v.startsWith('#/components/')) {
        brokenRefs.push(`${loc}: unsupported $ref ${v}`);
      } else {
        const parts = v.replace('#/components/', '').split('/');
        let target = swaggerSpec.components;
        for (const p of parts) {
          target = target?.[p];
        }
        if (!target) {
          brokenRefs.push(`${loc}: unresolved $ref ${v}`);
        }
      }
    } else {
      collectRefs(v, `${loc}.${k}`);
    }
  }
};

collectRefs(swaggerSpec);

for (const [p, pathItem] of Object.entries(swaggerSpec.paths || {})) {
  for (const [method, op] of Object.entries(pathItem || {})) {
    if (!HTTP_METHODS.has(method.toLowerCase())) continue;
    const key = `${method.toUpperCase()} ${p}`;
    swaggerOperations.add(key);

    if (!op.summary || !op.tags?.length || !op.responses || Object.keys(op.responses).length === 0) {
      emptyDescriptionsOrResponses.push(key);
    }

    const pathParams = [...p.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
    const declaredParams = new Set(
      (op.parameters || []).map((param) => {
        if (param.$ref === '#/components/parameters/IdParam') return 'id';
        return param.in === 'path' ? param.name : null;
      }).filter(Boolean)
    );
    for (const pp of pathParams) {
      if (!declaredParams.has(pp)) {
        emptyDescriptionsOrResponses.push(`${key} missing path param {${pp}}`);
      }
    }
  }
}

const missingInSwagger = [...expressOperations].filter((op) => !swaggerOperations.has(op)).sort();
const extraInSwagger = [...swaggerOperations].filter((op) => !expressOperations.has(op)).sort();

const shouldWriteJson = process.argv.includes('--write');
if (shouldWriteJson) {
  const outPath = path.resolve(__dirname, 'openapi.json');
  fs.writeFileSync(outPath, `${JSON.stringify(swaggerSpec, null, 2)}\n`, 'utf8');
  console.log(`Exported OpenAPI spec to ${outPath}`);
}

console.log(`Express operations discovered: ${expressOperations.size}`);
console.log(`Swagger operations documented: ${swaggerOperations.size}`);
console.log(`Unique OpenAPI paths: ${Object.keys(swaggerSpec.paths || {}).length}`);
console.log(`Tags defined: ${(swaggerSpec.tags || []).length}`);
console.log(`Component schemas: ${Object.keys(swaggerSpec.components?.schemas || {}).length}`);

if (missingInSwagger.length || extraInSwagger.length || brokenRefs.length || emptyDescriptionsOrResponses.length) {
  if (missingInSwagger.length) console.error('Missing in Swagger:', missingInSwagger);
  if (extraInSwagger.length) console.error('Extra in Swagger (not in routers):', extraInSwagger);
  if (brokenRefs.length) console.error('Broken $ref pointers:', brokenRefs);
  if (emptyDescriptionsOrResponses.length) console.error('Incomplete operations:', emptyDescriptionsOrResponses);
  process.exit(1);
}

console.log('ALL CHECKS PASSED: 100% route parity, valid $refs, and complete path parameters/responses.');
