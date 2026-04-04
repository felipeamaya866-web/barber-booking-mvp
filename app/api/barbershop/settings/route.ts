// app/api/barbershop/settings/route.ts
// GET  - Obtener configuración actual de la barbería
// PUT  - Actualizar configuración de la barbería

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
        bio:         true,   // ✅ "Sobre Nosotros"
        address:     true,
        phone:       true,
        colors:      true,
        photos:      true,
        logo:        true,
        subscription: {
          select: { plan: true, status: true },
        },
      },
    });

    if (!barbershop) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });
    }

    const { colors, logo, subscription, ...rest } = barbershop;

    return NextResponse.json({
      barbershop: {
        ...rest,
        ...colorsToObject(colors),
        logoUrl:            logo ?? '',
        plan:               subscription?.plan   ?? 'LITE',
        subscriptionStatus: subscription?.status ?? 'TRIAL',
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
      bio,            // ✅ "Sobre Nosotros" editable
      address,
      phone,
      primaryColor,
      secondaryColor,
      photos,
      logoUrl,
    } = body;

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
    if (bio !== undefined)         dataToUpdate.bio         = bio;  // ✅
    if (address !== undefined)     dataToUpdate.address     = address;
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