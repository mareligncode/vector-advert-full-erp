import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readState, writeState } from './lib/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.CONTROL_PORT || process.env.PORT || 5050;
const CONTROL_SECRET = process.env.CONTROL_SECRET || 'vector-master-key-2026';
const HTML_FILE = path.join(__dirname, 'index.html');

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-control-key'
  });
  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-control-key'
    });
    return res.end();
  }

  // 1. Serve Single-File HTML Control UI
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = fs.readFileSync(HTML_FILE, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  // 2. Public/ERP Status Endpoint
  if (req.method === 'GET' && req.url === '/api/control/status') {
    const state = await readState();
    return sendJson(res, 200, { success: true, ...state });
  }

  // 3. Master Toggle Endpoint (Protected by x-control-key)
  if (req.method === 'POST' && req.url === '/api/control/toggle') {
    const providedKey = req.headers['x-control-key'];
    if (providedKey !== CONTROL_SECRET) {
      return sendJson(res, 401, {
        success: false,
        message: 'Unauthorized: Invalid Control Secret Key'
      });
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const current = await readState();
        const nextEnabled =
          typeof parsed.systemEnabled === 'boolean'
            ? parsed.systemEnabled
            : !current.systemEnabled;

        const nextState = {
          systemEnabled: nextEnabled,
          message:
            typeof parsed.message === 'string' && parsed.message.trim()
              ? parsed.message.trim()
              : current.message,
          updatedAt: new Date().toISOString()
        };

        await writeState(nextState);
        return sendJson(res, 200, { success: true, ...nextState });
      } catch (err) {
        return sendJson(res, 400, { success: false, message: 'Invalid JSON body' });
      }
    });
    return;
  }

  sendJson(res, 404, { success: false, message: 'Not Found' });
});

server.listen(PORT, () => {
  console.log(`Vector Control Microservice running on http://localhost:${PORT}`);
});
