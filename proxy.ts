import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, verifySessionToken } from "@/lib/ctd/admin-session";

const LOGIN_PATH = "/tournament-director/admin/login";

/** Next.js 16 renamed the middleware convention to proxy; behaviour is unchanged. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (await verifySessionToken(token)) {
    return NextResponse.next();
  }

  // API callers get a status code; browsers get sent to the login screen.
  if (pathname.startsWith("/tournament-director/api/admin")) {
    return NextResponse.json(
      { ok: false, error: "Not authorized." },
      { status: 401 },
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.search = "";

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/tournament-director/admin/:path*",
    "/tournament-director/api/admin/:path*",
  ],
};
