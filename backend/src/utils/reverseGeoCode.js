import axios from "axios";

// Simple in-memory cache (avoid hitting API for same coords repeatedly)
const geoCache = new Map();

/**
 * Reverse geocode latitude & longitude to get city, state, and country names.
 * Uses OpenStreetMap Nominatim API (free, no key required).
 */
export async function getCityFromCoordinates(lat, lon) {
  try {
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`; // ≈ 100m precision
    if (geoCache.has(key)) return geoCache.get(key);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "lte-signal-map-backend/1.0 (contact@example.com)",
      },
      timeout: 5000,
    });

    if (!data?.address) {
      console.warn(`⚠️ No address found for lat=${lat}, lon=${lon}`);
      return null;
    }

    const addr = data.address;

    const result = {
      // ✅ broader city fallback
      city:
        addr.city ||
        addr.town ||
        addr.village ||
        addr.hamlet ||
        addr.suburb ||
        addr.neighbourhood ||
        null,

      // ✅ broaden state fallbacks (for cases like Glendale)
      state:
        addr.state ||
        addr.state_district ||
        addr.region ||
        addr.province ||
        addr.county ||
        null,

      // ✅ normalize “United States of America” to “United States” (optional)
      country:
        addr.country === "United States of America"
          ? "United States"
          : addr.country || null,

      display_name: data.display_name || null,
    };

    // ✅ Cache result
    geoCache.set(key, result);

    console.log("🌍 Reverse Geocode:", result);

    return result;
  } catch (err) {
    console.error("Reverse geocode failed:", err.message);
    return null;
  }
}
