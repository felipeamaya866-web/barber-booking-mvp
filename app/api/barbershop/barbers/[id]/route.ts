// app/api/barbershop/barbers/[id]/route.ts
// PUT    - Actualizar barbero (incluye showEarnings)
// DELETE - Eliminar barbero (borra citas asociadas primero)

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
// PUT /api/barbershop/barbers/[id]
// ─────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await Promise.resolve(params);
    const barber  = await getBarberWithAuth(id, session.user.id);
    if (!barber) return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });

    const body = await req.json();
    const { name, phone, email, bio, isActive, showEarnings } = body;

    const updated = await prisma.barber.update({
      where: { id },
      data: {
        ...(name         !== undefined && { name }),
        ...(phone        !== undefined && { phone }),
        ...(email        !== undefined && { email }),
        ...(bio          !== undefined && { bio }),
        ...(isActive     !== undefined && { isActive }),
        ...(showEarnings !== undefined && { showEarnings }), // ✅
      },
      include: {
        user: { select: { name: true, email: true, image: true } },
      },
    });

    return NextResponse.json({ barber: updated });
  } catch (error) {
    console.error('[BARBER PUT]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// DELETE /api/barbershop/barbers/[id]
// ─────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await Promise.resolve(params);
    const barber  = await getBarberWithAuth(id, session.user.id);
    if (!barber) return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });

    // ✅ Borrar en orden para evitar violaciones de FK
    await prisma.$transaction([
      // 1. Cancelar citas del barbero
      prisma.appointment.deleteMany({ where: { barberId: id } }),
      // 2. Borrar horarios
      prisma.barberSchedule.deleteMany({ where: { barberId: id } }),
      // 3. Borrar descansos
      prisma.barberBreak.deleteMany({ where: { barberId: id } }),
      // 4. Borrar invitaciones
      prisma.barberInvitation.deleteMany({ where: { barberId: id } }),
      // 5. Borrar el barbero
      prisma.barber.delete({ where: { id } }),
    ]);

    // Si tenía usuario vinculado, cambiar su rol a CLIENT
    if (barber.userId) {
      await prisma.user.update({
        where: { id: barber.userId },
        data:  { role: 'CLIENT' },
      });
    }

    return NextResponse.json({ message: 'Barbero eliminado correctamente' });
  } catch (error) {
    console.error('[BARBER DELETE]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}