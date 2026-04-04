// app/api/payments/webhook/route.ts
// POST - Recibe eventos de Wompi y actualiza la suscripción

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ─────────────────────────────────────────────
// HELPER: Verificar firma del evento Wompi
// SHA256(propiedades + timestamp + events_secret)
// ─────────────────────────────────────────────
function verificarFirmaWebhook(
  payload: Record<string, unknown>,
  timestamp: string,
  firmaRecibida: string
): boolean {
  try {
    const eventsSecret = process.env.WOMPI_EVENTS_KEY!;
    const data         = payload.data as Record<string, unknown>;
    const transaction  = data?.transaction as Record<string, unknown>;

    // Wompi concatena: id + status + amount + timestamp + secret
    const cadena = `${transaction?.id}${transaction?.status}${transaction?.amount_in_cents}${timestamp}${eventsSecret}`;
    const firmaCalculada = crypto.createHash('sha256').update(cadena).digest('hex');

    return firmaCalculada === firmaRecibida;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// POST /api/payments/webhook
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const payload       = await req.json();
    const timestamp     = req.headers.get('x-event-checksum-timestamp') || '';
    const firmaRecibida = req.headers.get('x-event-checksum') || '';

    console.log('📨 Webhook Wompi recibido:', payload?.event);

    // Verificar firma (seguridad)
    const firmaValida = verificarFirmaWebhook(payload, timestamp, firmaRecibida);
    if (!firmaValida) {
      console.warn('⚠️ Firma de webhook inválida');
      // En desarrollo podemos continuar, en producción debe rechazarse
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
      }
    }

    const evento      = payload?.event;
    const data        = payload?.data as Record<string, unknown>;
    const transaction = data?.transaction as Record<string, unknown>;

    // Solo procesar transacciones aprobadas
    if (evento !== 'transaction.updated') {
      return NextResponse.json({ received: true });
    }

    const status    = transaction?.status as string;
    const reference = transaction?.reference as string;

    console.log(`💳 Transacción ${reference}: ${status}`);

    // Buscar suscripción por referencia
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: reference },
      include: { barbershop: true },
    });

    if (!subscription) {
      console.warn('⚠️ Suscripción no encontrada para referencia:', reference);
      return NextResponse.json({ received: true });
    }

    // ── Pago APROBADO ──────────────────────────
    if (status === 'APPROVED') {
      const ahora      = new Date();
      const proximoMes = new Date(ahora);
      proximoMes.setMonth(proximoMes.getMonth() + 1);

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status:                  'ACTIVE',
          startDate:               ahora,
          endDate:                 proximoMes,
          stripeCurrentPeriodEnd:  proximoMes,
          trialEndsAt:             null, // sale del trial
        },
      });

      console.log(`✅ Suscripción activada: ${subscription.plan} para ${subscription.barbershop.name}`);
    }

    // ── Pago RECHAZADO / DECLINADO ─────────────
    if (status === 'DECLINED' || status === 'ERROR') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data:  { status: 'EXPIRED' },
      });

      console.log(`❌ Pago rechazado para ${subscription.barbershop.name}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[WEBHOOK]', error);
    // Siempre retornar 200 para que Wompi no reintente
    return NextResponse.json({ received: true });
  }
}