// app/api/barber/agenda/route.ts
// GET - Agenda personal del barbero (solo sus citas)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barber = await prisma.barber.findUnique({ where: { userId: session.user.id } });
    if (!barber || barber.inviteStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get('from');
    const toStr   = searchParams.get('to');

    if (!fromStr || !toStr) return NextResponse.json({ error: 'Se requiere from y to' }, { status: 400 });

    const [fy, fm, fd] = fromStr.split('-').map(Number);
    const [ty, tm, td] = toStr.split('-').map(Number);

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId: barber.id,
        date: {
          gte: new Date(fy, fm - 1, fd, 0, 0, 0),
          lte: new Date(ty, tm - 1, td, 23, 59, 59),
        },
      },
      include: {
        service: { select: { name: true, duration: true, price: true } },
        client:  { select: { name: true, email: true } },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ appointments, barberId: barber.id });
  } catch (error) {
    console.error('[BARBER AGENDA]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}