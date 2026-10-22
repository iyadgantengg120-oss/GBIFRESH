import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  getCookieValue,
  verifyAdminSession,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie");
  const token = getCookieValue(cookieHeader, ADMIN_COOKIE_NAME);
  const session = verifyAdminSession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, username: session.username });
}
