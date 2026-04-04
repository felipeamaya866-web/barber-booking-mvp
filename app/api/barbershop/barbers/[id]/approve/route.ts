// app/api/barbershop/barbers/[id]/approve/route.ts
// POST - Aprobar o rechazar un barbero que se registró con el link

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await prisma.barbershop.findUnique({ where: { ownerId: session.user.id } });
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const { id } = await params;
    const barber = await prisma.barber.findFirst({ where: { id, barbershopId: barbershop.id } });
    if (!barber) return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });

    const { action } = await req.json(); // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    const inviteStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // Si rechazamos, desvincular el usuario
    const updateData: Record<string, unknown> = { inviteStatus };
    if (action === 'reject') {
      updateData.userId = null;
      // Cambiar rol del usuario de BARBER a CLIENT
      if (barber.userId) {
        await prisma.user.update({
          where: { id: barber.userId },
          data:  { role: 'CLIENT' },
        });
      }
    }

    const updated = await prisma.barber.update({
      where: { id },
      data:  updateData,
      include: { user: { select: { name: true, email: true, image: true } } },
    });

    return NextResponse.json({ barber: updated });
  } catch (error) {
    console.error('[APPROVE POST]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}