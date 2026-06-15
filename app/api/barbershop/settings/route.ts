// app/api/barbershop/settings/route.ts
// GET  - Obtener configuración actual de la barbería
// PUT  - Actualizar configuración de la barbería

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndExpire, isActive } from '@/lib/subscription';

// ─────────────────────────────────────────────────────────────────
// HELPERS: mapear entre colors[] del schema ↔ primaryColor/secondaryColor de la UI
// Convención: colors[0] = primary, colors[1] = secondary
// ─────────────────────────────────────────────────────────────────
function colorsToObject(colors: string[]) {
  return {
    primaryColor:   colors[0] ?? '#111827',
    secondaryColor: colors[1] ?? '#F59E0B',
  };
}

function objectToColors(primary: string, secondary: string): string[] {
  return [primary, secondary];
}

// ─────────────────────────────────────────────────────────────────
// GET /api/barbershop/settings
// ─────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const barbershop = await prisma.barbershop.findUnique({
      where: { ownerId: session.user.id },
      select: {
        id:          true,
        name:        true,
        slug:        true,
        description: true,
        bio:         true,
        address:     true,
        phone:       true,
        colors:      true,
        photos:      true,
        logo:        true,
        lat:         true,
        lng:         true,
        subscription: {
          select: { plan: true, status: true, trialEndsAt: true, endDate: true, nextChargeAt: true, chargeFailedAt: true, paymentSourceId: true },
        },
      },
    });

    if (!barbershop) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });
    }

    const { colors, logo, subscription, ...rest } = barbershop;

    // Auto-expirar trial o suscripción si ya venció
    const subFresh = await checkAndExpire(barbershop.id);

    return NextResponse.json({
      barbershop: {
        ...rest,
        ...colorsToObject(colors),
        logoUrl:             logo ?? '',
        plan:                subFresh?.plan           ?? subscription?.plan   ?? 'LITE',
        subscriptionStatus:  subFresh?.status         ?? subscription?.status ?? 'TRIAL',
        trialEndsAt:         subFresh?.trialEndsAt    ?? null,
        subscriptionEndDate: subFresh?.endDate        ?? null,
        nextChargeAt:        subFresh?.nextChargeAt   ?? null,
        chargeFailedAt:      subFresh?.chargeFailedAt ?? null,
        paymentSourceId:     subFresh?.paymentSourceId ?? null,
      },
    });
  } catch (error) {
    console.error('[SETTINGS GET]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────
// PUT /api/barbershop/settings
// ─────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      bio,
      address,
      phone,
      primaryColor,
      secondaryColor,
      photos,
      logoUrl,
      lat,
      lng,
    } = body;

    // Verificar suscripción activa antes de permitir edición
    const barbershopForCheck = await prisma.barbershop.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
    if (barbershopForCheck) {
      const sub = await checkAndExpire(barbershopForCheck.id);
      if (!sub || !isActive(sub.status)) {
        return NextResponse.json(
          { error: 'Tu suscripción ha vencido. Renueva tu plan para continuar.', subscriptionExpired: true },
          { status: 403 }
        );
      }
    }

    // Validación básica
    if (name !== undefined && name.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    // Construir solo los campos que llegan (actualización parcial)
    const dataToUpdate: Record<string, unknown> = {};

    if (name !== undefined)        dataToUpdate.name        = name.trim();
    if (description !== undefined) dataToUpdate.description = description;
    if (bio !== undefined)         dataToUpdate.bio         = bio;
    if (address !== undefined) dataToUpdate.address = address;
    if (typeof lat === 'number' && !isNaN(lat)) dataToUpdate.lat = lat;
    if (typeof lng === 'number' && !isNaN(lng)) dataToUpdate.lng = lng;
    if (phone !== undefined)       dataToUpdate.phone       = phone;
    if (photos !== undefined)      dataToUpdate.photos      = photos;
    if (logoUrl !== undefined)     dataToUpdate.logo        = logoUrl;

    // Si vienen colores, reconstruir colors[] sin perder el que no viene
    if (primaryColor !== undefined || secondaryColor !== undefined) {
      const current = await prisma.barbershop.findUnique({
        where:  { ownerId: session.user.id },
        select: { colors: true },
      });
      const currentColors = current?.colors ?? ['#111827', '#F59E0B'];
      dataToUpdate.colors = objectToColors(
        primaryColor   ?? currentColors[0],
        secondaryColor ?? currentColors[1],
      );
    }

    const updated = await prisma.barbershop.update({
      where: { ownerId: session.user.id },
      data:  dataToUpdate,
      select: {
        id:          true,
        name:        true,
        slug:        true,
        description: true,
        bio:         true,
        address:     true,
        phone:       true,
        colors:      true,
        photos:      true,
        logo:        true,
      },
    });

    const { colors, logo, ...rest } = updated;

    return NextResponse.json({
      barbershop: { ...rest, ...colorsToObject(colors), logoUrl: logo ?? '' },
      message:    'Configuración actualizada',
    });
  } catch (error) {
    console.error('[SETTINGS PUT]', error);
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}