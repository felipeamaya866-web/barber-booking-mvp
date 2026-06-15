// app/api/payments/register-payment-method/route.ts
// POST — Registra método de pago de un dueño de barbería:
//   1. Crea fuente de pago en Wompi con el token de tarjeta
//   2. Cobra $100 COP de verificación
//   3. Si aprueba → guarda paymentSourceId + inicia TRIAL 14 días

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WOMPI_BASE, PLAN_CONFIG, generarFirma, type PlanKey } from '@/lib/plans';

const VERIFICACION_MONTO = 10000; // $100 COP en centavos

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
        type:               'CARD',
        token:              cardToken,
        customer_email:     customerEmail,
        acceptance_token:   acceptanceToken,
        accept_personal_auth: acceptPersonalAuth,
      }),
    });

    const sourceData = await sourceRes.json();

    if (!sourceRes.ok || sourceData.data?.status !== 'AVAILABLE') {
      console.error('[REGISTER] Error creando fuente de pago:', sourceData);
      return NextResponse.json(
        { error: 'No pudimos registrar tu tarjeta. Verifica los datos e intenta de nuevo.' },
        { status: 422 },
      );
    }

    const paymentSourceId = String(sourceData.data.id);

    // ─── PASO 2: Cobrar $100 COP de verificación ─────────────────────────────
    const reference = `verify_${barbershop.id}_${Date.now()}`;
    const firma     = generarFirma(reference, VERIFICACION_MONTO, 'COP');

    const chargeRes = await fetch(`${WOMPI_BASE}/transactions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${privateKey}`,
      },
      body: JSON.stringify({
        amount_in_cents:   VERIFICACION_MONTO,
        currency:          'COP',
        signature:         firma,
        customer_email:    customerEmail,
        reference,
        payment_source_id: parseInt(paymentSourceId),
        payment_method:    { installments: 1 },
        recurrent:         true,
      }),
    });

    const chargeData = await chargeRes.json();
    const status     = chargeData.data?.status as string;

    console.log(`[REGISTER] Cobro verificación ${reference}: ${status}`);

    if (status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Tu tarjeta fue rechazada. Verifica que tenga fondos y esté habilitada para pagos en línea.' },
        { status: 422 },
      );
    }

    // ─── PASO 3: Guardar y crear TRIAL ───────────────────────────────────────
    const trialEndsAt  = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const nextChargeAt = trialEndsAt; // El cron cobra exactamente al día 14

    await prisma.subscription.upsert({
      where:  { barbershopId: barbershop.id },
      create: {
        barbershopId:     barbershop.id,
        plan:             plan as PlanKey,
        status:           'TRIAL',
        trialEndsAt,
        nextChargeAt,
        paymentSourceId,
        paymentMethodType: 'CARD',
        maxBarbers:       planData.maxBarbers,
        maxPhotos:        planData.maxPhotos,
      },
      update: {
        // Al registrar tarjeta nunca reseteamos el trial si ya existe
        plan:             plan as PlanKey,
        paymentSourceId,
        paymentMethodType: 'CARD',
        maxBarbers:       planData.maxBarbers,
        maxPhotos:        planData.maxPhotos,
        // Solo actualiza nextChargeAt si no existe (primera vez)
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
