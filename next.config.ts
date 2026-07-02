import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.1.15", "*.loca.lt"],
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig;
