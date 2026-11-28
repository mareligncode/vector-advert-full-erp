// Option 1 Control Gate Middleware: Polls the standalone Control Microservice with a 5-second cache

const CONTROL_SERVICE_URL = process.env.CONTROL_SERVICE_URL || 'http://localhost:5050';
const CACHE_TTL_MS = 5000;
const FAIL_CLOSED = process.env.CONTROL_FAIL_CLOSED === 'true';

let cachedState = {
  systemEnabled: true,
  message:
    'The system encountered an unusual problem. There may be unauthorized or malicious activity detected, or the server contract has been paused.',
  fetchedAt: 0
};

const fetchControlState = async () => {
  const now = Date.now();
  if (now - cachedState.fetchedAt < CACHE_TTL_MS) {
    return cachedState;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(`${CONTROL_SERVICE_URL}/api/control/status`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      cachedState = {
        systemEnabled: data.systemEnabled !== false,
        message: data.message || cachedState.message,
        fetchedAt: now
      };
    }
  } catch {
    // If Control Microservice is unreachable: Fail-Open by default unless CONTROL_FAIL_CLOSED=true
    if (FAIL_CLOSED) {
      cachedState = {
        systemEnabled: false,
        message: 'Control plane unreachable. System locked.',
        fetchedAt: now
      };
    } else {
      cachedState.fetchedAt = now;
    }
  }

  return cachedState;
};

export const controlGateMiddleware = async (req, res, next) => {
  const state = await fetchControlState();
  if (!state.systemEnabled) {
    return res.status(503).json({
      success: false,
      code: 'SYSTEM_PAUSED',
      message: state.message
    });
  }
  return next();
};
