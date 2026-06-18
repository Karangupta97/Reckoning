declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface RuntimeCachingEntry {
    urlPattern: RegExp | string;
    handler:
      | "CacheFirst"
      | "CacheOnly"
      | "NetworkFirst"
      | "NetworkOnly"
      | "StaleWhileRevalidate";
    options?: Record<string, unknown>;
  }

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    scope?: string;
    sw?: string;
    cacheOnFrontEndNav?: boolean;
    buildExcludes?: Array<RegExp | string>;
    publicExcludes?: string[];
    runtimeCaching?: RuntimeCachingEntry[];
    [key: string]: unknown;
  }

  export default function withPWA(
    config?: PWAConfig,
  ): (nextConfig: NextConfig) => NextConfig;
}
