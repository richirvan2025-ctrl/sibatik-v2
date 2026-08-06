import "server-only";

import mysql from "mysql2/promise";

/**
 * Ambil nama_lengkap dari tb_user_sso di database Sinergy.
 * Mengembalikan null jika tidak ditemukan atau koneksi gagal.
 */
export async function getNamaLengkapFromSinergy(
  ssoId: string
): Promise<string | null> {
  const dbUrl = process.env.SSO_DB_URL;
  if (!dbUrl) return null;

  let conn: mysql.Connection | null = null;

  try {
    conn = await mysql.createConnection(dbUrl);
    const [rows] = (await conn.execute(
      "SELECT nama_lengkap FROM tb_user_sso WHERE id_sso = ? LIMIT 1",
      [ssoId]
    )) as [Array<{ nama_lengkap: string | null }>, unknown];

    if (rows.length > 0 && rows[0].nama_lengkap) {
      return rows[0].nama_lengkap.trim();
    }

    return null;
  } catch {
    // Gagal koneksi ke database Sinergy — fallback ke API response
    return null;
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {
        // Abaikan error saat menutup koneksi
      }
    }
  }
}
