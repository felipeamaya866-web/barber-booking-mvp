// app/api/payments/verify/route.ts
// GET - Consulta el estado real de una transacción a la API de Wompi

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId    = searchParams.get('id');
    const env              = searchParams.get('env') || 'test';

    if (!transactionId) {
      return NextResponse.json({ error: 'ID de transacción requerido' }, { status: 400 });
    }

    // Consultar la API de Wompi para obtener el estado real
    const wompiBase = env === 'prod'
      ? 'https://production.wompi.co/v1'
      : 'https://sandbox.wompi.co/v1';

    const wompiRes = await fetch(`${wompiBase}/transactions/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
      },
    });

    if (!wompiRes.ok) {
      console.error('[VERIFY] Error consultando Wompi:', wompiRes.status);
      return NextResponse.json({ status: 'PENDING' });
    }

    const wompiData   = await wompiRes.json();
    const transaction = wompiData.data;
    const status      = transaction?.status as string; // APPROVED, DECLINED, PENDING, etc.
    const reference   = transaction?.reference as string;

    console.log(`💳 Verificación - Transacción ${transactionId}: ${status}`);

    // Si fue aprobado, actualizar la suscripción en la DB
    if (status === 'APPROVED' && reference) {
      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: reference },
      });

      if (subscription && subscription.status !== 'ACTIVE') {
        const ahora      = new Date();
        const proximoMes = new Date(ahora);
        proximoMes.setMonth(proximoMes.getMonth() + 1);

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status:                 'ACTIVE',
            startDate:              ahora,
            endDate:                proximoMes,
            stripeCurrentPeriodEnd: proximoMes,
            trialEndsAt:            null,
          },
        });

        console.log(`✅ Suscripción activada por verify endpoint: ${subscription.plan}`);
      }
    }

    return NextResponse.json({
      status,
      transactionId,
      reference,
    });

  } catch (error) {
    console.error('[VERIFY]', error);
    return NextResponse.json({ status: 'PENDING' });
  }
}