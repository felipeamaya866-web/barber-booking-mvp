// app/api/barbershop/appointments/[id]/route.ts
// PUT - Cambiar estado de una cita (CONFIRMED, COMPLETED, CANCELLED)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await prisma.barbershop.findUnique({ where: { ownerId: session.user.id } });
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const { id } = await params;

    // Verificar que la cita pertenece a esta barbería
    const existing = await prisma.appointment.findFirst({
      where: { id, barbershopId: barbershop.id },
    });
    if (!existing) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });

    const { status, notes } = await req.json();

    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes  !== undefined && { notes }),
      },
      include: {
        service: { select: { name: true, duration: true, price: true } },
        barber:  { select: { name: true, photo: true } },
        client:  { select: { name: true, email: true, image: true } },
      },
    });

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error('[APPOINTMENTS PUT]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}