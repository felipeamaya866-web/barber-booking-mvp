// app/api/barber/me/route.ts
// GET - Perfil completo del barbero vinculado al usuario logueado

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barber = await prisma.barber.findUnique({
      where: { userId: session.user.id },
      include: {
        barbershop: {
          select: {
            id:          true,
            name:        true,
            slug:        true,
            logo:        true,
            colors:      true,
            phone:       true,
            address:     true,
            services:    { select: { id: true, name: true, price: true, duration: true } },
            subscription:{ select: { plan: true, status: true } },
          },
        },
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        breaks:    { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      },
    });

    if (!barber) return NextResponse.json({ error: 'Perfil de barbero no encontrado' }, { status: 404 });
    if (barber.inviteStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'Acceso pendiente de aprobación', inviteStatus: barber.inviteStatus }, { status: 403 });
    }

    return NextResponse.json({ barber });
  } catch (error) {
    console.error('[BARBER ME]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}