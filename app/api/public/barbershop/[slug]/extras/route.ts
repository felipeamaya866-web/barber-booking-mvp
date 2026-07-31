// GET /api/public/barbershop/[slug]/extras
// Devuelve productos, combos y promociones activas de una barbería (público)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const barbershop = await prisma.barbershop.findUnique({ where: { slug } });
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const now = new Date();

    const [products, combos, promotions] = await Promise.all([
      prisma.product.findMany({
        where: { barbershopId: barbershop.id, isAvailable: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceCombo.findMany({
        where: { barbershopId: barbershop.id, isActive: true },
        include: {
          items: {
            include: { service: { select: { id: true, name: true, price: true, duration: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.promotion.findMany({
        where: {
          barbershopId: barbershop.id,
          isActive:    true,
          validFrom:   { lte: now },
          validUntil:  { gte: now },
        },
        orderBy: { validUntil: 'asc' },
      }),
    ]);

    return NextResponse.json({ products, combos, promotions });
  } catch (error) {
    console.error('[PUBLIC EXTRAS GET]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
