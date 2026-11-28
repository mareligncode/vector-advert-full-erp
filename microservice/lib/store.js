import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_KEY = 'vector_erp_control_state';

// Fallback file path: /tmp on Vercel if Redis isn't configured yet, local state.json otherwise
const STATE_FILE = process.env.VERCEL
  ? '/tmp/vector_control_state.json'
  : path.resolve(__dirname, '../state.json');

export const DEFAULT_STATE = {
  systemEnabled: true,
  message:
    'The system encountered an unusual problem. There may be unauthorized or malicious activity detected, or the server contract has been paused.',
  updatedAt: new Date().toISOString()
};

export const readState = async () => {
  // 1. Prefer Upstash Redis REST API (Persistent across all Vercel serverless instances)
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const res = await fetch(`${REDIS_URL}/get/${REDIS_KEY}`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          return { ...DEFAULT_STATE, ...JSON.parse(json.result) };
        }
      }
    } catch (err) {
      console.error('Redis read error:', err.message);
    }
    return { ...DEFAULT_STATE };
  }

  // 2. Fallback to local file (or /tmp on Vercel)
  try {
    if (!fs.existsSync(STATE_FILE)) {
      fs.writeFileSync(STATE_FILE, JSON.stringify(DEFAULT_STATE, null, 2));
      return { ...DEFAULT_STATE };
    }
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
};

export const writeState = async (newState) => {
  if (REDIS_URL && REDIS_TOKEN) {
    const res = await fetch(`${REDIS_URL}/set/${REDIS_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(JSON.stringify(newState))
    });
    if (!res.ok) {
      throw new Error(`Failed to persist state to Redis (${res.status})`);
    }
    return;
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));
};
