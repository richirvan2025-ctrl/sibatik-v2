import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { AppSession } from "./auth-types";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

/**
 * SIBATIK does not own a login screen. Sinergy validates the user once through
 * /sso/callback, then this adapter resolves the short-lived signed SIBATIK
 * session for Server Components and Route Handlers.
 */
export const auth = cache(async (): Promise<AppSession | null> => {
  const sessionToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const sessionPayload = sessionToken
    ? verifySessionToken(sessionToken)
    : null;

  if (sessionPayload) {
    const user = await prisma.user.findFirst({
      where: {
        id: sessionPayload.userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    if (user) {
      return {
        user,
        source: "sinergy",
      };
    }
  }

  const developmentEmail = process.env.SIBATIK_DEV_USER_EMAIL?.trim();
  const email =
    developmentEmail ||
    (process.env.NODE_ENV !== "production" ? "admin@idbbali.ac.id" : null);

  // There is deliberately no fixed-user fallback in production.
  if (!email) return null;

  const user = await prisma.user.findFirst({
    where: {
      email,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
    },
  });

  if (!user) return null;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    source: "development",
  };
});
