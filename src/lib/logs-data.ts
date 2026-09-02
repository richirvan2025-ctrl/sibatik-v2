import "server-only";

import type {
  AuditClassification,
  AuditSeverity,
  AuditSource,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  readSystemAuditEvents,
  type UnifiedAuditEvent,
} from "@/lib/system-audit";

export const AUDIT_CLASSIFICATIONS = [
  "AUTH",
  "TICKET",
  "COMMENT",
  "ATTACHMENT",
  "ADMIN",
  "KNOWLEDGE_BASE",
  "SECURITY",
  "SYSTEM",
  "SSH",
  "CODE_CHANGE",
  "LOG_ACCESS",
] as const satisfies readonly AuditClassification[];

export const AUDIT_SOURCES = [
  "APPLICATION",
  "SYSTEM",
  "SSH",
  "GIT",
] as const satisfies readonly AuditSource[];

export const AUDIT_SEVERITIES = [
  "INFO",
  "WARNING",
  "ERROR",
] as const satisfies readonly AuditSeverity[];

export const CLASSIFICATION_LABELS: Record<AuditClassification, string> = {
  ADMIN: "Administrasi",
  ATTACHMENT: "Lampiran",
  AUTH: "Login aplikasi",
  CODE_CHANGE: "Perubahan server",
  COMMENT: "Komentar",
  KNOWLEDGE_BASE: "Knowledge Base",
  LOG_ACCESS: "Akses halaman log",
  SECURITY: "Keamanan",
  SSH: "SSH",
  SYSTEM: "Sistem",
  TICKET: "Tiket",
};

export const SOURCE_LABELS: Record<AuditSource, string> = {
  APPLICATION: "Aplikasi",
  GIT: "Git",
  SSH: "SSH Journal",
  SYSTEM: "Kernel Audit",
};

export const SEVERITY_LABELS: Record<AuditSeverity, string> = {
  ERROR: "Error",
  INFO: "Info",
  WARNING: "Peringatan",
};

export interface AuditFilters {
  classification?: AuditClassification;
  from?: string;
  query?: string;
  severity?: AuditSeverity;
  source?: AuditSource;
  to?: string;
}

interface LoadAuditOptions {
  applicationLimit?: number;
  eventLimit?: number;
}

function boundedLimit(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value || fallback), 1), 5_000);
}

function parseBoundary(value: string | undefined, endOfDay: boolean) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+08:00`
  );
}

function matchesFilters(event: UnifiedAuditEvent, filters: AuditFilters) {
  if (
    filters.classification &&
    event.classification !== filters.classification
  ) {
    return false;
  }
  if (filters.source && event.source !== filters.source) return false;
  if (filters.severity && event.severity !== filters.severity) return false;

  const from = parseBoundary(filters.from, false);
  const to = parseBoundary(filters.to, true);
  if (from && event.occurredAt < from) return false;
  if (to && event.occurredAt > to) return false;

  const query = filters.query?.trim().toLocaleLowerCase("id");
  if (!query) return true;

  const searchable = [
    event.action,
    event.actorEmail,
    event.actorIp,
    event.actorName,
    event.actorRole,
    event.resourceId,
    event.resourceType,
    event.summary,
    event.details ? JSON.stringify(event.details) : null,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("id");

  return searchable.includes(query);
}

export async function loadUnifiedAuditEvents(
  filters: AuditFilters,
  options: LoadAuditOptions = {}
) {
  const eventLimit = boundedLimit(options.eventLimit, 250);
  const applicationLimit = boundedLimit(options.applicationLimit, 600);
  const dbWhere: Prisma.AuditLogWhereInput = {};
  const from = parseBoundary(filters.from, false);
  const to = parseBoundary(filters.to, true);

  if (from || to) {
    dbWhere.occurredAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }
  if (filters.classification) {
    dbWhere.classification = filters.classification;
  }
  if (filters.source) dbWhere.source = filters.source;
  if (filters.severity) dbWhere.severity = filters.severity;
  if (filters.query?.trim()) {
    const query = filters.query.trim();
    dbWhere.OR = [
      { action: { contains: query } },
      { actorEmail: { contains: query } },
      { actorIp: { contains: query } },
      { actorName: { contains: query } },
      { resourceId: { contains: query } },
      { summary: { contains: query } },
    ];
  }

  const [applicationLogs, systemLogs] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { occurredAt: "desc" },
      take: applicationLimit,
      where: dbWhere,
    }),
    readSystemAuditEvents(),
  ]);

  const databaseEvents: UnifiedAuditEvent[] = applicationLogs.map((log) => ({
    action: log.action,
    actorEmail: log.actorEmail,
    actorId: log.actorId,
    actorIp: log.actorIp,
    actorName: log.actorName,
    actorRole: log.actorRole,
    classification: log.classification,
    details: log.details,
    id: `application-${log.id}`,
    occurredAt: log.occurredAt,
    resourceId: log.resourceId,
    resourceType: log.resourceType,
    severity: log.severity,
    source: log.source,
    summary: log.summary,
  }));

  const filtered = [...databaseEvents, ...systemLogs]
    .filter((event) => matchesFilters(event, filters))
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  return {
    events: filtered.slice(0, eventLimit),
    totalMatched: filtered.length,
    truncated: filtered.length > eventLimit,
  };
}

export function normalizeAuditFilters(params: Record<string, string | string[] | undefined>) {
  const value = (key: string) => {
    const current = params[key];
    return Array.isArray(current) ? current[0] : current;
  };
  const classification = value("classification");
  const source = value("source");
  const severity = value("severity");

  return {
    classification: AUDIT_CLASSIFICATIONS.includes(
      classification as AuditClassification
    )
      ? (classification as AuditClassification)
      : undefined,
    from: value("from"),
    query: value("query")?.slice(0, 120),
    severity: AUDIT_SEVERITIES.includes(severity as AuditSeverity)
      ? (severity as AuditSeverity)
      : undefined,
    source: AUDIT_SOURCES.includes(source as AuditSource)
      ? (source as AuditSource)
      : undefined,
    to: value("to"),
  } satisfies AuditFilters;
}
