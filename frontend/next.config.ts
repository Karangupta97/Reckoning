import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
// next-pwa ships CommonJS without bundled types.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";

const baseConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

/**
 * PWA / Workbox configuration.
 *
 * `dest: "public"` emits `public/sw.js`. The Workbox runtime caching rules below
 * make sure the offline shell works:
 *  - `/messages/*.json`  → StaleWhileRevalidate so translations work offline
 *  - `/_next/static/**`  → precached automatically by next-pwa
 *  - `/` and `/report`   → NetworkFirst app-shell routes
 *
 * IMPORTANT: next-pwa injects a `webpack()` hook into the Next config. In dev,
 * Next.js 16 runs Turbopack, which is incompatible with a webpack-only plugin and
 * panics in a loop (`parse_segment_config_from_loader_tree`). PWA/offline support
 * is irrelevant in dev anyway, so we only apply the PWA wrapper for production
 * builds (which run with `next build --webpack`). Dev keeps a clean config.
 */
const applyPWA = (config: NextConfig): NextConfig => {
  if (isDev) {
    return config;
  }

  return withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    cacheOnFrontEndNav: true,
    buildExcludes: [/middleware-manifest\.json$/, /app-build-manifest\.json$/],
    runtimeCaching: [
      {
        // Offline-first translations.
        urlPattern: /\/messages\/.*\.json$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "reckoning-translations",
          expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // App-shell routes for offline access.
        urlPattern: /^\/(report)?$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "reckoning-shell",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 7 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "reckoning-fonts",
          expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Mapbox styles, tiles, glyphs and the GL JS stylesheet.
        urlPattern: /^https:\/\/(api|[abcd]\.tiles)\.mapbox\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "reckoning-mapbox",
          expiration: { maxEntries: 96, maxAgeSeconds: 60 * 60 * 24 * 7 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "reckoning-images",
          expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  })(config);
};

export default withNextIntl(applyPWA(baseConfig));
