// Pratinjau MAHASISWA + hitungan aktivitas. READ-ONLY, tidak menghapus apa pun.
// Jalankan: node scripts/preview-mahasiswa.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const rows = await prisma.$queryRawUnsafe(`
  SELECT u.id, u.name, u.email,
    (SELECT COUNT(*) FROM Ticket t WHERE t.createdById=u.id)            AS crt,
    (SELECT COUNT(*) FROM Ticket t WHERE t.assignedToId=u.id)           AS asg,
    (SELECT COUNT(*) FROM Ticket t WHERE t.onBehalfOfId=u.id)           AS obh,
    (SELECT COUNT(*) FROM TicketComment c WHERE c.userId=u.id)          AS cmt,
    (SELECT COUNT(*) FROM TicketAttachment a WHERE a.uploadedById=u.id) AS tat,
    (SELECT COUNT(*) FROM CommentAttachment a WHERE a.uploadedById=u.id) AS cat,
    (SELECT COUNT(*) FROM KBArticle k WHERE k.createdById=u.id)         AS kb
  FROM User u WHERE u.role='MAHASISWA' ORDER BY u.name;
`);

const withCounts = rows.map((r) => {
  const total = Number(r.crt)+Number(r.asg)+Number(r.obh)+Number(r.cmt)+Number(r.tat)+Number(r.cat)+Number(r.kb);
  return { ...r, total };
});
const safe = withCounts.filter((r) => r.total === 0);
const kept = withCounts.filter((r) => r.total > 0);

console.log(`Total MAHASISWA           : ${rows.length}`);
console.log(`Aman dihapus (aktivitas=0): ${safe.length}`);
console.log(`Dipertahankan (ada aktiv.): ${kept.length}`);
console.table(withCounts.map(({id, name, email, total}) => ({
  id: String(id).slice(0,8), name, email, aktivitas: total, aksi: total===0 ? "HAPUS" : "simpan",
})));

await prisma.$disconnect();
