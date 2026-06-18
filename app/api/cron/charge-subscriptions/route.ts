// app/api/cron/charge-subscriptions/route.ts
// POST — Job nocturno que cobra automáticamente:
//   · TRIAL con trialEndsAt <= ahora → cobra plan → ACTIVE
//   · ACTIVE con nextChargeAt <= ahora → cobra plan → extiende 30 días
//   · Si un cobro falla → gracia de 3 días antes de EXPIRED
// Protegido con firma QStash

import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { prisma } from '@/lib/prisma';
import { WOMPI_BASE, PLAN_CONFIG, generarFirma, type PlanKey } from '@/lib/plans';

const GRACE_DAYS = 3; // Días de gracia antes de expirar

async function verificarQStash(req: NextRequest, body: string): Promise<boolean> {
  try {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey:    process.env.QSTASH_NEXT_SIGNING_KEY!,
    });
    const signature = req.headers.get('upstash-signature') ?? '';
    return await receiver.verify({ signature, body, url: req.url });
  } catch {
    return false;
  }
}

async function cobrarConFuente(
  subscriptionId: string,
  paymentSourceId: string,
  customerEmail:   string,
  plan:            PlanKey,
  referencePrefix: string,
): Promise<'APPROVED' | 'DECLINED' | 'ERROR'> {
  try {
    const planData   = PLAN_CONFIG[plan];
    const reference  = `${referencePrefix}_${subscriptionId}_${Date.now()}`;
    const firma      = generarFirma(reference, planData.precio, 'COP');
    const privateKey = process.env.WOMPI_PRIVATE_KEY!;

    const res = await fetch(`${WOMPI_BASE}/transactions`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${privateKey}` },
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
    console.log(`[CRON] ${reference} → ${status}`);
    return status === 'APPROVED' ? 'APPROVED' : 'DECLINED';
  } catch (err) {
    console.error('[CRON] Error de red en cobro:', err);
    return 'ERROR';
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // En desarrollo puedes saltar la verificación con ?dev=1
  const isDev = process.env.NODE_ENV === 'development' && req.nextUrl.searchParams.get('dev') === '1';
  if (!isDev) {
    const valido = await verificarQStash(req, rawBody);
    if (!valido) {
      console.warn('[CRON] Firma QStash inválida');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

  const ahora    = new Date();
  let cobrados   = 0;
  let fallidos   = 0;
  let expirados  = 0;

  // ─── Auto-completar citas pasadas ────────────────────────────────────────
  // Busca citas CONFIRMED/PENDING cuya fecha ya pasó (con margen de la duración)
  // y las marca como COMPLETED automáticamente
  const citasPasadas = await prisma.appointment.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PENDING'] },
      date:   { lt: new Date(ahora.getTime() - 30 * 60 * 1000) }, // al menos 30 min antes
    },
    include: { service: { select: { duration: true } } },
  });

  const citasACompletar = citasPasadas.filter(apt => {
    const fin = apt.date.getTime() + apt.service.duration * 60 * 1000;
    return fin < ahora.getTime();
  });

  if (citasACompletar.length > 0) {
    await prisma.appointment.updateMany({
      where: { id: { in: citasACompletar.map(a => a.id) } },
      data:  { status: 'COMPLETED' },
    });
    console.log(`[CRON] Auto-completadas ${citasACompletar.length} citas pasadas`);
  }

  // ─── Todas las subs con tarjeta que necesitan cobro ──────────────────────
  // Incluye tanto las que están en fecha como las que están en período de gracia
  const pendientes = await prisma.subscription.findMany({
    where: {
      paymentSourceId: { not: null },
      status: { in: ['TRIAL', 'ACTIVE'] },
      OR: [
        { status: 'TRIAL',  trialEndsAt:  { lte: ahora } },
        { status: 'ACTIVE', nextChargeAt: { lte: ahora } },
        { chargeFailedAt:   { not: null } }, // reintento en período de gracia
      ],
    },
    include: { barbershop: { include: { owner: true } } },
  });

  for (const sub of pendientes) {
    const email = sub.barbershop.owner.email;
    if (!email) continue;

    // ── Verificar si está en período de gracia y ya venció ─────────────────
    if (sub.chargeFailedAt) {
      const diasFallando = Math.floor((ahora.getTime() - sub.chargeFailedAt.getTime()) / 86_400_000);
      if (diasFallando >= GRACE_DAYS) {
        // Venció el período de gracia → expirar
        await prisma.subscription.update({
          where: { id: sub.id },
          data:  { status: 'EXPIRED', chargeFailedAt: null },
        });
        expirados++;
        console.log(`[CRON] Expirado por gracia agotada: ${sub.id}`);
        continue;
      }
    }

    // ── Intentar cobro ─────────────────────────────────────────────────────
    const prefix    = sub.status === 'TRIAL' ? 'trial_charge' : 'renewal';
    const resultado = await cobrarConFuente(sub.id, sub.paymentSourceId!, email, sub.plan as PlanKey, prefix);

    if (resultado === 'APPROVED') {
      // Éxito: calcular próxima fecha desde nextChargeAt (no desde ahora, evita drift)
      const base         = sub.nextChargeAt ?? ahora;
      const nextChargeAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status:         'ACTIVE',
          startDate:      sub.status === 'TRIAL' ? ahora : sub.startDate,
          endDate:        nextChargeAt,
          nextChargeAt,
          trialEndsAt:    null,
          chargeFailedAt: null, // limpiar fallo anterior
        },
      });
      cobrados++;

    } else if (resultado === 'DECLINED') {
      // Primer fallo → iniciar período de gracia; fallo posterior → mantener fecha
      if (!sub.chargeFailedAt) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data:  { chargeFailedAt: ahora },
        });
        console.log(`[CRON] Inicio gracia: ${sub.id} (3 días para cobrar o expira)`);
      }
      fallidos++;

    }
    // ERROR de red → no tocar nada, el cron reintenta mañana
  }

  console.log(`[CRON] cobrados=${cobrados} fallidos=${fallidos} expirados=${expirados}`);
  return NextResponse.json({ ok: true, cobrados, fallidos, expirados, procesados: pendientes.length });
}
