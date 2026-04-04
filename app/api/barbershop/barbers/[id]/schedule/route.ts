// app/api/barbershop/barbers/[id]/schedule/route.ts
// GET - Obtener horarios de un barbero
// PUT - Guardar horarios de un barbero (los 7 días)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Verificar que el barbero pertenece a la barbería del usuario autenticado
async function getBarberWithAuth(barberId: string, userId: string) {
  const barbershop = await prisma.barbershop.findUnique({ where: { ownerId: userId } });
  if (!barbershop) return null;
  return prisma.barber.findFirst({ where: { id: barberId, barbershopId: barbershop.id } });
}

// ─────────────────────────────────────────────
// GET /api/barbershop/barbers/[id]/schedule
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

    const schedules = await prisma.barberSchedule.findMany({
      where:   { barberId: id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('[SCHEDULE GET]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// PUT /api/barbershop/barbers/[id]/schedule
// Body: { schedules: [{ dayOfWeek, startTime, endTime, isWorking }] }
// ─────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const barber  = await getBarberWithAuth(id, session.user.id);
    if (!barber) return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });

    const body = await req.json();
    const { schedules } = body as {
      schedules: { dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }[]
    };

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json({ error: 'Datos de horario inválidos' }, { status: 400 });
    }

    // Upsert cada día (crear si no existe, actualizar si existe)
    const updated = await Promise.all(
      schedules.map(s =>
        prisma.barberSchedule.upsert({
          where:  { barberId_dayOfWeek: { barberId: id, dayOfWeek: s.dayOfWeek } },
          create: { barberId: id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, isWorking: s.isWorking },
          update: { startTime: s.startTime, endTime: s.endTime, isWorking: s.isWorking },
        })
      )
    );

    return NextResponse.json({ schedules: updated });
  } catch (error) {
    console.error('[SCHEDULE PUT]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}