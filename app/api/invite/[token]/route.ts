// app/api/invite/[token]/route.ts
// GET  - Info pública de la invitación (nombre barbero, barbería, estado)
// POST - Aceptar invitación (vincula usuario al barbero)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { token: string } | Promise<{ token: string }>;

// ─────────────────────────────────────────────
// GET — Info pública del link (no requiere auth)
// ─────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const { token } = await Promise.resolve(params);

    const invitation = await prisma.barberInvitation.findUnique({
      where:   { token },
      include: {
        barber: {
          include: {
            barbershop: { select: { name: true, logo: true } },
          },
        },
      },
    });

    if (!invitation) return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });

    const alreadyUsed = !!invitation.usedAt;
    const expired     = new Date() > invitation.expiresAt && !alreadyUsed;

    return NextResponse.json({
      barberName:     invitation.barber.name,
      barbershopName: invitation.barber.barbershop.name,
      barbershopLogo: invitation.barber.barbershop.logo,
      expiresAt:      invitation.expiresAt,
      email:          invitation.email,
      alreadyUsed,
      expired,
    });
  } catch (error) {
    console.error('[INVITE GET]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}