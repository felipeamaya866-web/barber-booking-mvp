// app/api/barbershop/barbers/[id]/breaks/route.ts
// GET    - Listar descansos de un barbero
// POST   - Crear nuevo descanso
// DELETE - Eliminar descanso (por query param ?breakId=xxx)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getBarberWithAuth(barberId: string, userId: string) {
  const barbershop = await prisma.barbershop.findUnique({ where: { ownerId: userId } });
  if (!barbershop) return null;
  return prisma.barber.findFirst({ where: { id: barberId, barbershopId: barbershop.id } });
}

// ─────────────────────────────────────────────
// GET /api/barbershop/barbers/[id]/breaks
// ─────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const barber  = await getBarberWithAuth(id, session.user.id);
    if (!barber) return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });

    const breaks = await prisma.barberBreak.findMany({
      where:   { barberId: id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ breaks });
  } catch (error) {
    console.error('[BREAKS GET]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// POST /api/barbershop/barbers/[id]/breaks
// Body: { label, dayOfWeek, startTime, endTime }
// ─────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const barber  = await getBarberWithAuth(id, session.user.id);
    if (!barber) return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });

    const { label, dayOfWeek, startTime, endTime } = await req.json();

    if (!label || startTime === undefined || endTime === undefined || dayOfWeek === undefined) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }
    if (startTime >= endTime) {
      return NextResponse.json({ error: 'La hora de inicio debe ser antes de la hora de fin' }, { status: 400 });
    }

    const newBreak = await prisma.barberBreak.create({
      data: { barberId: id, label: label.trim(), dayOfWeek, startTime, endTime },
    });

    return NextResponse.json({ break: newBreak }, { status: 201 });
  } catch (error) {
    console.error('[BREAKS POST]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// DELETE /api/barbershop/barbers/[id]/breaks?breakId=xxx
// ─────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const barber  = await getBarberWithAuth(id, session.user.id);
    if (!barber) return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });

    const breakId = new URL(req.url).searchParams.get('breakId');
    if (!breakId) return NextResponse.json({ error: 'breakId requerido' }, { status: 400 });

    await prisma.barberBreak.delete({ where: { id: breakId } });

    return NextResponse.json({ message: 'Descanso eliminado' });
  } catch (error) {
    console.error('[BREAKS DELETE]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}