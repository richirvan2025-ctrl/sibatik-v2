import { NextRequest, NextResponse } from "next/server";
import {
  getSibatikBaseUrl,
  getSinergyLoginUrl,
  resolveSinergyUser,
  verifySinergySignature,
} from "@/lib/sinergy-sso";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/session";
import {
  actorFromSession,
  getClientIp,
  recordAuditEvent,
} from "@/lib/audit-log";

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
    await recordAuditEvent({
      action: "SSO_LOGIN_REJECTED",
      actorIp: getClientIp(request),
      classification: "SECURITY",
      severity: "WARNING",
      summary: `Login SSO ditolak dari ${getClientIp(request) || "IP tidak diketahui"}: signature tidak valid`,
    });
    return errorResponse("Tanda tangan SSO Sinergy tidak valid.", 401);
  }

  try {
    const user = await resolveSinergyUser(token);
    if (!user) {
      await recordAuditEvent({
        action: "SSO_LOGIN_REJECTED",
        actorIp: getClientIp(request),
        classification: "AUTH",
        severity: "WARNING",
        summary: `Login SSO ditolak dari ${getClientIp(request) || "IP tidak diketahui"}: sesi tidak valid atau user nonaktif`,
      });
      return errorResponse("Sesi Sinergy tidak valid atau pengguna nonaktif.", 401);
    }

    await recordAuditEvent({
      action: "SSO_LOGIN_SUCCESS",
      actor: actorFromSession({ source: "sinergy", user }),
      actorIp: getClientIp(request),
      classification: "AUTH",
      details: { provider: "sinergy", ssoId: user.ssoId },
      resourceId: user.id,
      resourceType: "USER",
      summary: `${user.name} login ke SIBATIK melalui Sinergy`,
    });

    const response = NextResponse.redirect(
      new URL("/dashboard", getSibatikBaseUrl())
    );
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
    await recordAuditEvent({
      action: "SSO_LOGIN_ERROR",
      actorIp: getClientIp(request),
      classification: "AUTH",
      details: {
        error: error instanceof Error ? error.name : "UnknownError",
      },
      severity: "ERROR",
      summary: `Login SSO gagal diproses dari ${getClientIp(request) || "IP tidak diketahui"}`,
    });
    return errorResponse("Layanan SSO Sinergy sedang tidak tersedia.", 502);
  }
}
