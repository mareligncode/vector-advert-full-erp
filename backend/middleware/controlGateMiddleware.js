// Option 1 Control Gate Middleware: Polls the standalone Control Microservice with a 5-second cache

const CACHE_TTL_MS = 5000;

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

  const controlServiceUrl = (
    process.env.CONTROL_SERVICE_URL || 'https://vector-advert-full-erp.vercel.app'
  ).replace(/\/+$/, '');
  const failClosed = process.env.CONTROL_FAIL_CLOSED === 'true';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${controlServiceUrl}/api/control/status`, {
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
    if (failClosed) {
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
