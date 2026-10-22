import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  ensureAdminCredentials,
  signAdminSession,
  verifyPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");

    const creds = await ensureAdminCredentials();
    const valid =
      username === creds.username && verifyPassword(password, creds.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 },
      );
    }

    const token = signAdminSession(username);
    const res = NextResponse.json({ ok: true, username });
    
    // Gunakan pengaturan cookie yang lebih permisif untuk preview
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false, // Matikan secure sementara agar stabil di preview browser
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    
    return res;
  } catch (err) {
    console.error("POST /api/admin/login error:", err);
    return NextResponse.json({ error: "Gagal login" }, { status: 500 });
  }
}
