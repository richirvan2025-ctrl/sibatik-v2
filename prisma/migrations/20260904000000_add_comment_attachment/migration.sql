CREATE TABLE IF NOT EXISTS "CommentAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommentAttachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "TicketComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CommentAttachment_commentId_idx" ON "CommentAttachment"("commentId");
