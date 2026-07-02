import mysql from 'mysql2/promise'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncSSOUsers() {
  const ssoDbUrl = process.env.SSO_DB_URL
  if (!ssoDbUrl) {
    console.error('❌ SSO_DB_URL tidak dikonfigurasi')
    process.exit(1)
  }

  let ssoConnection: mysql.Connection | null = null

  try {
    // Koneksi ke database SSO
    console.log('🔌 Menghubungkan ke database SSO...')
    ssoConnection = await mysql.createConnection(ssoDbUrl)

  // Query pegawai dari SSO
    console.log('📋 Mengambil data pegawai dari SSO...')
    const [rows] = await ssoConnection.execute(
      'SELECT pengguna, email FROM tb_user_sso WHERE reg_sso = ? AND email IS NOT NULL AND email != ""',
   ['PEG']
    )

    const ssoUsers = rows as Array<{ pengguna: string; email: string }>
    console.log(`✅ Ditemukan ${ssoUsers.length} pegawai di SSO`)

    // Ambil semua email yang sudah ada di helpdesk
    console.log('🔍 Memeriksa user yang sudah ada di helpdesk...')
    const existingUsers = await prisma.user.findMany({
      select: { email: true }
    })
    const existingEmails = new Set(
      existingUsers
    .map(u => u.email)
        .filter((email): email is string => email !== null)
    )

    // Filter user yang belum ada
    const newUsers = ssoUsers.filter(u => !existingEmails.has(u.email))
    console.log(`📝 ${newUsers.length} user baru akan dibuat`)

    if (newUsers.length === 0) {
      console.log('✨ Semua pegawai sudah terdaftar di helpdesk')
      return
    }

    // Insert user baru
    console.log('💾 Membuat user baru...')
    let created = 0
    let failed = 0

    for (const ssoUser of newUsers) {
      try {
  await prisma.user.create({
     data: {
 name: ssoUser.pengguna,
 username: ssoUser.pengguna,
            email: ssoUser.email,
       password: '',
   role: 'USER',
      provider: 'sso',
        isActive: true
       }
 })
        created++
        console.log(`  ✅ ${ssoUser.pengguna} (${ssoUser.email})`)
      } catch (error) {
   failed++
        console.error(`  ❌ Gagal membuat user ${ssoUser.email}:`, error instanceof Error ? error.message : String(error))
      }
    }

    console.log('\n📊 Ringkasan:')
    console.log(`  - Total pegawai di SSO: ${ssoUsers.length}`)
    console.log(`  - Sudah ada di helpdesk: ${ssoUsers.length - newUsers.length}`)
    console.log(`  - Berhasil dibuat: ${created}`)
    console.log(`  - Gagal: ${failed}`)

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  } finally {
    if (ssoConnection) {
      await ssoConnection.end()
    }
    await prisma.$disconnect()
  }
}

syncSSOUsers()
