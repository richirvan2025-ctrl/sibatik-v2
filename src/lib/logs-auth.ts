import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const LOGS_ACCESS_COOKIE_NAME = "sibatik.logs.access";
export const LOGS_ACCESS_TTL_SECONDS = 8 * 60 * 60;

interface LogsAccessPayload {
  exp: number;
  purpose: "system-logs";
  version: 1;
}

function getLogsSessionSecret() {
  return (
    process.env.LOGS_PAGE_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    null
  );
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

export function verifyLogsPassword(password: string) {
  const expected = process.env.LOGS_PAGE_PASSWORD;
  if (!expected) return false;

  const suppliedBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);

  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}

export function createLogsAccessToken() {
  const secret = getLogsSessionSecret();
  if (!secret) {
    throw new Error("Logs page session secret is not configured");
  }

  const payload: LogsAccessPayload = {
    exp: Math.floor(Date.now() / 1000) + LOGS_ACCESS_TTL_SECONDS,
    purpose: "system-logs",
    version: 1,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );

  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifyLogsAccessToken(token: string) {
  const secret = getLogsSessionSecret();
  const [encodedPayload, suppliedSignature, ...extraParts] = token.split(".");

  if (
    !secret ||
    !encodedPayload ||
    !suppliedSignature ||
    extraParts.length > 0
  ) {
    return false;
  }

  const expectedSignature = sign(encodedPayload, secret);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<LogsAccessPayload>;

    return (
      payload.version === 1 &&
      payload.purpose === "system-logs" &&
      typeof payload.exp === "number" &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export async function hasLogsAccess() {
  const token = (await cookies()).get(LOGS_ACCESS_COOKIE_NAME)?.value;
  return token ? verifyLogsAccessToken(token) : false;
}

export const logsAccessCookieOptions = {
  httpOnly: true,
  maxAge: LOGS_ACCESS_TTL_SECONDS,
  path: "/",
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
};
