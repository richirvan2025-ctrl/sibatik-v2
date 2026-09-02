import "server-only";

import type {
  AuditClassification,
  AuditSeverity,
  AuditSource,
  Prisma,
} from "@prisma/client";
import type { AppSession } from "@/lib/auth-types";
import { prisma } from "@/lib/prisma";

interface AuditActor {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

interface RecordAuditEventInput {
  action: string;
  actor?: AuditActor | null;
  actorIp?: string | null;
  classification: AuditClassification;
  details?: Prisma.InputJsonValue;
  occurredAt?: Date;
  resourceId?: string | null;
  resourceType?: string | null;
  severity?: AuditSeverity;
  source?: AuditSource;
  summary: string;
}

export function actorFromSession(session: AppSession): AuditActor {
  return {
    email: session.user.email,
    id: session.user.id,
    name: session.user.name,
    role: session.user.role,
  };
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    forwarded ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  );
}

export async function recordAuditEvent(input: RecordAuditEventInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        action: input.action,
        actorEmail: input.actor?.email || null,
        actorId: input.actor?.id || null,
        actorIp: input.actorIp || null,
        actorName: input.actor?.name || null,
        actorRole: input.actor?.role || null,
        classification: input.classification,
        details: input.details,
        occurredAt: input.occurredAt,
        resourceId: input.resourceId || null,
        resourceType: input.resourceType || null,
        severity: input.severity,
        source: input.source,
        summary: input.summary,
      },
    });
  } catch (error) {
    console.error(
      "[AUDIT] Failed to persist event:",
      input.action,
      error instanceof Error ? error.message : "UnknownError"
    );
    return null;
  }
}
