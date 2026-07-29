import { cache } from "react";
import { connection } from "next/server";
import { prisma } from "./prisma";
import type { AppSession } from "./auth-types";

/**
 * Temporary identity adapter for the SIBATIK module.
 *
 * The standalone login has been removed because authentication will be owned
 * by Sinergy. After the Sinergy flow is inspected, replace the development
 * lookup below with a verified identity supplied by the host system. Keeping
 * this boundary in one server-only module prevents authentication details from
 * leaking into pages and Route Handlers.
 */
export const auth = cache(async (): Promise<AppSession | null> => {
  await connection();

  const developmentEmail = process.env.SIBATIK_DEV_USER_EMAIL?.trim();
  const email =
    developmentEmail ||
    (process.env.NODE_ENV !== "production" ? "admin@idbbali.ac.id" : null);

  // Production must wait for the verified Sinergy identity adapter. There is
  // deliberately no insecure anonymous fallback outside local development.
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
