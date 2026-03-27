import type { NextConfig } from "next";

/**
 * Static export configuration.
 *
 * Environment variables (set at build time):
 *   NEXT_PUBLIC_FITMENT_API_URL — Backend API URL for protected fitment lookups.
 *     If empty/unset, frontend falls back to local JSON files (full-data mode).
 *     Example: "https://internal-pricing-core.up.railway.app"
 */
const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
