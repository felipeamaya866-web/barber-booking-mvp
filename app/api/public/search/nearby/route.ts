// GET /api/public/search/nearby?lat=4.6&lng=-74.0&radius=10
// Devuelve barberías activas o en trial ordenadas por distancia

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { haversineKm } from '@/lib/geocode';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const lat    = parseFloat(params.get('lat') ?? '');
  const lng    = parseFloat(params.get('lng') ?? '');
  const radius = parseFloat(params.get('radius') ?? '15'); // km

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
  }

  try {
    const barbershops = await prisma.barbershop.findMany({
      where: {
        lat: { not: null },
        lng: { not: null },
        subscription: { status: { in: ['ACTIVE', 'TRIAL'] } },
      },
      select: {
        name:        true,
        slug:        true,
        description: true,
        address:     true,
        logo:        true,
        colors:      true,
        lat:         true,
        lng:         true,
        _count: { select: { services: true } },
      },
    });

    const nearby = barbershops
      .map(b => ({
        name:         b.name,
        slug:         b.slug,
        description:  b.description ?? '',
        address:      b.address     ?? '',
        logoUrl:      b.logo        ?? '',
        primaryColor: b.colors[0]   ?? '#111827',
        serviceCount: b._count.services,
        distanceKm:   haversineKm(lat, lng, b.lat!, b.lng!),
      }))
      .filter(b => b.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20);

    return NextResponse.json({ results: nearby, userLat: lat, userLng: lng });
  } catch (error) {
    console.error('[NEARBY]', error);
    return NextResponse.json({ error: 'Error al buscar barberías cercanas' }, { status: 500 });
  }
}
