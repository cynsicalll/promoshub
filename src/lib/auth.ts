import crypto from "crypto";
import { NextRequest } from "next/server";
import { db } from "./db";

// ─── Config ───────────────────────────────────────────────────────────────────

const SESSION_COOKIE = "promohub_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const SECRET =
  process.env.AUTH_SECRET || "promohub-dev-secret-key-please-change-in-production";

// Admin credentials (hardcoded for the personal app)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "CarDay123!.";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = "ADMIN" | "CUSTOMER";

export interface SessionUser {
  userId: string;
  username: string;
  role: Role;
  displayName: string | null;
}

// ─── Password hashing (scrypt) ────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verifyHash = crypto.scryptSync(password, salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  } catch {
    return false;
  }
}

// ─── Session tokens (HMAC-signed) ─────────────────────────────────────────────

interface TokenPayload {
  userId: string;
  username: string;
  role: Role;
  displayName: string | null;
  exp: number;
}

export function createSession(user: SessionUser): string {
  const payload: TokenPayload = {
    userId: user.userId,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    exp: Date.now() + SESSION_MAX_AGE,
  };
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifySession(token: string): SessionUser | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expectedSig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  if (sig !== expectedSig) return null;
  try {
    const payload: TokenPayload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    );
    if (payload.exp < Date.now()) return null;
    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      displayName: payload.displayName,
    };
  } catch {
    return null;
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export function setSessionCookie(response: Response, token: string): void {
  const isProd = process.env.NODE_ENV === "production";
  const cookie = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE / 1000}${isProd ? "; Secure" : ""}`;
  response.headers.set("Set-Cookie", cookie);
}

export function clearSessionCookie(response: Response): void {
  const isProd = process.env.NODE_ENV === "production";
  const cookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? "; Secure" : ""}`;
  response.headers.set("Set-Cookie", cookie);
}

// ─── Request helpers ──────────────────────────────────────────────────────────

export function getSessionFromRequest(req: NextRequest): SessionUser | null {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  return verifySession(cookie);
}

// ─── Admin user management ────────────────────────────────────────────────────

export async function ensureAdminUser(): Promise<void> {
  const existing = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (existing) {
    // Update password if it has changed
    if (!verifyPassword(ADMIN_PASSWORD, existing.passwordHash)) {
      await db.user.update({
        where: { id: existing.id },
        data: { passwordHash: hashPassword(ADMIN_PASSWORD) },
      });
      console.log("Admin password updated.");
    }
    return;
  }
  await db.user.create({
    data: {
      username: ADMIN_USERNAME,
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: "ADMIN",
      displayName: "Administrator",
    },
  });
  console.log("Admin user created.");
}

// ─── Auth check helpers for API routes ────────────────────────────────────────

export async function requireAdmin(req: NextRequest): Promise<SessionUser | null> {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function requireUser(req: NextRequest): Promise<SessionUser | null> {
  const session = getSessionFromRequest(req);
  if (!session) return null;
  return session;
}
