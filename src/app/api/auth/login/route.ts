import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  setSessionCookie,
  ensureAdminUser,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json()) as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return NextResponse.json(
      { error: "Benutzername und Passwort erforderlich" },
      { status: 400 }
    );
  }

  // Ensure admin exists on first login attempt
  await ensureAdminUser();

  const user = await db.user.findUnique({
    where: { username: username.trim().toLowerCase() },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Ungültige Anmeldedaten" },
      { status: 401 }
    );
  }

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
