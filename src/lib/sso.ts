import axios from 'axios'
import https from 'https'
import mysql from 'mysql2/promise'

export interface SSOUser {
  id: string
  name: string
  email: string
  divisi?: string
}

export async function validateSSOToken(token: string): Promise<SSOUser | null> {
  try {
    const params = new URLSearchParams({
      action: 'validateToken',
      token,
      app_key: process.env.SSO_APP_KEY || '',
    })

    const baseUrl = process.env.SSO_INTERNAL_URL || process.env.SSO_BASE_URL || ''

    console.log('[SSO] validateSSOToken calling:', `${baseUrl}/request/pDash.php`)

    const response = await axios.post(
      `${baseUrl}/request/pDash.php`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Host': 'sinergy.idbbali.ac.id',
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    )

    console.log('[SSO] validateSSOToken response:', JSON.stringify(response.data, null, 2))

    if (response.data?.status && response.data?.user) {
      const u = response.data.user
      return {
        id: String(u.id),
        name: u.name || '',
        email: u.email || '',
        divisi: u.divisi || undefined,
      }
    }

    return null
  } catch (error) {
    console.error('[SSO] validateSSOToken error:', error instanceof Error ? error.message : String(error))
    return null
  }
}

/**
 * Fetch user data from SSO by ssoId using the token
 * This is used to get email and other user details when creating a new user
 */
export async function fetchSSOUserBySsoId(ssoId: string, token: string): Promise<SSOUser | null> {
  try {
    const baseUrl = process.env.SSO_INTERNAL_URL || process.env.SSO_BASE_URL || ''

    // Try to get user info using the token
    const response = await axios.get(`${baseUrl}/class/getUserInfo.php`, {
      params: { token, idsso: ssoId },
      headers: { Host: 'sinergy.idbbali.ac.id' },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 5000,
    })

    console.log('[SSO] getUserInfo response:', response.data)

    if (response.data?.code === 200 && response.data?.user) {
      const u = response.data.user
      return {
   id: String(u.id || u.idsso || ssoId),
  name: u.name || '',
        email: u.email || '',
        divisi: u.divisi || u.division || undefined,
      }
    }

    return null
  } catch (error) {
    console.error('[SSO] fetchSSOUserBySsoId error:', error instanceof Error ? error.message : String(error))
    return null
  }
}

/**
 * Fetch user email from SSO database directly
 * Query db_dshsso.tb_user_sso by idsso
 */
export async function fetchSSOUserFromDB(ssoId: string): Promise<{ email: string; nama_lengkap?: string } | null> {
  const ssoDbUrl = process.env.SSO_DB_URL
  if (!ssoDbUrl) {
    console.error('[SSO] SSO_DB_URL not configured')
    return null
  }

  let connection: mysql.Connection | null = null
  try {
    connection = await mysql.createConnection(ssoDbUrl)

    const [rows] = await connection.execute(
      'SELECT email, nama_lengkap FROM tb_user_sso WHERE id_sso = ? LIMIT 1',
      [ssoId]
    )

    const result = rows as any[]
    if (result.length > 0) {
      console.log('[SSO] DB query result for ssoId', ssoId, ':', result[0])
      return {
        email: result[0].email || '',
        nama_lengkap: result[0].nama_lengkap || undefined,
      }
    }

    return null
  } catch (error) {
    console.error('[SSO] DB query error:', error instanceof Error ? error.message : String(error))
    return null
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}
