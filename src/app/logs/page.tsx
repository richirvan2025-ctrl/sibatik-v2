import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Code2,
  Database,
  ExternalLink,
  FileClock,
  Filter,
  KeyRound,
  LockKeyhole,
  LogOut,
  Network,
  RefreshCw,
  Search,
  ServerCog,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type {
  AuditClassification,
  AuditSeverity,
} from "@prisma/client";
import { hasLogsAccess } from "@/lib/logs-auth";
import {
  AUDIT_CLASSIFICATIONS,
  AUDIT_SEVERITIES,
  AUDIT_SOURCES,
  CLASSIFICATION_LABELS,
  loadUnifiedAuditEvents,
  normalizeAuditFilters,
  SEVERITY_LABELS,
  SOURCE_LABELS,
} from "@/lib/logs-data";
import type { UnifiedAuditEvent } from "@/lib/system-audit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "System Logs | SIBATIK",
  description: "Audit trail aktivitas aplikasi dan server SIBATIK",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const classificationStyles: Record<AuditClassification, string> = {
  ADMIN: "border-violet-200 bg-violet-50 text-violet-700",
  ATTACHMENT: "border-sky-200 bg-sky-50 text-sky-700",
  AUTH: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CODE_CHANGE: "border-amber-200 bg-amber-50 text-amber-700",
  COMMENT: "border-blue-200 bg-blue-50 text-blue-700",
  KNOWLEDGE_BASE: "border-indigo-200 bg-indigo-50 text-indigo-700",
  LOG_ACCESS: "border-cyan-200 bg-cyan-50 text-cyan-700",
  SECURITY: "border-rose-200 bg-rose-50 text-rose-700",
  SSH: "border-orange-200 bg-orange-50 text-orange-700",
  SYSTEM: "border-slate-200 bg-slate-100 text-slate-700",
  TICKET: "border-purple-200 bg-purple-50 text-purple-700",
};

const severityStyles: Record<AuditSeverity, string> = {
  ERROR: "bg-rose-500",
  INFO: "bg-emerald-500",
  WARNING: "bg-amber-500",
};

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    second: "2-digit",
    timeZone: "Asia/Makassar",
    year: "numeric",
  }).format(date);
}

function formatRelative(date: Date) {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, divisor] of ranges) {
    if (Math.abs(seconds) >= divisor) {
      return formatter.format(Math.round(seconds / divisor), unit);
    }
  }
  return formatter.format(seconds, "second");
}

function detailText(details: unknown) {
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return "Detail tidak dapat ditampilkan";
  }
}

function eventHref(event: UnifiedAuditEvent) {
  if (event.resourceType === "TICKET" && event.resourceId) {
    return `/tickets/${event.resourceId}`;
  }
  return null;
}

function AccessGate({ error }: { error?: string }) {
  const errorMessage =
    error === "blocked"
      ? "Terlalu banyak percobaan. Tunggu 15 menit sebelum mencoba kembali."
      : error === "invalid"
        ? "Password tidak sesuai. Silakan coba kembali."
        : null;

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#063B59] px-5 py-10">
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(4,59,89,.95), rgba(4,76,113,.48), rgba(4,59,89,.95)), url('/sibatik-header-batik-option2.png')",
          backgroundPosition: "center",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 210px",
        }}
      />
      <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-violet-300/10 blur-3xl" />

      <section className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.97] shadow-[0_32px_90px_rgba(0,20,38,0.38)]">
        <div className="border-b border-slate-200/80 px-7 pb-6 pt-7">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#064C71] text-white shadow-lg shadow-sky-950/15">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  SIBATIK
                </p>
                <p className="text-sm font-bold text-[#17223D]">System Audit</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Protected
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-[-0.035em] text-[#12213B]">
            Akses System Logs
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Masukkan password audit untuk melihat aktivitas aplikasi, SSH, dan
            perubahan server.
          </p>
        </div>

        <form action="/api/logs/unlock" method="post" className="space-y-4 px-7 py-6">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Password
            </span>
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                autoComplete="current-password"
                autoFocus
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                maxLength={128}
                name="password"
                placeholder="Masukkan password"
                required
                type="password"
              />
            </span>
          </label>

          {errorMessage && (
            <div className="flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-medium leading-5 text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#7047EB] text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 hover:bg-[#6439E3] hover:shadow-xl hover:shadow-violet-500/25 active:translate-y-0"
            type="submit"
          >
            <KeyRound className="h-4 w-4" />
            Buka System Logs
          </button>
        </form>

        <div className="border-t border-slate-100 bg-slate-50/80 px-7 py-4 text-center text-[11px] leading-5 text-slate-400">
          Percobaan akses dan alamat IP akan tercatat otomatis.
        </div>
      </section>
    </main>
  );
}

export default async function LogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isAllowed = await hasLogsAccess();
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  if (!isAllowed) return <AccessGate error={error} />;

  const filters = normalizeAuditFilters(params);
  const { events, totalMatched, truncated } =
    await loadUnifiedAuditEvents(filters);
  const applicationCount = events.filter(
    (event) => event.source === "APPLICATION"
  ).length;
  const sshCount = events.filter((event) => event.classification === "SSH").length;
  const changeCount = events.filter(
    (event) => event.classification === "CODE_CHANGE"
  ).length;
  const warningCount = events.filter(
    (event) => event.severity !== "INFO"
  ).length;

  return (
    <main className="min-h-[100dvh] bg-[#F3F7FA] text-[#17223D]">
      <header className="relative overflow-hidden border-b border-white/10 bg-[#064C71] text-white shadow-[0_8px_28px_rgba(4,52,82,0.22)]">
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #064C71, rgba(6,76,113,.35), #064C71), url('/sibatik-header-batik-option2.png')",
            backgroundPosition: "center",
            backgroundRepeat: "repeat-x",
            backgroundSize: "auto 150px",
          }}
        />
        <div className="relative mx-auto flex max-w-[1540px] flex-col gap-5 px-5 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner shadow-white/10">
              <FileClock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-[-0.035em]">
                  System Logs
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-100">
                  <Activity className="h-3 w-3" /> Live Audit
                </span>
              </div>
              <p className="mt-1 text-sm text-sky-100/80">
                Aktivitas aplikasi, akses SSH, dan perubahan server dalam satu audit trail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 text-xs font-semibold text-white transition hover:bg-white/15"
              href="/logs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Link>
            <form action="/api/logs/logout" method="post">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-bold text-[#064C71] shadow-sm transition hover:bg-sky-50"
                type="submit"
              >
                <LogOut className="h-3.5 w-3.5" />
                Kunci
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1540px] space-y-5 px-5 py-6 lg:px-8 lg:py-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: Database,
              label: "Event aplikasi",
              tone: "bg-violet-50 text-violet-600",
              value: applicationCount,
            },
            {
              icon: Network,
              label: "Aktivitas SSH",
              tone: "bg-orange-50 text-orange-600",
              value: sshCount,
            },
            {
              icon: Code2,
              label: "Perubahan server",
              tone: "bg-amber-50 text-amber-600",
              value: changeCount,
            },
            {
              icon: AlertTriangle,
              label: "Perlu perhatian",
              tone: "bg-rose-50 text-rose-600",
              value: warningCount,
            },
          ].map((item) => (
            <article
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(29,43,76,0.05)]"
              key={item.label}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-[-0.04em] text-[#17223D]">
                  {item.value}
                </p>
                <p className="text-xs font-medium text-slate-500">{item.label}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(29,43,76,0.05)] lg:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#26334D]">
            <Filter className="h-4 w-4 text-violet-600" />
            Filter aktivitas
          </div>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(250px,1.5fr)_repeat(3,minmax(150px,.75fr))_repeat(2,minmax(145px,.65fr))_auto]" method="get">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                defaultValue={filters.query || ""}
                maxLength={120}
                name="query"
                placeholder="Cari user, IP, tiket, file..."
                type="search"
              />
            </label>

            <select
              aria-label="Klasifikasi aktivitas"
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              defaultValue={filters.classification || ""}
              name="classification"
            >
              <option value="">Semua klasifikasi</option>
              {AUDIT_CLASSIFICATIONS.map((classification) => (
                <option key={classification} value={classification}>
                  {CLASSIFICATION_LABELS[classification]}
                </option>
              ))}
            </select>

            <select
              aria-label="Sumber log"
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              defaultValue={filters.source || ""}
              name="source"
            >
              <option value="">Semua sumber</option>
              {AUDIT_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {SOURCE_LABELS[source]}
                </option>
              ))}
            </select>

            <select
              aria-label="Level log"
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              defaultValue={filters.severity || ""}
              name="severity"
            >
              <option value="">Semua level</option>
              {AUDIT_SEVERITIES.map((severity) => (
                <option key={severity} value={severity}>
                  {SEVERITY_LABELS[severity]}
                </option>
              ))}
            </select>

            <label className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Tanggal mulai"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-2 text-xs font-medium text-slate-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                defaultValue={filters.from || ""}
                name="from"
                type="date"
              />
            </label>

            <label className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Tanggal akhir"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-2 text-xs font-medium text-slate-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                defaultValue={filters.to || ""}
                name="to"
                type="date"
              />
            </label>

            <div className="flex gap-2">
              <button
                className="h-11 flex-1 rounded-xl bg-[#7047EB] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#6439E3]"
                type="submit"
              >
                Terapkan
              </button>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                href="/logs"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(29,43,76,0.06)]">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#26334D]">
                <Activity className="h-4 w-4 text-violet-600" />
                Timeline aktivitas
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {totalMatched.toLocaleString("id-ID")} event sesuai filter
                {truncated ? " · menampilkan 250 terbaru" : ""}
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Monitoring aktif
            </span>
          </div>

          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Tidak ada log ditemukan</h3>
              <p className="mt-1 text-xs text-slate-400">
                Ubah filter atau rentang tanggal untuk melihat aktivitas lain.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {events.map((event) => {
                const href = eventHref(event);
                return (
                  <article
                    className="grid gap-4 px-5 py-4 transition hover:bg-slate-50/70 lg:grid-cols-[170px_145px_minmax(300px,1fr)_220px] lg:items-start"
                    key={event.id}
                  >
                    <div>
                      <p className="text-xs font-bold tabular-nums text-[#334155]">
                        {formatTimestamp(event.occurredAt)}
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-slate-400">
                        {formatRelative(event.occurredAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:block">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${classificationStyles[event.classification]}`}
                      >
                        {CLASSIFICATION_LABELS[event.classification]}
                      </span>
                      <span className="mt-0 inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 lg:mt-2 lg:flex">
                        <span className={`h-1.5 w-1.5 rounded-full ${severityStyles[event.severity]}`} />
                        {SEVERITY_LABELS[event.severity]}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start gap-2">
                        <p className="text-sm font-bold leading-6 text-[#26334D]">
                          {event.summary}
                        </p>
                        {href && (
                          <Link
                            className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700 hover:bg-violet-100"
                            href={href}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            Buka tiket <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-slate-400">
                        <span>{event.action}</span>
                        {event.resourceType && (
                          <span>
                            {event.resourceType}
                            {event.resourceId ? ` · ${event.resourceId}` : ""}
                          </span>
                        )}
                      </div>
                      {event.details !== undefined && event.details !== null && (
                        <details className="group mt-2.5">
                          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-[10px] font-bold text-violet-600 hover:text-violet-700">
                            <ChevronDown className="h-3 w-3 transition group-open:rotate-180" />
                            Lihat detail
                          </summary>
                          <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-[#0F172A] p-3 text-[10px] leading-5 text-slate-200">
                            {detailText(event.details)}
                          </pre>
                        </details>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div className="flex items-start gap-2">
                        <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-700">
                            {event.actorName || "System"}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-400">
                            {event.actorEmail || event.actorRole || "Automated process"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-[10px] font-semibold text-slate-400">
                        <span>{SOURCE_LABELS[event.source]}</span>
                        {event.actorIp && <span>{event.actorIp}</span>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="flex flex-col gap-2 pb-2 text-[10px] leading-5 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Application audit, SSH journal, Git, dan kernel file audit aktif.
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ServerCog className="h-3.5 w-3.5" />
            Data sensitif seperti password dan token tidak disimpan.
          </span>
        </footer>
      </div>
    </main>
  );
}
