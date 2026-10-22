import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const ADMIN_COOKIE_NAME = "gbi_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_PASSWORD = "GBI#2026Admin";

function sessionSecret() {
  return "gbi-admin-session-s3cret-key-2026";
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const hashedBuffer = Buffer.from(key, "hex");
  const suppliedBuffer = scryptSync(password, salt, 64);
  if (hashedBuffer.length !== suppliedBuffer.length) return false;
  return timingSafeEqual(hashedBuffer, suppliedBuffer);
}

export function signAdminSession(username: string, issuedAt = Math.floor(Date.now() / 1000)) {
  const payload = `${username}.${issuedAt}`;
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminSession(token?: string | null) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 3) return null;
    const username = parts[0];
    const issuedAt = Number(parts[1]);
    const signature = parts.slice(2).join(".");
    if (!username || !Number.isFinite(issuedAt) || !signature) return null;

    const payload = `${username}.${issuedAt}`;
    const expected = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
    
    // timingSafeEqual butuh buffer dengan panjang yang sama
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return null;
    
    const ok = timingSafeEqual(sigBuf, expBuf);
    if (!ok) return null;

    const age = Math.floor(Date.now() / 1000) - issuedAt;
    if (age > ADMIN_SESSION_MAX_AGE) return null;
    return { username, issuedAt };
  } catch (err) {
    return null;
  }
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function isAdminAuthorizedFromCookieHeader(cookieHeader: string | null) {
  const token = getCookieValue(cookieHeader, ADMIN_COOKIE_NAME);
  return !!verifyAdminSession(token);
}

export async function ensureAdminCredentials() {
  const [usernameRow] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, "adminUsername"))
    .limit(1);
  const [passwordRow] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, "adminPasswordHash"))
    .limit(1);

  const username = usernameRow?.value || DEFAULT_ADMIN_USERNAME;
  const passwordHash = passwordRow?.value || hashPassword(DEFAULT_ADMIN_PASSWORD);

  if (!usernameRow) {
    await db
      .insert(siteSettings)
      .values({ key: "adminUsername", value: username })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: username },
      });
  }

  if (!passwordRow) {
    await db
      .insert(siteSettings)
      .values({ key: "adminPasswordHash", value: passwordHash })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: passwordHash },
      });
  }

  return { username, passwordHash };
}
