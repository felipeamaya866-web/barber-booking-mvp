// app/api/invite/[token]/accept/route.ts
// POST — Vincular el usuario logueado al perfil del barbero

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } | Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Debes iniciar sesión primero' }, { status: 401 });

    const { token } = await Promise.resolve(params);

    const invitation = await prisma.barberInvitation.findUnique({
      where:   { token },
      include: { barber: true },
    });

    if (!invitation)         return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    if (invitation.usedAt)   return NextResponse.json({ error: 'Esta invitación ya fue usada' }, { status: 400 });
    if (new Date() > invitation.expiresAt) return NextResponse.json({ error: 'La invitación ha expirado' }, { status: 400 });

    // Verificar que el usuario no esté ya vinculado a otro barbero
    const existingBarber = await prisma.barber.findUnique({ where: { userId: session.user.id } });
    if (existingBarber && existingBarber.id !== invitation.barberId) {
      return NextResponse.json({ error: 'Ya estás vinculado a otro perfil de barbero' }, { status: 400 });
    }

    // Vincular usuario al barbero y cambiar su rol a BARBER
    await prisma.$transaction([
      prisma.barber.update({
        where: { id: invitation.barberId },
        data:  { userId: session.user.id, inviteStatus: 'PENDING_APPROVAL' },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data:  { role: 'BARBER' },
      }),
      prisma.barberInvitation.update({
        where: { token },
        data:  { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: 'Solicitud enviada. Espera la aprobación del dueño.' });
  } catch (error) {
    console.error('[INVITE ACCEPT]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}