// app/api/barbershop/appointments/route.ts
// GET  - Citas de la semana (filtro por fecha inicio/fin y barbero opcional)
// POST - Crear cita manualmente desde el dashboard

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ─────────────────────────────────────────────
// GET /api/barbershop/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD&barberId=xxx
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await prisma.barbershop.findUnique({ where: { ownerId: session.user.id } });
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const fromStr  = searchParams.get('from'); // YYYY-MM-DD
    const toStr    = searchParams.get('to');   // YYYY-MM-DD
    const barberId = searchParams.get('barberId') || undefined;

    if (!fromStr || !toStr) return NextResponse.json({ error: 'Se requiere from y to' }, { status: 400 });

    const [fy, fm, fd] = fromStr.split('-').map(Number);
    const [ty, tm, td] = toStr.split('-').map(Number);
    const from = new Date(fy, fm - 1, fd, 0, 0, 0);
    const to   = new Date(ty, tm - 1, td, 23, 59, 59);

    const appointments = await prisma.appointment.findMany({
      where: {
        barbershopId: barbershop.id,
        date: { gte: from, lte: to },
        ...(barberId ? { barberId } : {}),
      },
      include: {
        service: { select: { name: true, duration: true, price: true } },
        barber:  { select: { name: true, photo: true } },
        client:  { select: { name: true, email: true, image: true } },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('[APPOINTMENTS GET]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// POST /api/barbershop/appointments  (cita manual)
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await prisma.barbershop.findUnique({ where: { ownerId: session.user.id } });
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const { serviceId, barberId, datetime, guestName, guestPhone, notes } = await req.json();

    if (!serviceId || !barberId || !datetime || !guestName) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Verificar que servicio y barbero pertenecen a esta barbería
    const [service, barber] = await Promise.all([
      prisma.service.findFirst({ where: { id: serviceId, barbershopId: barbershop.id } }),
      prisma.barber.findFirst({ where: { id: barberId,  barbershopId: barbershop.id } }),
    ]);
    if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    if (!barber)  return NextResponse.json({ error: 'Barbero no encontrado' },  { status: 404 });

    const appointment = await prisma.appointment.create({
      data: {
        date:         new Date(datetime),
        status:       'CONFIRMED',
        notes:        notes || null,
        serviceId,
        barberId,
        barbershopId: barbershop.id,
        guestName,
        guestPhone:   guestPhone || null,
      },
      include: {
        service: { select: { name: true, duration: true, price: true } },
        barber:  { select: { name: true, photo: true } },
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('[APPOINTMENTS POST]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}