// PATCH /api/barbershop/appointments/[id]/attendance
// Marca si el cliente asistió (true) o no asistió (false) a la cita

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const { attended } = await req.json() as { attended: boolean | null };

    // Verificar que la cita pertenece a la barbería o al barbero del usuario
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        barbershop: { select: { ownerId: true } },
        barber:     { select: { userId: true } },
      },
    });

    if (!appointment) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });

    const isOwner  = appointment.barbershop.ownerId === session.user.id;
    const isBarber = appointment.barber.userId === session.user.id;

    if (!isOwner && !isBarber) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data:  { attended },
    });

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error('[ATTENDANCE PATCH]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
