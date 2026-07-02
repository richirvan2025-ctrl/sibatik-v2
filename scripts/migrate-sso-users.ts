/**
 * Script migrasi untuk update email dan divisi user SSO yang sudah ada
 *
 * Cara menjalankan:
 * npx tsx scripts/migrate-sso-users.ts
 *
 * Script ini akan:
 * 1. Ambil semua user dengan provider="sso" dari database
 * 2. Untuk setiap user, panggil SSO API untuk dapat data email & divisi
 * 3. Update user record dengan data terbaru
 */

import { PrismaClient } from "@prisma/client";
import axios from "axios";
import https from "https";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

interface SSOUserResponse {
  id: string;
  name: string;
  email: string;
  divisi?: string;
}

async function fetchSSOUserData(ssoId: string): Promise<SSOUserResponse | null> {
  try {
    const baseUrl = process.env.SSO_INTERNAL_URL || process.env.SSO_BASE_URL || "";
    const appKey = process.env.SSO_APP_KEY || "";

    const params = new URLSearchParams({
      action: "validateToken",
      token: ssoId,
      app_key: appKey,
    });

    const response = await axios.post(
      `${baseUrl}/request/pDash.php`,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Host: "sinergy.idbbali.ac.id",
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 10000,
      }
    );

    if (response.data?.status && response.data?.user) {
      const u = response.data.user;
      return {
        id: String(u.id),
        name: u.name || u.nama_lengkap || "",
        email: u.email || "",
        divisi: u.divisi || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error(`  ❌ Error fetching SSO data for ssoId ${ssoId}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function main() {
  console.log("🚀 Starting SSO User Migration...\n");

  // Get all SSO users
  const ssoUsers = await prisma.user.findMany({
    where: {
      provider: "sso",
    },
  });

  console.log(`📊 Found ${ssoUsers.length} SSO users\n`);

  if (ssoUsers.length === 0) {
    console.log("✅ No SSO users to migrate");
    return;
  }

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const user of ssoUsers) {
    console.log(`\n👤 Processing: ${user.name} (ssoId: ${user.ssoId})`);

    if (!user.ssoId) {
      console.log("  ⚠️  No ssoId found, skipping");
      skippedCount++;
      continue;
    }

    // Fetch data from SSO
    const ssoData = await fetchSSOUserData(user.ssoId);

    if (!ssoData) {
      console.log("  ⚠️  Could not fetch data from SSO, skipping");
      errorCount++;
      continue;
    }

    console.log(`  📧 Email from SSO: ${ssoData.email || "(empty)"}`);
    console.log(`  🏢 Division from SSO: ${ssoData.divisi || "(empty)"}`);

    // Check if update is needed
    const needsUpdate =
      user.email !== ssoData.email ||
      user.department !== ssoData.divisi ||
      (!user.email && ssoData.email) ||
      (!user.department && ssoData.divisi);

    if (!needsUpdate) {
      console.log("  ✅ Already up to date, skipping");
      skippedCount++;
      continue;
    }

    // Update user
    try {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: ssoData.email || user.email,
          department: ssoData.divisi || user.department,
        },
      });

      console.log(`  ✅ Updated successfully`);
      console.log(`     Email: ${updated.email || "(still empty)"}`);
      console.log(`     Department: ${updated.department || "(still empty)"}`);
      updatedCount++;
    } catch (error) {
      console.error(`  ❌ Error updating user:`, error instanceof Error ? error.message : String(error));
      errorCount++;
    }

    // Small delay to avoid overwhelming SSO API
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Migration Summary:");
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total: ${ssoUsers.length}`);
  console.log("=".repeat(50));
}

main()
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
