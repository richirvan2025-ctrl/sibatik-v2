import { NextRequest, NextResponse } from "next/server";
import {
  getSinergyLoginUrl,
  resolveSinergyUser,
  verifySinergySignature,
} from "@/lib/sinergy-sso";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/session";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return new NextResponse(message, {
    headers: { "Cache-Control": "no-store" },
    status,
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const signature = request.nextUrl.searchParams.get("sig");

  if (!token || !signature) {
    return NextResponse.redirect(getSinergyLoginUrl());
  }

  if (!verifySinergySignature(token, signature)) {
    return errorResponse("Tanda tangan SSO Sinergy tidak valid.", 401);
  }

  try {
    const user = await resolveSinergyUser(token);
    if (!user) {
      return errorResponse("Sesi Sinergy tidak valid atau pengguna nonaktif.", 401);
    }

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(
      SESSION_COOKIE_NAME,
      createSessionToken(user.id),
      sessionCookieOptions
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error(
      "[SIBATIK SSO] Callback gagal:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return errorResponse("Layanan SSO Sinergy sedang tidak tersedia.", 502);
  }
}
