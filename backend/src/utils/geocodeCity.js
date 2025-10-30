import axios from "axios";

const cityCache = new Map();

/**
 * Get approximate lat/lon for a city's center.
 * Uses OSM Nominatim. We cache results to avoid repeated calls.
 */
export async function getCityCenter(city, state, country) {
  if (!city) return null;
  const key = `${city}|${state || ""}|${country || ""}`.toLowerCase();
  if (cityCache.has(key)) return cityCache.get(key);

  // Build a reasonable query string
  const q = [city, state, country].filter(Boolean).join(", ");

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`;
  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "lte-signal-map-backend/1.0 (contact@example.com)" },
      timeout: 5000,
    });

    if (!Array.isArray(data) || data.length === 0) return null;

    const item = data[0];
    const center = { lat: Number(item.lat), lon: Number(item.lon) };
    cityCache.set(key, center);
    return center;
  } catch (err) {
    console.error("City geocode failed:", err.message);
    return null;
  }
}
