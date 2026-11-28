import { readState, writeState } from '../../lib/store.js';

const CONTROL_SECRET = process.env.CONTROL_SECRET || 'vector-master-key-2026';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-control-key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const providedKey = req.headers['x-control-key'];
  if (providedKey !== CONTROL_SECRET) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid Control Secret Key'
    });
  }

  try {
    const parsed = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
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
    return res.status(200).json({ success: true, ...nextState });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid request'
    });
  }
}
