import { NextRequest, NextResponse } from "next/server";
import { getClientIp, recordAuditEvent } from "@/lib/audit-log";
import {
  LOGS_ACCESS_COOKIE_NAME,
  logsAccessCookieOptions,
} from "@/lib/logs-auth";
import { getSibatikBaseUrl } from "@/lib/sinergy-sso";

export async function POST(request: NextRequest) {
  const actorIp = getClientIp(request);
  await recordAuditEvent({
    action: "LOGS_ACCESS_ENDED",
    actorIp,
    classification: "LOG_ACCESS",
    summary: `Sesi halaman /logs diakhiri untuk ${actorIp || "IP tidak diketahui"}`,
  });

  const response = NextResponse.redirect(
    new URL("/logs", getSibatikBaseUrl()),
    303
  );
  response.cookies.set(LOGS_ACCESS_COOKIE_NAME, "", {
    ...logsAccessCookieOptions,
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
