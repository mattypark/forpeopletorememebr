import type { MetadataRoute } from "next";

/**
 * Web App Manifest — makes Rolodex installable on a phone home screen.
 * Icons live in /public (icon-192.png, icon-512.png, icon-maskable-512.png).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rolodex — your people",
    short_name: "Rolodex",
    description: "A personal CRM for everyone you meet and why they matter.",
    start_url: "/people",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e76f51",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
