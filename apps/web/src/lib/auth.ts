import crypto from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { supaFetch } from "./db";

export const SESSION_COOKIE = "ezik_session";
const SECRET = process.env.SESSION_SECRET || "ezik-default-dev-secret-change-in-env";

export interface SessionUser {
  id: string;
  username: string;
}

function signPayload(payloadB64: string): string {
  return crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
}

export function createSessionToken(user: SessionUser): string {
  const payload = {
    id: user.id,
    username: user.username,
    exp: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const sig = signPayload(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expectedSig = signPayload(payloadB64);
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return { id: parsed.id, username: parsed.username };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function authenticateUser(username: string, passwordPlain: string): Promise<SessionUser | null> {
  const rows = await supaFetch<Array<{ id: string; username: string; password_hash: string }>>("ezik_app_users", {
    params: {
      username: `eq.${username.trim()}`,
      select: "id,username,password_hash",
      limit: "1",
    },
  });
  if (!rows.length) return null;
  const user = rows[0];
  const ok = await bcrypt.compare(passwordPlain, user.password_hash);
  if (!ok) return null;
  return { id: user.id, username: user.username };
}
