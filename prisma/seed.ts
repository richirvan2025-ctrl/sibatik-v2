import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@idbbali.ac.id" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@idbbali.ac.id",
      role: "ADMIN",
      department: "IT",
    },
  });

  // Create technician users
  const tech1 = await prisma.user.upsert({
    where: { email: "tech1@idbbali.ac.id" },
    update: {},
    create: {
      name: "Budi Santoso",
      email: "tech1@idbbali.ac.id",
      role: "AGENT",
      department: "Sistem Informasi & IT Support",
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { email: "tech2@idbbali.ac.id" },
    update: {},
    create: {
      name: "Ani Wijaya",
      email: "tech2@idbbali.ac.id",
      role: "AGENT",
      department: "Sistem Informasi & IT Support",
    },
  });

  // Create department head users
  const deptHeadKeuangan = await prisma.user.upsert({
    where: { email: "kabag.keuangan@idbbali.ac.id" },
    update: {},
    create: {
      name: "Ni Made Keuangan",
      email: "kabag.keuangan@idbbali.ac.id",
      role: "SUPERVISOR",
      department: "Keuangan",
    },
  });

  const deptHeadHRD = await prisma.user.upsert({
    where: { email: "kabag.hrd@idbbali.ac.id" },
    update: {},
    create: {
      name: "I Wayan Kepegawaian",
      email: "kabag.hrd@idbbali.ac.id",
      role: "SUPERVISOR",
      department: "HRD/Kepegawaian",
    },
  });

  const deptHeadBAA = await prisma.user.upsert({
    where: { email: "kabag.baa@idbbali.ac.id" },
    update: {},
    create: {
      name: "Ni Nyoman Akademik",
      email: "kabag.baa@idbbali.ac.id",
      role: "SUPERVISOR",
      department: "BAA/Akademik",
    },
  });

  const deptHeadKemahasiswaan = await prisma.user.upsert({
    where: { email: "kabag.kemahasiswaan@idbbali.ac.id" },
    update: {},
    create: {
      name: "Kepala Kemahasiswaan",
      email: "kabag.kemahasiswaan@idbbali.ac.id",
      role: "SUPERVISOR",
      department: "Kemahasiswaan",
    },
  });

  const agentKemahasiswaan = await prisma.user.upsert({
    where: { email: "kemahasiswaan1@idbbali.ac.id" },
    update: {},
    create: {
      name: "Staff Kemahasiswaan",
      email: "kemahasiswaan1@idbbali.ac.id",
      role: "AGENT",
      department: "Kemahasiswaan",
    },
  });

  const deptHeadPerpustakaan = await prisma.user.upsert({
    where: { email: "kabag.perpustakaan@idbbali.ac.id" },
    update: {},
    create: {
      name: "Kepala Perpustakaan",
      email: "kabag.perpustakaan@idbbali.ac.id",
      role: "SUPERVISOR",
      department: "Perpustakaan",
    },
  });

  const agentPerpustakaan = await prisma.user.upsert({
    where: { email: "perpustakaan1@idbbali.ac.id" },
    update: {},
    create: {
      name: "Staff Perpustakaan",
      email: "perpustakaan1@idbbali.ac.id",
      role: "AGENT",
      department: "Perpustakaan",
    },
  });

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: "dosen1@idbbali.ac.id" },
    update: {},
    create: {
      name: "Dr. Siti Rahayu",
      email: "dosen1@idbbali.ac.id",
      role: "USER",
      department: "BAA/Akademik",
    },
  });

  // Struktur kategori hierarki: parent (Kategori) -> children (Sub Kategori)
  // Sumber: kategori-tiket.xlsx
  const categoryTree: Array<{
    name: string;
    department: string;
    responseTimeHours: number;
    resolveTimeHours: number;
    children: Array<{ name: string; description: string; responseTimeHours?: number; resolveTimeHours?: number }>;
  }> = [
    {
      name: "BAA/Akademik",
      department: "BAA/Akademik",
      responseTimeHours: 8,
      resolveTimeHours: 48,
      children: [
        { name: "Pendaftaran & KRS", description: "Registrasi semester, pengambilan/perubahan mata kuliah, konflik jadwal" },
        { name: "Nilai & Transkrip", description: "Keberatan nilai, permohonan transkrip resmi/sementara, rekap akademik" },
        { name: "Jadwal Kuliah & Ujian", description: "Perubahan jadwal, bentrok waktu kuliah, pengumuman UTS/UAS" },
        { name: "Tugas Akhir & Skripsi", description: "Pendaftaran TA, persetujuan judul, sidang, unggah dokumen akhir" },
        { name: "Cuti Akademik & Reaktivasi", description: "Pengajuan cuti, pemulihan status aktif, perpanjangan studi" },
        { name: "Surat Keterangan Akademik", description: "Surat aktif kuliah, keterangan lulus, rekomendasi akademik" },
        { name: "Wisuda", description: "Pendaftaran wisuda, kelengkapan berkas, pembayaran, atribut" },
        { name: "Kehadiran & Izin", description: "Rekap absensi mahasiswa, surat izin ketidakhadiran kuliah" },
      ],
    },
    {
      name: "Keuangan",
      department: "Keuangan",
      responseTimeHours: 8,
      resolveTimeHours: 48,
      children: [
        { name: "Pembayaran UKT / SPP", description: "Konfirmasi bayar, tagihan, jadwal pembayaran per semester" },
        { name: "Keringanan & Dispensasi Biaya", description: "Pengajuan cicilan, pengurangan UKT, kondisi keuangan khusus" },
        { name: "Beasiswa Internal", description: "Informasi, pendaftaran, pencairan beasiswa dari institusi" },
        { name: "Kwitansi & Bukti Pembayaran", description: "Permintaan kwitansi resmi, verifikasi transaksi, duplikat bukti bayar" },
        { name: "Pengembalian Dana (Refund)", description: "Kelebihan bayar, pembatalan kegiatan, kesalahan transfer" },
        { name: "Biaya Kegiatan & Acara", description: "Pembayaran kegiatan kemahasiswaan, biaya wisuda, seminar" },
      ],
    },
    {
      name: "Humas & Marketing",
      department: "Humas & Marketing",
      responseTimeHours: 24,
      resolveTimeHours: 72,
      children: [
        { name: "Informasi Penerimaan Mahasiswa Baru", description: "Jalur masuk, jadwal, persyaratan, biaya pendaftaran PMB" },
        { name: "Materi Promosi & Branding", description: "Permintaan materi visual, banner, template konten kampus" },
        { name: "Event & Pameran", description: "Koordinasi acara promosi, open house, pameran pendidikan" },
        { name: "Data & Statistik Calon Mahasiswa", description: "Laporan pendaftar, data konversi, rekap penerimaan" },
      ],
    },
    {
      name: "Kerjasama",
      department: "Kerjasama",
      responseTimeHours: 24,
      resolveTimeHours: 72,
      children: [
        { name: "MoU & Perjanjian Kerjasama", description: "Draft, penandatanganan, pengarsipan MoU dalam/luar negeri" },
        { name: "Program Magang & PKL", description: "Koordinasi tempat magang, surat pengantar, evaluasi PKL" },
        { name: "Kerjasama Luar Negeri", description: "Student exchange, dual degree, kunjungan delegasi asing" },
        { name: "Kerjasama Industri & Dunia Kerja", description: "Link & match industri, guest lecture, rekrutmen kampus" },
        { name: "Penelitian & Publikasi Bersama", description: "Kolaborasi riset, jurnal bersama, hibah penelitian eksternal" },
      ],
    },
    {
      name: "HRD/Kepegawaian",
      department: "HRD/Kepegawaian",
      responseTimeHours: 8,
      resolveTimeHours: 48,
      children: [
        { name: "Rekrutmen & Seleksi", description: "Info lowongan, proses seleksi, hasil penerimaan tenaga baru" },
        { name: "Administrasi Kepegawaian", description: "Kontrak kerja, perpanjangan, mutasi, pemberhentian karyawan" },
        { name: "Absensi & Cuti Pegawai", description: "Rekap kehadiran, pengajuan cuti tahunan/sakit/khusus" },
        { name: "Penggajian & Tunjangan", description: "Konfirmasi slip gaji, tunjangan, potongan, BPJS ketenagakerjaan" },
        { name: "Pelatihan & Pengembangan SDM", description: "Jadwal diklat, sertifikasi, workshop pengembangan kompetensi" },
        { name: "Penilaian Kinerja (SKP)", description: "Pengisian, verifikasi, dan rekap penilaian kinerja pegawai" },
      ],
    },
    {
      name: "Operasional dan Security",
      department: "Operasional dan Security",
      responseTimeHours: 4,
      resolveTimeHours: 24,
      children: [
        { name: "Peminjaman Ruangan & Fasilitas", description: "Booking aula, ruang kelas, lab, studio untuk kegiatan" },
        { name: "Peminjaman Peralatan", description: "Proyektor, mic, meja, kursi, dan inventaris kampus lainnya" },
        { name: "Pelaporan Kerusakan Fasilitas", description: "AC rusak, atap bocor, kursi patah, kerusakan sarana fisik" },
        { name: "Kebersihan & Sanitasi", description: "Laporan kebersihan area, toilet, sampah, kebersihan gedung" },
        { name: "Keamanan & Akses Kampus", description: "Gangguan keamanan, izin akses area, kehilangan barang" },
        { name: "Parkir & Kendaraan", description: "Stiker parkir, gangguan area parkir, kendaraan dinas" },
        { name: "Utilitas (Listrik, Air, Gas)", description: "Gangguan listrik, air mati, generator, meteran utilitas" },
      ],
    },
    {
      name: "Perpustakaan",
      department: "Perpustakaan",
      responseTimeHours: 8,
      resolveTimeHours: 48,
      children: [
        { name: "Keanggotaan Perpustakaan", description: "Pendaftaran anggota baru, perpanjangan kartu, status keanggotaan" },
        { name: "Peminjaman & Pengembalian", description: "Peminjaman buku, perpanjangan, keterlambatan, denda, pengembalian" },
        { name: "Reservasi & Ketersediaan Buku", description: "Pemesanan buku, status ketersediaan, antrian koleksi" },
        { name: "Koleksi & Katalog", description: "Penambahan koleksi baru, katalog online, permintaan referensi" },
        { name: "Ruang Baca & Fasilitas", description: "Booking ruang diskusi, kerusakan fasilitas, saran ruang baca" },
        { name: "Layanan Digital & E-Resource", description: "Akses e-book, jurnal online, database penelitian, masalah login" },
      ],
    },
    {
      name: "LP2M",
      department: "LP2M",
      responseTimeHours: 8,
      resolveTimeHours: 48,
      children: [
        { name: "Penelitian Internal", description: "Proposal penelitian dosen, hibah internal, pengajuan dana riset" },
        { name: "Pengabdian Masyarakat", description: "Program PKM, pendampingan desa, laporan kegiatan pengabdian" },
        { name: "Publikasi & Jurnal", description: "Pendampingan submit jurnal, penerbitan prosiding, HAKI" },
        { name: "Hibah Eksternal", description: "Informasi hibah Dikti/Kemenristek, pendampingan proposal, pelaporan" },
        { name: "Etika & Regulasi Penelitian", description: "Persetujuan etik penelitian, pedoman riset, regulasi publikasi" },
      ],
    },
    {
      name: "Kemahasiswaan",
      department: "Kemahasiswaan",
      responseTimeHours: 8,
      resolveTimeHours: 48,
      children: [
        { name: "Organisasi & UKM", description: "Pendaftaran UKM, perizinan kegiatan organisasi mahasiswa, pengurus" },
        { name: "Beasiswa Eksternal", description: "Informasi beasiswa pemerintah/swasta, pendampingan berkas, seleksi" },
        { name: "Kegiatan Kemahasiswaan", description: "Proposal kegiatan, anggaran, laporan pertanggungjawaban acara" },
        { name: "Prestasi & Kompetisi", description: "Pendaftaran lomba, pendampingan delegasi, rekap prestasi mahasiswa" },
        { name: "Konseling & Kesejahteraan", description: "Layanan konseling mahasiswa, masalah kesejahteraan, aduan sosial" },
        { name: "Surat Keterangan Kemahasiswaan", description: "Surat aktif organisasi, rekomendasi kegiatan, keterangan non-beasiswa" },
      ],
    },
    {
      name: "Sistem Informasi & IT Support",
      department: "Sistem Informasi & IT Support",
      responseTimeHours: 4,
      resolveTimeHours: 24,
      children: [
        { name: "Akun & Autentikasi", description: "Reset password, akun terkunci, SSO kampus, email institusi" },
        { name: "Sistem Informasi Akademik (SIAKAD)", description: "Error akses, data tidak sesuai, fitur tidak berfungsi" },
        { name: "E-Learning / LMS", description: "Akses kelas daring, tugas tidak terunggah, video tidak terbuka" },
        { name: "Jaringan & Wi-Fi Kampus", description: "Internet lambat, tidak bisa konek Wi-Fi, gangguan jaringan area" },
        { name: "Perangkat & Lab Komputer", description: "Kerusakan komputer lab, printer, permintaan instalasi software" },
        { name: "Email & Aplikasi Resmi", description: "Microsoft 365, Google Workspace, konfigurasi akun email" },
        { name: "Keamanan Siber & Data", description: "Laporan phishing, akun diretas, kebocoran data" },
        { name: "Sistem Baru & Pengembangan", description: "Permintaan fitur, bug report, pengembangan sistem internal" },
      ],
    },
  ];

  for (const parent of categoryTree) {
    let parentCat = await prisma.category.findFirst({
      where: { name: parent.name, parentId: null },
    });
    if (!parentCat) {
      parentCat = await prisma.category.create({
        data: {
          name: parent.name,
          department: parent.department,
          responseTimeHours: parent.responseTimeHours,
          resolveTimeHours: parent.resolveTimeHours,
        },
      });
    }

    for (const child of parent.children) {
      const existingChild = await prisma.category.findFirst({
        where: { name: child.name, parentId: parentCat.id },
      });
      if (!existingChild) {
        await prisma.category.create({
          data: {
            name: child.name,
            description: child.description,
            department: parent.department,
            responseTimeHours: child.responseTimeHours ?? parent.responseTimeHours,
            resolveTimeHours: child.resolveTimeHours ?? parent.resolveTimeHours,
            parentId: parentCat.id,
          },
        });
      }
    }
  }

  console.log("Seed data created:");
  console.log({ admin, tech1, tech2, user, deptHeadKeuangan, deptHeadHRD, deptHeadBAA, deptHeadKemahasiswaan, agentKemahasiswaan, deptHeadPerpustakaan, agentPerpustakaan });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
