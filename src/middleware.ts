import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_HEADER, cookieOptionsFromHeaders } from "@/lib/session-cookie";

export function middleware(request: NextRequest) {
  const sid = request.nextUrl.searchParams.get("sid");
  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  const token = sid || cookieToken;

  const requestHeaders = new Headers(request.headers);
  if (token) requestHeaders.set(SESSION_HEADER, token);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (token) {
    const options = cookieOptionsFromHeaders(request.headers);
    response.cookies.set(SESSION_COOKIE, token, {
      ...options,
      maxAge: 14 * 24 * 60 * 60,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|.*\\..*).*)"],
};
