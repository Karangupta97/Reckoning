import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RoadWatch",
    short_name: "RoadWatch",
    description: "Civic road accountability PWA with camera, GPS, and offline support.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F1117",
    theme_color: "#F59E0B",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
