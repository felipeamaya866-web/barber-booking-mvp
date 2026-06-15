// app/api/payments/register-payment-method/route.ts
// POST — Registra método de pago de un dueño de barbería:
//   1. Crea fuente de pago en Wompi con el token de tarjeta
//   2. Guarda paymentSourceId + inicia TRIAL 14 días (sin cobro hoy)
//   El cron cobra el plan al día 14 automáticamente.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WOMPI_BASE, PLAN_CONFIG, type PlanKey } from '@/lib/plans';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { cardToken, acceptanceToken, acceptPersonalAuth, plan } = body;

    if (!cardToken || !acceptanceToken || !acceptPersonalAuth) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    if (!plan || !Object.keys(PLAN_CONFIG).includes(plan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const barbershop = await prisma.barbershop.findUnique({
      where:   { ownerId: session.user.id },
      include: { subscription: true },
    });

    if (!barbershop) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });
    }

    const customerEmail = session.user.email!;
    const privateKey    = process.env.WOMPI_PRIVATE_KEY!;
    const planData      = PLAN_CONFIG[plan as PlanKey];

    // ─── PASO 1: Crear fuente de pago en Wompi ───────────────────────────────
    const sourceRes = await fetch(`${WOMPI_BASE}/payment_sources`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${privateKey}`,
      },
      body: JSON.stringify({
        type:                 'CARD',
        token:                cardToken,
        customer_email:       customerEmail,
        acceptance_token:     acceptanceToken,
        accept_personal_auth: acceptPersonalAuth,
      }),
    });

    const sourceData = await sourceRes.json();

    if (!sourceRes.ok || sourceData.data?.status !== 'AVAILABLE') {
      console.error('[REGISTER] Error creando fuente de pago:', JSON.stringify(sourceData));
      return NextResponse.json(
        { error: 'No pudimos registrar tu tarjeta. Verifica los datos e intenta de nuevo.' },
        { status: 422 },
      );
    }

    const paymentSourceId = String(sourceData.data.id);
    console.log(`[REGISTER] Fuente de pago creada: ${paymentSourceId} para barbershop ${barbershop.id}`);

    // ─── PASO 2: Guardar y crear TRIAL (sin cobro hoy) ───────────────────────
    const trialEndsAt  = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const nextChargeAt = trialEndsAt; // El cron cobra el plan al día 14

    await prisma.subscription.upsert({
      where:  { barbershopId: barbershop.id },
      create: {
        barbershopId:      barbershop.id,
        plan:              plan as PlanKey,
        status:            'TRIAL',
        trialEndsAt,
        nextChargeAt,
        paymentSourceId,
        paymentMethodType: 'CARD',
        maxBarbers:        planData.maxBarbers,
        maxPhotos:         planData.maxPhotos,
      },
      update: {
        plan:              plan as PlanKey,
        paymentSourceId,
        paymentMethodType: 'CARD',
        maxBarbers:        planData.maxBarbers,
        maxPhotos:         planData.maxPhotos,
        // Solo actualiza fechas si es la primera vez que registra tarjeta
        ...(barbershop.subscription?.nextChargeAt ? {} : { nextChargeAt, trialEndsAt }),
      },
    });

    return NextResponse.json({
      success: true,
      message: '¡Tarjeta registrada! Tu período de prueba de 14 días ya comenzó.',
      trialEndsAt,
    });

  } catch (error) {
    console.error('[REGISTER-PAYMENT-METHOD]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
