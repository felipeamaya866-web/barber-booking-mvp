// app/api/payments/register-payment-method/route.ts
// POST — Registra método de pago de un dueño de barbería:
//   Primera vez  → crea fuente de pago + inicia TRIAL 14 días sin cobro
//   Reactivación → crea fuente de pago + cobra el plan inmediatamente → ACTIVE

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WOMPI_BASE, PLAN_CONFIG, generarFirma, type PlanKey } from '@/lib/plans';

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

    const customerEmail  = session.user.email!;
    const privateKey     = process.env.WOMPI_PRIVATE_KEY!;
    const planData       = PLAN_CONFIG[plan as PlanKey];

    // ¿Ya usó el período de prueba antes?
    const trialYaUsado = !!barbershop.subscription?.trialEndsAt;

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
    console.log(`[REGISTER] Fuente de pago creada: ${paymentSourceId} | trialYaUsado: ${trialYaUsado}`);

    // ─── REACTIVACIÓN: ya usó el trial → cobrar el plan ahora ────────────────
    if (trialYaUsado) {
      const reference = `reactivacion_${barbershop.id}_${Date.now()}`;
      const firma     = generarFirma(reference, planData.precio, 'COP');

      const chargeRes  = await fetch(`${WOMPI_BASE}/transactions`, {
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

      const chargeData    = await chargeRes.json();
      const status        = chargeData.data?.status as string;
      const declineReason = chargeData.data?.payment_method_info?.decline_reason ?? '';

      console.log(`[REGISTER] Cobro reactivación ${reference} HTTP ${chargeRes.status}:`, JSON.stringify(chargeData));

      if (status === 'PENDING') {
        return NextResponse.json(
          { error: 'Tu banco requiere verificación adicional (3D Secure / OTP). Habilita compras por internet en tu app bancaria e intenta de nuevo.' },
          { status: 422 },
        );
      }

      if (status !== 'APPROVED') {
        const msg = declineReason
          ? `Tarjeta rechazada (${declineReason}). Verifica que tenga fondos y esté habilitada para pagos en línea.`
          : 'Tu tarjeta fue rechazada. Verifica que tenga fondos y esté habilitada para pagos en línea.';
        return NextResponse.json({ error: msg }, { status: 422 });
      }

      // Cobro aprobado → ACTIVE por 30 días
      const endDate      = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const nextChargeAt = endDate;

      await prisma.subscription.update({
        where: { barbershopId: barbershop.id },
        data: {
          plan:              plan as PlanKey,
          status:            'ACTIVE',
          paymentSourceId,
          paymentMethodType: 'CARD',
          maxBarbers:        planData.maxBarbers,
          maxPhotos:         planData.maxPhotos,
          endDate,
          nextChargeAt,
          chargeFailedAt:    null,
        },
      });

      return NextResponse.json({
        success:      true,
        reactivacion: true,
        message:      `¡Tarjeta registrada y plan activado! Tu suscripción ${planData.nombre} está activa por 30 días.`,
        endDate,
      });
    }

    // ─── PRIMERA VEZ: iniciar TRIAL 14 días sin cobro ────────────────────────
    const trialEndsAt  = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const nextChargeAt = trialEndsAt;

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
        status:            'TRIAL',
        paymentSourceId,
        paymentMethodType: 'CARD',
        maxBarbers:        planData.maxBarbers,
        maxPhotos:         planData.maxPhotos,
        trialEndsAt,
        nextChargeAt,
        chargeFailedAt:    null,
        endDate:           null,
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
