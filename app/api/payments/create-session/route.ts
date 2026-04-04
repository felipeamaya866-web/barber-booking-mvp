// app/api/payments/create-session/route.ts
// POST - Genera el link de pago de Wompi para un plan

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ─────────────────────────────────────────────
// CONFIGURACIÓN DE PLANES
// ─────────────────────────────────────────────
const PLANES = {
  LITE: {
    nombre:     'Barber Booking Lite',
    precio:     2990000, // centavos COP → 29.900 * 100
    maxBarbers: 1,
    maxPhotos:  10,
  },
  PRIME: {
    nombre:     'Barber Booking Prime',
    precio:     4990000, // 49.900 * 100
    maxBarbers: 3,
    maxPhotos:  20,
  },
  ELITE: {
    nombre:     'Barber Booking Elite',
    precio:     7990000, // 79.900 * 100
    maxBarbers: 999,
    maxPhotos:  40,
  },
} as const;

type PlanKey = keyof typeof PLANES;

// ─────────────────────────────────────────────
// HELPER: Firma de integridad Wompi
// SHA256(reference + amount_in_cents + currency + integrity_secret)
// ─────────────────────────────────────────────
function generarFirma(reference: string, monto: number, moneda: string): string {
  const secret = process.env.WOMPI_INTEGRITY_KEY!;
  const cadena = `${reference}${monto}${moneda}${secret}`;
  return crypto.createHash('sha256').update(cadena).digest('hex');
}

// ─────────────────────────────────────────────
// POST /api/payments/create-session
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    if (!plan || !['LITE', 'PRIME', 'ELITE'].includes(plan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const barbershop = await prisma.barbershop.findUnique({
      where:   { ownerId: session.user.id },
      include: { subscription: true },
    });

    if (!barbershop) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });
    }

    const planSeleccionado = PLANES[plan as PlanKey];
    const reference        = `sub_${barbershop.id}_${plan}_${Date.now()}`;
    const moneda           = 'COP';
    const appUrl           = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Generar firma de integridad
    const firma = generarFirma(reference, planSeleccionado.precio, moneda);

    // Guardar referencia pendiente en la suscripción
    await prisma.subscription.upsert({
      where:  { barbershopId: barbershop.id },
      create: {
        barbershopId:         barbershop.id,
        plan:                 plan as PlanKey,
        status:               'TRIAL',
        maxBarbers:           planSeleccionado.maxBarbers,
        maxPhotos:            planSeleccionado.maxPhotos,
        stripeSubscriptionId: reference,
      },
      update: {
        plan:                 plan as PlanKey,
        maxBarbers:           planSeleccionado.maxBarbers,
        maxPhotos:            planSeleccionado.maxPhotos,
        stripeSubscriptionId: reference,
      },
    });

    // ─────────────────────────────────────────────
    // ⚠️ IMPORTANTE: El ':' en signature:integrity
    // debe codificarse como %3A en el NOMBRE del parámetro
    // porque CloudFront bloquea los ':' sin codificar en query strings.
    // Wompi acepta signature%3Aintegrity correctamente.
    // ─────────────────────────────────────────────
    const redirectUrl = encodeURIComponent(`${appUrl}/barbershop/plans/resultado`);
    const publicKey   = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!;

    const checkoutUrl =
      `https://checkout.wompi.co/p/?` +
      `public-key=${publicKey}` +
      `&currency=${moneda}` +
      `&amount-in-cents=${planSeleccionado.precio}` +
      `&reference=${reference}` +
      `&signature%3Aintegrity=${firma}` +   // ✅ ':' codificado como %3A
      `&redirect-url=${redirectUrl}`;

    console.log('🔗 Checkout URL generada para plan:', plan);
    console.log('📋 Reference:', reference);

    return NextResponse.json({
      checkoutUrl,
      reference,
      plan,
      monto: planSeleccionado.precio,
    });

  } catch (error) {
    console.error('[CREATE-SESSION]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}