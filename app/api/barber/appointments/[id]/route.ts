// PATCH /api/barber/appointments/[id] — barbero cambia estado de su cita
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barber = await prisma.barber.findFirst({
      where: { userId: session.user.id },
    });
    if (!barber) return NextResponse.json({ error: 'Perfil de barbero no encontrado' }, { status: 404 });

    const { status } = await req.json();
    if (!['COMPLETED', 'CANCELLED', 'CONFIRMED'].includes(status)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    // Verificar que la cita pertenece a este barbero
    const appointment = await prisma.appointment.findFirst({
      where: { id: params.id, barberId: barber.id },
    });
    if (!appointment) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data:  { status },
    });

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error('[BARBER APPOINTMENT PATCH]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
