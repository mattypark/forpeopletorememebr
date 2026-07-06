import "server-only";

/**
 * Free-text place → coordinates via OpenStreetMap Nominatim (free, no key).
 * Best-effort: returns null on any failure so saving a person never blocks
 * on geocoding. Nominatim asks for a descriptive User-Agent.
 */
export interface GeoPoint {
  lat: number;
  lng: number;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const GEOCODE_TIMEOUT_MS = 6000;

export interface PlaceSuggestion {
  label: string;
  lat: number;
  lng: number;
}

/**
 * Autocomplete suggestions for "Where we met" — place name + address.
 * Same Nominatim backend as geocodePlace; results cached a month.
 */
export async function suggestPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  try {
    const url = `${NOMINATIM_URL}?format=jsonv2&limit=5&addressdetails=0&q=${encodeURIComponent(q)}`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "bery-personal-crm/1.0 (contact: via app)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!resp.ok) return [];

    const results = (await resp.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>;

    return results
      .map((r) => ({
        label: r.display_name,
        lat: Number.parseFloat(r.lat),
        lng: Number.parseFloat(r.lon),
      }))
      .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));
  } catch {
    return [];
  }
}

export async function geocodePlace(place: string): Promise<GeoPoint | null> {
  const q = place.trim();
  if (!q) return null;

  try {
    const url = `${NOMINATIM_URL}?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "bery-personal-crm/1.0 (contact: via app)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
      // Same place text always resolves the same — cache aggressively.
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!resp.ok) return null;

    const results = (await resp.json()) as Array<{ lat: string; lon: string }>;
    const first = results?.[0];
    if (!first) return null;

    const lat = Number.parseFloat(first.lat);
    const lng = Number.parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
