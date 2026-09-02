import { NextRequest, NextResponse } from "next/server";
import {
  createLogsAccessToken,
  LOGS_ACCESS_COOKIE_NAME,
  logsAccessCookieOptions,
  verifyLogsPassword,
} from "@/lib/logs-auth";
import { getClientIp, recordAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { getSibatikBaseUrl } from "@/lib/sinergy-sso";

export const runtime = "nodejs";

function redirectToLogs(error?: string) {
  const url = new URL("/logs", getSibatikBaseUrl());
  if (error) url.searchParams.set("error", error);

  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  const actorIp = getClientIp(request);
  const recentFailures = await prisma.auditLog.count({
    where: {
      action: "LOGS_ACCESS_DENIED",
      actorIp,
      occurredAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
  });

  if (recentFailures >= 8) {
    await recordAuditEvent({
      action: "LOGS_ACCESS_RATE_LIMITED",
      actorIp,
      classification: "SECURITY",
      details: { recentFailures },
      severity: "WARNING",
      summary: `Akses /logs dari ${actorIp || "IP tidak diketahui"} dibatasi sementara`,
    });
    return redirectToLogs("blocked");
  }

  const formData = await request.formData();
  const password = formData.get("password");
  const isValid =
    typeof password === "string" && verifyLogsPassword(password);

  if (!isValid) {
    await recordAuditEvent({
      action: "LOGS_ACCESS_DENIED",
      actorIp,
      classification: "LOG_ACCESS",
      details: {
        userAgent: request.headers.get("user-agent")?.slice(0, 240) || null,
      },
      severity: "WARNING",
      summary: `Password /logs salah dari ${actorIp || "IP tidak diketahui"}`,
    });
    return redirectToLogs("invalid");
  }

  await recordAuditEvent({
    action: "LOGS_ACCESS_GRANTED",
    actorIp,
    classification: "LOG_ACCESS",
    details: {
      userAgent: request.headers.get("user-agent")?.slice(0, 240) || null,
    },
    summary: `Akses halaman /logs diberikan untuk ${actorIp || "IP tidak diketahui"}`,
  });

  const response = redirectToLogs();
  response.cookies.set(
    LOGS_ACCESS_COOKIE_NAME,
    createLogsAccessToken(),
    logsAccessCookieOptions
  );
  return response;
}
