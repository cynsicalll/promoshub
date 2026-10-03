import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  setSessionCookie,
  ensureAdminUser,
} from "@/lib/auth";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  getClientIp,
  formatRetryAfter,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit check
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${formatRetryAfter(
          limit.retryAfterMs
        )}.`,
      },
      { status: 429 }
    );
  }

  const { username, password } = (await req.json()) as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 }
    );
  }

  // Ensure admin exists on first login attempt
  await ensureAdminUser();

  const user = await db.user.findUnique({
    where: { username: username.trim().toLowerCase() },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    const result = recordFailedAttempt(ip);
    if (result.locked) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Account locked for ${formatRetryAfter(
            result.retryAfterMs
          )}.`,
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Success — clear rate limit
  clearRateLimit(ip);

  const token = createSession({
    userId: user.id,
    username: user.username,
    role: user.role as "ADMIN" | "CUSTOMER",
    displayName: user.displayName,
  });

  const res = NextResponse.json({
    userId: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
  });
  setSessionCookie(res, token);
  return res;
}
