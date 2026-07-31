// GET  /api/barbershop/combos — lista combos de servicios
// POST /api/barbershop/combos — crea combo

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

    const combos = await prisma.serviceCombo.findMany({
      where: { barbershopId: barbershop.id },
      include: {
        items: {
          include: { service: { select: { id: true, name: true, price: true, duration: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ combos });
  } catch (error) {
    console.error('[COMBOS GET]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await getOwnerBarbershop(session.user.id);
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const { name, description, price, serviceIds, isActive } = await req.json() as {
      name: string; description?: string; price: number; serviceIds: string[]; isActive?: boolean;
    };

    if (!name || price == null || !serviceIds?.length) {
      return NextResponse.json({ error: 'Nombre, precio y al menos un servicio son requeridos' }, { status: 400 });
    }

    const combo = await prisma.serviceCombo.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(String(price)),
        isActive: isActive ?? true,
        barbershopId: barbershop.id,
        items: {
          create: serviceIds.map((serviceId: string) => ({ serviceId })),
        },
      },
      include: {
        items: {
          include: { service: { select: { id: true, name: true, price: true, duration: true } } },
        },
      },
    });

    return NextResponse.json({ combo }, { status: 201 });
  } catch (error) {
    console.error('[COMBOS POST]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
