// Geocodificación via Nominatim (OpenStreetMap) — gratuito, sin API key
// Política de uso: máx. 1 req/seg, User-Agent requerido

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (!address?.trim()) return null;

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=co`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'BarberBooking/1.0 (barber-booking-mvp.vercel.app)' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

// Fórmula Haversine — distancia en km entre dos coordenadas
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
