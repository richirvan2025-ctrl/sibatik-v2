import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "sibatik.session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

interface SessionPayload {
  exp: number;
  userId: string;
  version: 1;
}

function getSessionSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || null;
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

export function createSessionToken(userId: string) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("SIBATIK session secret is not configured");
  }

  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    userId,
    version: 1,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );

  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const secret = getSessionSecret();
  const [encodedPayload, providedSignature, ...extraParts] = token.split(".");

  if (!secret || !encodedPayload || !providedSignature || extraParts.length > 0) {
    return null;
  }

  const expectedSignature = sign(encodedPayload, secret);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<SessionPayload>;

    if (
      payload.version !== 1 ||
      typeof payload.userId !== "string" ||
      !payload.userId ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  maxAge: SESSION_TTL_SECONDS,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
