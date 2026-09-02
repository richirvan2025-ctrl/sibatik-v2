import { NextRequest } from "next/server";
import { getClientIp, recordAuditEvent } from "@/lib/audit-log";
import { hasLogsAccess } from "@/lib/logs-auth";
import {
  CLASSIFICATION_LABELS,
  loadUnifiedAuditEvents,
  normalizeAuditFilters,
  SEVERITY_LABELS,
  SOURCE_LABELS,
} from "@/lib/logs-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPORT_LIMIT = 5_000;

function formatTimestamp(date: Date) {
  return `${new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Makassar",
    year: "numeric",
  }).format(date)} WITA`;
}

function csvCell(value: unknown) {
  let text =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);

  // Prevent spreadsheet applications from evaluating exported log text.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function exportFilename() {
  const timestamp = new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Makassar",
    year: "numeric",
  })
    .format(new Date())
    .replace(/[ :]/g, "-");

  return `sibatik-system-logs-${timestamp}.csv`;
}

export async function GET(request: NextRequest) {
  if (!(await hasLogsAccess())) {
    return new Response("Akses log tidak valid atau telah berakhir.", {
      headers: { "Cache-Control": "no-store" },
      status: 401,
    });
  }

  const requestPurpose = [
    request.headers.get("purpose"),
    request.headers.get("sec-purpose"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (
    request.headers.has("next-router-prefetch") ||
    requestPurpose.includes("prefetch")
  ) {
    return new Response(null, {
      headers: { "Cache-Control": "no-store, private" },
      status: 204,
    });
  }

  const filters = normalizeAuditFilters(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );
  const { events, totalMatched, truncated } = await loadUnifiedAuditEvents(
    filters,
    { applicationLimit: EXPORT_LIMIT, eventLimit: EXPORT_LIMIT }
  );

  const header = [
    "Waktu",
    "Klasifikasi",
    "Sumber",
    "Level",
    "Kode Aktivitas",
    "Ringkasan",
    "Nama Aktor",
    "Email Aktor",
    "Role Aktor",
    "Alamat IP",
    "Tipe Resource",
    "ID Resource",
    "Detail",
  ];
  const rows = events.map((event) => [
    formatTimestamp(event.occurredAt),
    CLASSIFICATION_LABELS[event.classification],
    SOURCE_LABELS[event.source],
    SEVERITY_LABELS[event.severity],
    event.action,
    event.summary,
    event.actorName,
    event.actorEmail,
    event.actorRole,
    event.actorIp,
    event.resourceType,
    event.resourceId,
    event.details,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter((entry): entry is [string, string] =>
      Boolean(entry[1])
    )
  );

  await recordAuditEvent({
    action: "LOGS_EXPORTED",
    actorIp: getClientIp(request),
    classification: "LOG_ACCESS",
    details: {
      exportedRows: events.length,
      filters: activeFilters,
      totalMatched,
      truncated,
    },
    summary: `${events.length} baris system logs diekspor`,
  });

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Cache-Control": "no-store, private",
      "Content-Disposition": `attachment; filename="${exportFilename()}"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
