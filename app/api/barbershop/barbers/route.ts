// app/api/barbershop/barbers/route.ts
// GET  - Listar barberos de la barbería
// POST - Crear nuevo barbero

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ─────────────────────────────────────────────
// HELPER: obtener barbería del usuario autenticado
// ─────────────────────────────────────────────
async function getBarbershop(userId: string) {
  return prisma.barbershop.findUnique({
    where:   { ownerId: userId },
    include: { subscription: true },
  });
}

// ─────────────────────────────────────────────
// GET /api/barbershop/barbers
// ─────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const barbershop = await getBarbershop(session.user.id);
    if (!barbershop) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });
    }

    const barbers = await prisma.barber.findMany({
      where:   { barbershopId: barbershop.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ barbers });
  } catch (error) {
    console.error('[BARBERS GET]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// POST /api/barbershop/barbers
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const barbershop = await getBarbershop(session.user.id);
    if (!barbershop) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });
    }

    // Validar límite del plan
    const maxBarbers = barbershop.subscription?.maxBarbers ?? 1;
    const currentCount = await prisma.barber.count({
      where: { barbershopId: barbershop.id },
    });

    if (currentCount >= maxBarbers) {
      return NextResponse.json(
        {
          error: `Tu plan ${barbershop.subscription?.plan} solo permite ${maxBarbers} barbero${maxBarbers > 1 ? 's' : ''}. Actualiza tu plan para agregar más.`,
          limitReached: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, phone, email, bio } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    const barber = await prisma.barber.create({
      data: {
        name:        name.trim(),
        phone:       phone || null,
        email:       email || null,
        bio:         bio   || null,
        barbershopId: barbershop.id,
      },
    });

    return NextResponse.json({ barber }, { status: 201 });
  } catch (error) {
    console.error('[BARBERS POST]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}