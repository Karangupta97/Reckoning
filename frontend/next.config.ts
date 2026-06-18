import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  reloadOnOnline: true,
  disable: isDev,
  cacheOnFrontEndNav: true,
  cacheStartUrl: true,
  dynamicStartUrl: true,
  customWorkerSrc: "worker",
  fallbacks: {
    document: "/offline.html",
  },
  scope: "/",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
      exclude: [/\/[^/]+\/_buildManifest\.js$/, /\/[^/]+\/_ssgManifest\.js$/],
    runtimeCaching: [
      // ─── Citizen Dashboard routes (offline shell) ─────────────────────────
      {
        urlPattern: /^\/(dashboard|reports|map|notifications|profile|settings)(\/.*)?$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "reckoning-citizen-pages",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 7 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // ─── Translation / language packs ─────────────────────────────────────
      {
        urlPattern: /\/messages\/.*\.json$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "reckoning-translations",
          expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // ─── Next.js static assets (JS/CSS) ───────────────────────────────────
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "reckoning-next-static",
          expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // ─── Google Fonts ─────────────────────────────────────────────────────
      {
        urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "reckoning-fonts",
          expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // ─── Mapbox tiles and styles ──────────────────────────────────────────
      {
        urlPattern: /^https:\/\/(api|[abcd]\.tiles)\.mapbox\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "reckoning-mapbox",
          expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 7 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // ─── Images / Icons ───────────────────────────────────────────────────
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "reckoning-images",
          expiration: { maxEntries: 96, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // ─── Citizen API data ─────────────────────────────────────────────────
      {
        urlPattern: /\/api\/(reports|notifications|profile|dashboard|map)\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "reckoning-api-citizen",
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
    // Do NOT cache admin, staff, founder, or auth routes
    navigateFallbackDenylist: [
      /^\/admin/,
      /^\/staff/,
      /^\/founder/,
      /^\/auth/,
      /^\/login/,
      /^\/register/,
      /^\/forgot-password/,
      /^\/reset-password/,
      /^\/verify-otp/,
      /^\/resend-otp/,
      /^\/api\/admin/,
      /^\/api\/auth/,
    ],
  },
});

const baseConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  headers: async () => [
    {
      source: '/geojson/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=86400, stale-while-revalidate=604800',
        },
      ],
    },
  ],
};

export default withPWA(withNextIntl(baseConfig));
