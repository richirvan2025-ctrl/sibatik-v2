// Hapus MAHASISWA yang TANPA aktivitas (tiket/komentar/attachment/KB = 0).
// Relasi cascade (accounts, notifications, chat, groupMemberships) ikut terhapus otomatis.
// Jalankan: node scripts/delete-mahasiswa.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const result = await prisma.$executeRawUnsafe(`
  DELETE FROM User
  WHERE role='MAHASISWA'
    AND id NOT IN (SELECT createdById FROM Ticket)
    AND id NOT IN (SELECT assignedToId FROM Ticket WHERE assignedToId IS NOT NULL)
    AND id NOT IN (SELECT onBehalfOfId FROM Ticket WHERE onBehalfOfId IS NOT NULL)
    AND id NOT IN (SELECT userId FROM TicketComment)
    AND id NOT IN (SELECT uploadedById FROM TicketAttachment)
    AND id NOT IN (SELECT uploadedById FROM CommentAttachment)
    AND id NOT IN (SELECT createdById FROM KBArticle);
`);

const sisa = await prisma.user.count({ where: { role: "MAHASISWA" } });
console.log(`User MAHASISWA terhapus : ${result}`);
console.log(`Sisa MAHASISWA (ada aktivitas / tidak dihapus): ${sisa}`);

await prisma.$disconnect();
