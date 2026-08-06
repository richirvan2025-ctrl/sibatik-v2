import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import { getNamaLengkapFromSinergy } from "./sinergy-db";

interface SinergyTokenResponse {
  code?: number | string;
  idsso?: number | string;
  pengguna?: string;
  nama_lengkap?: string;
}

function getSinergyBaseUrl() {
  return (
    process.env.SSO_INTERNAL_URL ||
    process.env.SSO_BASE_URL ||
    "https://sinergy.idbbali.ac.id"
  );
}

export function getSibatikBaseUrl() {
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "https://sibatik.idbbali.ac.id"
  );
}

export function getSinergyLoginUrl() {
  const sinergyUrl = new URL(
    "/login.php",
    process.env.NEXT_PUBLIC_SINERGY_URL ||
      process.env.SSO_BASE_URL ||
      "https://sinergy.idbbali.ac.id"
  );
  const callbackUrl = new URL("/sso/callback", getSibatikBaseUrl());

  sinergyUrl.searchParams.set("redirect", callbackUrl.toString());
  return sinergyUrl.toString();
}

export function verifySinergySignature(token: string, signature: string) {
  const secret = process.env.SSO_SIGNATURE_SECRET;

  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(token)
    .digest("hex");
  const providedBuffer = Buffer.from(signature.toLowerCase());
  const expectedBuffer = Buffer.from(expectedSignature);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

async function checkSinergyToken(token: string) {
  const url = new URL("/class/checkToken.php", getSinergyBaseUrl());
  url.searchParams.set("token", token);

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Host: "sinergy.idbbali.ac.id",
    },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as SinergyTokenResponse;
  if (Number(data.code) !== 200 || data.idsso === undefined) return null;

  // Ambil nama_lengkap dari database Sinergy (tb_user_sso)
  const namaLengkap = await getNamaLengkapFromSinergy(String(data.idsso));

  return {
    displayName:
      (namaLengkap?.trim())
        || (typeof data.nama_lengkap === "string" && data.nama_lengkap.trim())
        || (typeof data.pengguna === "string" && data.pengguna.trim())
        || `Pengguna Sinergy ${String(data.idsso)}`,
    ssoId: String(data.idsso),
  };
}

export async function resolveSinergyUser(token: string) {
  const identity = await checkSinergyToken(token);
  if (!identity) return null;

  let user = await prisma.user.findUnique({
    where: { ssoId: identity.ssoId },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { username: identity.displayName },
    });
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        isActive: true,
        name: identity.displayName,
        provider: "sinergy",
        role: "USER",
        ssoId: identity.ssoId,
        username: identity.displayName,
      },
    });
  } else if (!user.ssoId || user.provider !== "sinergy") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        provider: "sinergy",
        ssoId: identity.ssoId,
        name: identity.displayName,
      },
    });
  } else {
    // Sync nama_lengkap terbaru dari Sinergy setiap login
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name: identity.displayName },
    });
  }

  return user.isActive ? user : null;
}
