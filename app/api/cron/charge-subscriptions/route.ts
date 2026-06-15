// app/api/cron/charge-subscriptions/route.ts
// POST — Job nocturno que cobra automáticamente:
//   · Suscripciones TRIAL cuyo trialEndsAt <= ahora → cobra plan → ACTIVE
//   · Suscripciones ACTIVE cuyo nextChargeAt <= ahora → cobra plan → extiende 30 días
// Protegido con firma QStash (QSTASH_CURRENT_SIGNING_KEY)

import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { prisma } from '@/lib/prisma';
import { WOMPI_BASE, PLAN_CONFIG, generarFirma, type PlanKey } from '@/lib/plans';

// ── Verifica que la petición viene de QStash ─────────────────────────────────
async function verificarQStash(req: NextRequest): Promise<boolean> {
  try {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey:    process.env.QSTASH_NEXT_SIGNING_KEY!,
    });

    const body      = await req.text();
    const signature = req.headers.get('upstash-signature') ?? '';

    return await receiver.verify({ signature, body, url: req.url });
  } catch {
    return false;
  }
}

// ── Cobrar usando fuente de pago guardada ─────────────────────────────────────
async function cobrarSuscripcion(
  subscriptionId: string,
  paymentSourceId: string,
  customerEmail:   string,
  plan:            PlanKey,
  referencePrefix: string,
): Promise<'APPROVED' | 'DECLINED' | 'ERROR'> {
  try {
    const planData  = PLAN_CONFIG[plan];
    const reference = `${referencePrefix}_${subscriptionId}_${Date.now()}`;
    const firma     = generarFirma(reference, planData.precio, 'COP');
    const privateKey = process.env.WOMPI_PRIVATE_KEY!;

    const res = await fetch(`${WOMPI_BASE}/transactions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${privateKey}`,
      },
      body: JSON.stringify({
        amount_in_cents:   planData.precio,
        currency:          'COP',
        signature:         firma,
        customer_email:    customerEmail,
        reference,
        payment_source_id: parseInt(paymentSourceId),
        payment_method:    { installments: 1 },
        recurrent:         true,
      }),
    });

    const data   = await res.json();
    const status = data.data?.status as string;

    console.log(`[CRON] Cobro ${reference} → ${status}`);
    return status === 'APPROVED' ? 'APPROVED' : 'DECLINED';
  } catch (err) {
    console.error('[CRON] Error en cobro:', err);
    return 'ERROR';
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // En desarrollo puedes saltar la verificación con ?dev=1
  const isDev = process.env.NODE_ENV === 'development' && req.nextUrl.searchParams.get('dev') === '1';

  if (!isDev) {
    const valido = await verificarQStash(req);
    if (!valido) {
      console.warn('[CRON] Firma QStash inválida');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

  const ahora    = new Date();
  let cobrados   = 0;
  let fallidos   = 0;
  let omitidos   = 0;

  // ─── 1. TRIAL vencidos que tienen tarjeta guardada ───────────────────────
  const trialesVencidos = await prisma.subscription.findMany({
    where: {
      status:          'TRIAL',
      trialEndsAt:     { lte: ahora },
      paymentSourceId: { not: null },
    },
    include: { barbershop: { include: { owner: true } } },
  });

  for (const sub of trialesVencidos) {
    const email = sub.barbershop.owner.email;
    if (!email) { omitidos++; continue; }

    const resultado = await cobrarSuscripcion(
      sub.id, sub.paymentSourceId!, email, sub.plan as PlanKey, 'trial_charge',
    );

    if (resultado === 'APPROVED') {
      const nextChargeAt = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
      await prisma.subscription.update({
        where: { id: sub.id },
        data:  {
          status:      'ACTIVE',
          startDate:   ahora,
          endDate:     nextChargeAt,
          nextChargeAt,
          trialEndsAt: null,
        },
      });
      cobrados++;
    } else if (resultado === 'DECLINED') {
      // Tarjeta rechazada → expirar
      await prisma.subscription.update({
        where: { id: sub.id },
        data:  { status: 'EXPIRED' },
      });
      fallidos++;
    }
    // ERROR → dejar como está, el cron lo reintentará mañana
  }

  // ─── 2. ACTIVE con nextChargeAt vencido ──────────────────────────────────
  const renovaciones = await prisma.subscription.findMany({
    where: {
      status:          'ACTIVE',
      nextChargeAt:    { lte: ahora },
      paymentSourceId: { not: null },
    },
    include: { barbershop: { include: { owner: true } } },
  });

  for (const sub of renovaciones) {
    const email = sub.barbershop.owner.email;
    if (!email) { omitidos++; continue; }

    const resultado = await cobrarSuscripcion(
      sub.id, sub.paymentSourceId!, email, sub.plan as PlanKey, 'renewal',
    );

    if (resultado === 'APPROVED') {
      // Extender desde nextChargeAt (no desde ahora) para no penalizar retrasos
      const base         = sub.nextChargeAt ?? ahora;
      const nextChargeAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
      await prisma.subscription.update({
        where: { id: sub.id },
        data:  { endDate: nextChargeAt, nextChargeAt },
      });
      cobrados++;
    } else if (resultado === 'DECLINED') {
      await prisma.subscription.update({
        where: { id: sub.id },
        data:  { status: 'EXPIRED' },
      });
      fallidos++;
    }
  }

  console.log(`[CRON] Resumen: cobrados=${cobrados} fallidos=${fallidos} omitidos=${omitidos}`);

  return NextResponse.json({
    ok: true,
    cobrados,
    fallidos,
    omitidos,
    procesados: trialesVencidos.length + renovaciones.length,
  });
}
