// app/api/payments/cancel-subscription/route.ts
// POST — Cancela la renovación automática de la suscripción.
//   · El usuario conserva acceso hasta que venza endDate o trialEndsAt.
//   · Se limpia paymentSourceId y nextChargeAt para que el cron no vuelva a cobrar.
//   · checkAndExpire expirará automáticamente cuando pase la fecha de fin.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const barbershop = await prisma.barbershop.findUnique({
      where:   { ownerId: session.user.id },
      include: { subscription: true },
    });

    if (!barbershop?.subscription) {
      return NextResponse.json({ error: 'No tienes una suscripción activa' }, { status: 404 });
    }

    const sub = barbershop.subscription;

    if (sub.status === 'EXPIRED' || sub.status === 'CANCELLED') {
      return NextResponse.json({ error: 'La suscripción ya está cancelada o vencida' }, { status: 400 });
    }

    if (!sub.paymentSourceId) {
      return NextResponse.json({ error: 'No hay método de pago registrado para cancelar' }, { status: 400 });
    }

    // Limpiar cobro automático — el acceso se mantiene hasta endDate / trialEndsAt
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        paymentSourceId:  null,
        paymentMethodType: null,
        nextChargeAt:     null,
        chargeFailedAt:   null,
      },
    });

    const accessUntil = sub.status === 'TRIAL' ? sub.trialEndsAt : sub.endDate;

    return NextResponse.json({
      success: true,
      message: 'Suscripción cancelada correctamente.',
      accessUntil,
      status: sub.status,
    });

  } catch (error) {
    console.error('[CANCEL-SUBSCRIPTION]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
