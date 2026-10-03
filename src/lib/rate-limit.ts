// Simple in-memory rate limiter for login brute-force protection.
// Tracks failed attempts per IP address and locks out after too many.

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lockedUntil: number;
}

// Use global to persist across hot reloads in dev
const globalForRateLimit = globalThis as unknown as {
  __rateLimitAttempts?: Map<string, RateLimitEntry>;
};

const attempts: Map<string, RateLimitEntry> =
  globalForRateLimit.__rateLimitAttempts ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.__rateLimitAttempts = attempts;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCK_MS = 15 * 60 * 1000; // lock for 15 minutes

// Clean up old entries periodically
function cleanup() {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now > entry.lockedUntil && now - entry.firstAttempt > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  cleanup();
  const now = Date.now();
  const entry = attempts.get(ip);

  if (entry && entry.lockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.lockedUntil - now,
    };
  }

  return {
    allowed: true,
    remaining: entry ? MAX_ATTEMPTS - entry.count : MAX_ATTEMPTS,
    retryAfterMs: 0,
  };
}

export function recordFailedAttempt(ip: string): {
  locked: boolean;
  retryAfterMs: number;
} {
  const now = Date.now();
  let entry = attempts.get(ip);

  // Create new entry if none exists, or if the window has expired
  if (!entry || (entry.lockedUntil === 0 && now - entry.firstAttempt > WINDOW_MS)) {
    entry = { count: 0, firstAttempt: now, lockedUntil: 0 };
  }

  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_MS;
    attempts.set(ip, entry);
    return { locked: true, retryAfterMs: LOCK_MS };
  }

  attempts.set(ip, entry);
  return { locked: false, retryAfterMs: 0 };
}

export function clearRateLimit(ip: string): void {
  attempts.delete(ip);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function formatRetryAfter(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes >= 1) return `${minutes} minute(s)`;
  return `${Math.ceil(ms / 1000)} second(s)`;
}
