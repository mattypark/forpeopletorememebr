import type { MetadataRoute } from "next";

/**
 * Web App Manifest — makes Bery installable on a phone home screen.
 * Icons live in /public (icon-192.png, icon-512.png, icon-maskable-512.png).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bery — remember everyone",
    short_name: "Bery",
    description:
      "Your network, searchable by intent. Bery remembers everyone you meet and who can help with what.",
    start_url: "/people",
    display: "standalone",
    background_color: "#faf4e9",
    theme_color: "#cf2250",
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
