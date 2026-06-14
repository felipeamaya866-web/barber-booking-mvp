// GET /api/public/search?q=...
// Busca barberías por nombre o slug (coincidencia parcial, case-insensitive)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const barbershops = await prisma.barbershop.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        name:        true,
        slug:        true,
        description: true,
        address:     true,
        logo:        true,
        colors:      true,
        _count: { select: { services: true } },
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    const results = barbershops.map(b => ({
      name:        b.name,
      slug:        b.slug,
      description: b.description ?? '',
      address:     b.address    ?? '',
      logoUrl:     b.logo       ?? '',
      primaryColor: b.colors[0] ?? '#111827',
      serviceCount: b._count.services,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[SEARCH]', error);
    return NextResponse.json({ error: 'Error al buscar' }, { status: 500 });
  }
}
