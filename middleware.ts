import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "gbi_admin_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
    const hasCookie = !!cookie?.value;
    const isLoginPage = pathname === "/admin/login";

    // Jika tidak ada cookie dan mencoba akses halaman admin (bukan login)
    if (!hasCookie && !isLoginPage) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    
    // Jangan redirect otomatis dari login ke admin di middleware 
    // agar pengecekan final dilakukan di komponen AdminPage (untuk validitas token)
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
