import "server-only";

import { execFile } from "node:child_process";
import { lstat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { promisify } from "node:util";
import { userInfo } from "node:os";
import type {
  AuditClassification,
  AuditSeverity,
  AuditSource,
} from "@prisma/client";

const execFileAsync = promisify(execFile);
const APP_ROOT = "/var/www/helpdesk";

export interface UnifiedAuditEvent {
  action: string;
  actorEmail?: string | null;
  actorId?: string | null;
  actorIp?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  classification: AuditClassification;
  details?: unknown;
  id: string;
  occurredAt: Date;
  resourceId?: string | null;
  resourceType?: string | null;
  severity: AuditSeverity;
  source: AuditSource;
  summary: string;
}

async function runFixedCommand(
  executable: string,
  args: string[],
  options?: { cwd?: string; timeout?: number }
) {
  const { stdout } = await execFileAsync(executable, args, {
    cwd: options?.cwd,
    encoding: "utf8",
    maxBuffer: 6 * 1024 * 1024,
    timeout: options?.timeout ?? 8_000,
  });

  return stdout;
}

interface JournalRecord {
  MESSAGE?: string;
  SYSLOG_PID?: string;
  __CURSOR?: string;
  __REALTIME_TIMESTAMP?: string;
  _HOSTNAME?: string;
}

async function readSshJournalEvents(): Promise<UnifiedAuditEvent[]> {
  try {
    const output = await runFixedCommand(
      "/usr/bin/sudo",
      [
        "-n",
        "/usr/bin/journalctl",
        "-u",
        "ssh",
        "--no-pager",
        "-o",
        "json",
        "--grep=^(Accepted|Failed password)",
        "-n",
        "1200",
      ],
      { timeout: 10_000 }
    );

    return output
      .split(/\r?\n/)
      .filter(Boolean)
      .flatMap((line): UnifiedAuditEvent[] => {
        let record: JournalRecord;
        try {
          record = JSON.parse(line) as JournalRecord;
        } catch {
          return [];
        }

        const message = record.MESSAGE || "";
        const accepted = message.match(
          /^Accepted\s+(\S+)\s+for\s+(\S+)\s+from\s+([0-9a-fA-F:.]+)\s+port\s+(\d+)/
        );
        const failed = message.match(
          /^Failed password for\s+(?:invalid user\s+)?(\S+)\s+from\s+([0-9a-fA-F:.]+)\s+port\s+(\d+)/
        );

        if (!accepted && !failed) return [];

        const timestampMicros = Number(record.__REALTIME_TIMESTAMP || 0);
        const occurredAt = timestampMicros
          ? new Date(timestampMicros / 1000)
          : new Date();
        const username = accepted?.[2] || failed?.[1] || "unknown";
        const ip = accepted?.[3] || failed?.[2] || null;
        const port = accepted?.[4] || failed?.[3] || null;
        const method = accepted?.[1] || "password";
        const success = Boolean(accepted);

        return [
          {
            action: success ? "SSH_LOGIN_SUCCESS" : "SSH_LOGIN_FAILED",
            actorIp: ip,
            actorName: username,
            classification: "SSH",
            details: {
              authenticationMethod: method,
              host: record._HOSTNAME || null,
              port,
              processId: record.SYSLOG_PID || null,
            },
            id: `ssh-${record.__CURSOR || `${occurredAt.getTime()}-${record.SYSLOG_PID || "0"}`}`,
            occurredAt,
            resourceType: "SSH_SESSION",
            severity: success ? "INFO" : "WARNING",
            source: "SSH",
            summary: success
              ? `${username} login SSH dari ${ip}`
              : `Percobaan login SSH gagal untuk ${username} dari ${ip}`,
          },
        ];
      });
  } catch (error) {
    console.error(
      "[AUDIT] Unable to read SSH journal:",
      error instanceof Error ? error.message : "UnknownError"
    );
    return [];
  }
}

interface RawAuditGroup {
  epoch: number;
  lines: string[];
  serial: string;
}

function firstMatch(lines: string[], pattern: RegExp) {
  for (const line of lines) {
    const match = line.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function describeFileOperation(operation: string) {
  if (/unlink|rmdir/i.test(operation)) return "menghapus";
  if (/rename|link/i.test(operation)) return "memindahkan atau mengganti nama";
  if (/chmod|chown|setxattr/i.test(operation)) return "mengubah atribut";
  if (/mkdir|creat/i.test(operation)) return "membuat";
  return "mengubah";
}

async function readKernelChangeEvents(): Promise<UnifiedAuditEvent[]> {
  try {
    const output = await runFixedCommand(
      "/usr/bin/sudo",
      ["-n", "/usr/bin/tail", "-n", "12000", "/var/log/audit/audit.log"],
      { timeout: 8_000 }
    );

    const grouped = new Map<string, RawAuditGroup>();
    for (const line of output.split(/\r?\n/)) {
      const auditId = line.match(/msg=audit\((\d+(?:\.\d+)?):(\d+)\)/);
      if (!auditId) continue;

      const [, epochText, serial] = auditId;
      const group: RawAuditGroup = grouped.get(serial) || {
        epoch: Number(epochText),
        lines: [],
        serial,
      };
      group.lines.push(line);
      grouped.set(serial, group);
    }

    return Array.from(grouped.values())
      .filter((group) =>
        group.lines.some(
          (line) =>
            line.includes('key="sibatik_source"') ||
            line.includes('key="sibatik_config"')
        )
      )
      .map((group): UnifiedAuditEvent => {
        const actorName =
          firstMatch(group.lines, /\bAUID="([^"]+)"/) ||
          firstMatch(group.lines, /\bauid=([^\s]+)/) ||
          "unknown";
        const operation =
          firstMatch(group.lines, /\bSYSCALL=([^\s]+)/) ||
          firstMatch(group.lines, /\bsyscall=([^\s]+)/) ||
          "write";
        const command = firstMatch(group.lines, /\bcomm="([^"]+)"/) || "unknown";
        const executable = firstMatch(group.lines, /\bexe="([^"]+)"/);
        const auditKey = firstMatch(group.lines, /\bkey="([^"]+)"/);
        const sessionId = firstMatch(group.lines, /\bses=([^\s]+)/);
        const paths = Array.from(
          new Set(
            group.lines
              .flatMap((line) => Array.from(line.matchAll(/\bname="([^"]+)"/g)))
              .map((match) => match[1])
              .filter((path) => path.startsWith(APP_ROOT))
              .map((path) => relative(APP_ROOT, path) || ".")
          )
        );
        const primaryPath = paths[0] || "area aplikasi SIBATIK";
        const extraCount = Math.max(paths.length - 1, 0);

        return {
          action: "SERVER_FILE_CHANGED",
          actorId: actorName.match(/^\d+$/) ? actorName : null,
          actorName,
          classification: "CODE_CHANGE",
          details: {
            auditKey,
            command,
            executable,
            operation,
            paths,
            sessionId,
          },
          id: `kernel-${group.serial}`,
          occurredAt: new Date(group.epoch * 1000),
          resourceId: paths[0] || null,
          resourceType: "FILE",
          severity: "INFO",
          source: "SYSTEM",
          summary: `${actorName} ${describeFileOperation(operation)} ${primaryPath}${
            extraCount ? ` dan ${extraCount} path lain` : ""
          } melalui ${command}`,
        };
      });
  } catch (error) {
    console.error(
      "[AUDIT] Unable to read kernel file audit:",
      error instanceof Error ? error.message : "UnknownError"
    );
    return [];
  }
}

async function readGitCommitEvents(): Promise<UnifiedAuditEvent[]> {
  try {
    const output = await runFixedCommand(
      "/usr/bin/git",
      [
        "log",
        "-n",
        "150",
        "--date=iso-strict",
        "--pretty=format:%x1e%H%x1f%an%x1f%ae%x1f%aI%x1f%s",
        "--name-status",
      ],
      { cwd: APP_ROOT, timeout: 8_000 }
    );

    return output
      .split("\x1e")
      .filter(Boolean)
      .flatMap((chunk): UnifiedAuditEvent[] => {
        const lines = chunk.replace(/^\r?\n/, "").split(/\r?\n/);
        const [hash, authorName, authorEmail, date, subject] = lines[0].split("\x1f");
        if (!hash || !date) return [];

        const files = lines
          .slice(1)
          .filter(Boolean)
          .map((line) => {
            const [status, ...paths] = line.split("\t");
            return { path: paths.join(" → "), status };
          });

        return [
          {
            action: "GIT_COMMIT",
            actorEmail: authorEmail || null,
            actorName: authorName || "unknown",
            classification: "CODE_CHANGE",
            details: { commit: hash, files },
            id: `git-${hash}`,
            occurredAt: new Date(date),
            resourceId: hash,
            resourceType: "GIT_COMMIT",
            severity: "INFO",
            source: "GIT",
            summary: subject || `Commit ${hash.slice(0, 8)}`,
          },
        ];
      });
  } catch (error) {
    console.error(
      "[AUDIT] Unable to read Git history:",
      error instanceof Error ? error.message : "UnknownError"
    );
    return [];
  }
}

async function readGitWorktreeEvent(): Promise<UnifiedAuditEvent[]> {
  try {
    const output = await runFixedCommand(
      "/usr/bin/git",
      ["status", "--porcelain=v1", "-z"],
      { cwd: APP_ROOT, timeout: 5_000 }
    );
    const entries = output
      .split("\0")
      .filter(Boolean)
      .map((entry) => ({ path: entry.slice(3), status: entry.slice(0, 2) }))
      .filter(
        (entry) =>
          entry.path &&
          !entry.path.startsWith("public/uploads/") &&
          !entry.path.startsWith(".next/")
      );

    if (entries.length === 0) return [];

    let latestChange = new Date(0);
    for (const entry of entries) {
      try {
        const fileStat = await lstat(resolve(APP_ROOT, entry.path));
        if (fileStat.mtime > latestChange) latestChange = fileStat.mtime;
      } catch {
        latestChange = new Date();
      }
    }

    if (latestChange.getTime() === 0) latestChange = new Date();
    const username = userInfo().username || "unknown";

    return [
      {
        action: "GIT_WORKTREE_DIRTY",
        actorName: username,
        classification: "CODE_CHANGE",
        details: { files: entries },
        id: `git-worktree-${latestChange.getTime()}`,
        occurredAt: latestChange,
        resourceId: APP_ROOT,
        resourceType: "GIT_WORKTREE",
        severity: "WARNING",
        source: "GIT",
        summary: `${entries.length} perubahan repository belum di-commit`,
      },
    ];
  } catch (error) {
    console.error(
      "[AUDIT] Unable to read Git worktree:",
      error instanceof Error ? error.message : "UnknownError"
    );
    return [];
  }
}

export async function readSystemAuditEvents() {
  const [ssh, kernel, commits, worktree] = await Promise.all([
    readSshJournalEvents(),
    readKernelChangeEvents(),
    readGitCommitEvents(),
    readGitWorktreeEvent(),
  ]);

  return [...ssh, ...kernel, ...commits, ...worktree];
}
