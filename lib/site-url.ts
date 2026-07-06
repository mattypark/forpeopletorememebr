/**
 * Canonical site origin for auth redirects. Set NEXT_PUBLIC_SITE_URL on Vercel
 * (e.g. https://forpeopletorememebr.vercel.app) so confirmation emails always
 * point at production even from preview deployments; falls back to the
 * current browser origin in dev.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}
