"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapPin {
  id: string;
  name: string;
  subtitle: string;
  photoUrl: string | null;
  metPlace: string;
  timesMet: number;
  lat: number;
  lng: number;
}

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function rasterStyle(dark: boolean): maplibregl.StyleSpecification {
  const flavor = dark ? "dark_all" : "light_all";
  return {
    version: 8,
    sources: {
      carto: {
        type: "raster",
        tiles: ["a", "b", "c", "d"].map(
          (s) => `https://${s}.basemaps.cartocdn.com/${flavor}/{z}/{x}/{y}@2x.png`,
        ),
        tileSize: 256,
        attribution: ATTRIBUTION,
      },
    },
    layers: [{ id: "carto", type: "raster", source: "carto" }],
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(pin: MapPin): string {
  const name = escapeHtml(pin.name);
  const subtitle = pin.subtitle ? escapeHtml(pin.subtitle) : "";
  const place = escapeHtml(pin.metPlace);
  const avatar = pin.photoUrl
    ? `<img src="${escapeHtml(pin.photoUrl)}" alt="" style="width:44px;height:44px;border-radius:9999px;object-fit:cover;flex-shrink:0;" />`
    : `<div style="width:44px;height:44px;border-radius:9999px;background:hsl(349 72% 47%);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;flex-shrink:0;">${name[0] ?? "?"}</div>`;
  return `
    <div style="display:flex;align-items:center;gap:10px;padding:2px 4px;">
      ${avatar}
      <div style="min-width:0;">
        <p style="margin:0;font-weight:600;font-size:14px;line-height:1.3;">${name}</p>
        ${subtitle ? `<p style=\"margin:0;font-size:12px;opacity:0.7;\">${subtitle}</p>` : ""}
        <p style="margin:2px 0 0;font-size:11px;opacity:0.6;">${place}${pin.timesMet > 1 ? ` · met ${pin.timesMet}×` : ""}</p>
      </div>
    </div>`;
}

export function PeopleMap({ pins }: { pins: MapPin[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!containerRef.current) return;

    // Default view: continental US — world map, zoom/pan free.
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: rasterStyle(isDark),
      center: pins.length === 1 ? [pins[0].lng, pins[0].lat] : [-98.5, 39.5],
      zoom: pins.length === 1 ? 9 : 3.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));

    if (pins.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      for (const pin of pins) bounds.extend([pin.lng, pin.lat]);
      map.fitBounds(bounds, { padding: 72, maxZoom: 11, duration: 0 });
    }

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      maxWidth: "260px",
    });

    for (const pin of pins) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", pin.name);
      dot.style.cssText =
        "width:16px;height:16px;border-radius:9999px;background:hsl(349 72% 47%);border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.4);cursor:pointer;padding:0;transition:transform 150ms ease;";

      dot.addEventListener("mouseenter", () => {
        dot.style.transform = "scale(1.4)";
        popup.setLngLat([pin.lng, pin.lat]).setHTML(popupHtml(pin)).addTo(map);
      });
      dot.addEventListener("mouseleave", () => {
        dot.style.transform = "scale(1)";
        popup.remove();
      });
      dot.addEventListener("click", () => router.push(`/people/${pin.id}`));

      new maplibregl.Marker({ element: dot }).setLngLat([pin.lng, pin.lat]).addTo(map);
    }

    return () => {
      popup.remove();
      map.remove();
      mapRef.current = null;
    };
    // Recreate the map when the theme flips — raster style swap needs a reload.
  }, [pins, isDark, router]);

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-16rem)] min-h-[420px] w-full overflow-hidden rounded-2xl border border-border"
    />
  );
}
