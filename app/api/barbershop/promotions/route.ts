// GET  /api/barbershop/promotions
// POST /api/barbershop/promotions

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getOwnerBarbershop(userId: string) {
  return prisma.barbershop.findUnique({ where: { ownerId: userId } });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await getOwnerBarbershop(session.user.id);
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const promotions = await prisma.promotion.findMany({
      where: { barbershopId: barbershop.id },
      orderBy: { validUntil: 'desc' },
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error('[PROMOTIONS GET]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await getOwnerBarbershop(session.user.id);
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const { title, description, discount, discountType, validFrom, validUntil, isActive } = await req.json();

    if (!title || discount == null || !validFrom || !validUntil) {
      return NextResponse.json({ error: 'Título, descuento y fechas son requeridos' }, { status: 400 });
    }

    const promotion = await prisma.promotion.create({
      data: {
        title,
        description: description || null,
        discount: parseFloat(discount),
        discountType: discountType || 'PERCENT',
        validFrom:  new Date(validFrom),
        validUntil: new Date(validUntil),
        isActive: isActive ?? true,
        barbershopId: barbershop.id,
      },
    });

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    console.error('[PROMOTIONS POST]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
