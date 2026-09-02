-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'APPLICATION',
    "classification" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "actorIp" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "details" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_classification_occurredAt_idx" ON "AuditLog"("classification", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_source_occurredAt_idx" ON "AuditLog"("source", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_occurredAt_idx" ON "AuditLog"("actorId", "occurredAt");

-- Backfill riwayat pembuatan tiket agar halaman log langsung berguna setelah rilis.
INSERT OR IGNORE INTO "AuditLog" (
    "id", "occurredAt", "source", "classification", "severity", "action",
    "summary", "actorId", "actorName", "actorEmail", "actorRole",
    "resourceType", "resourceId", "details", "createdAt"
)
SELECT
    'history_ticket_' || t."id",
    t."createdAt",
    'APPLICATION',
    'TICKET',
    'INFO',
    'TICKET_CREATED',
    COALESCE(u."name", u."email", 'Pengguna') || ' membuat tiket ' || t."ticketNumber",
    t."createdById",
    u."name",
    u."email",
    u."role",
    'TICKET',
    t."id",
    json_object(
        'ticketNumber', t."ticketNumber",
        'title', t."title",
        'priority', t."priority",
        'status', t."status"
    ),
    CURRENT_TIMESTAMP
FROM "Ticket" t
LEFT JOIN "User" u ON u."id" = t."createdById";

-- Backfill komentar dan catatan internal yang sudah ada.
INSERT OR IGNORE INTO "AuditLog" (
    "id", "occurredAt", "source", "classification", "severity", "action",
    "summary", "actorId", "actorName", "actorEmail", "actorRole",
    "resourceType", "resourceId", "details", "createdAt"
)
SELECT
    'history_comment_' || c."id",
    c."createdAt",
    'APPLICATION',
    'COMMENT',
    'INFO',
    CASE WHEN c."isInternal" = 1 THEN 'INTERNAL_COMMENT_ADDED' ELSE 'COMMENT_ADDED' END,
    COALESCE(u."name", u."email", 'Pengguna') ||
        CASE WHEN c."isInternal" = 1 THEN ' menambahkan catatan internal pada ' ELSE ' menambahkan komentar pada ' END ||
        COALESCE(t."ticketNumber", c."ticketId"),
    c."userId",
    u."name",
    u."email",
    u."role",
    'TICKET',
    c."ticketId",
    json_object(
        'ticketNumber', t."ticketNumber",
        'isInternal', CASE WHEN c."isInternal" = 1 THEN json('true') ELSE json('false') END,
        'preview', substr(c."message", 1, 160)
    ),
    CURRENT_TIMESTAMP
FROM "TicketComment" c
LEFT JOIN "User" u ON u."id" = c."userId"
LEFT JOIN "Ticket" t ON t."id" = c."ticketId";

-- Backfill metadata lampiran tanpa menyalin isi file.
INSERT OR IGNORE INTO "AuditLog" (
    "id", "occurredAt", "source", "classification", "severity", "action",
    "summary", "actorId", "actorName", "actorEmail", "actorRole",
    "resourceType", "resourceId", "details", "createdAt"
)
SELECT
    'history_attachment_' || a."id",
    a."createdAt",
    'APPLICATION',
    'ATTACHMENT',
    'INFO',
    'ATTACHMENT_UPLOADED',
    COALESCE(u."name", u."email", 'Pengguna') || ' mengunggah ' || a."fileName" ||
        ' ke ' || COALESCE(t."ticketNumber", a."ticketId"),
    a."uploadedById",
    u."name",
    u."email",
    u."role",
    'TICKET',
    a."ticketId",
    json_object(
        'ticketNumber', t."ticketNumber",
        'fileName', a."fileName",
        'fileSize', a."fileSize",
        'mimeType', a."mimeType"
    ),
    CURRENT_TIMESTAMP
FROM "TicketAttachment" a
LEFT JOIN "User" u ON u."id" = a."uploadedById"
LEFT JOIN "Ticket" t ON t."id" = a."ticketId";
