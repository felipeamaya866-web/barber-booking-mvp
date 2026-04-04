// app/api/barbershop/setup/route.ts
// POST: Configurar identidad visual de la barbería

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-'); // Múltiples guiones a uno solo
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bio, colors, theme, photos, logo, plan } = body as {
      bio: string;
      colors: string[];
      theme: 'MODERN' | 'CLASSIC' | 'VINTAGE';
      photos: string[];
      logo?: string;
      plan: 'LITE' | 'PRIME' | 'ELITE';
    };

    console.log('📝 Setup recibido:', { bio, colors, theme, photos: photos.length, plan });

    // Validaciones
    if (!bio || bio.trim().length < 50) {
      return NextResponse.json(
        { error: 'La biografía debe tener al menos 50 caracteres' },
        { status: 400 }
      );
    }

    if (!colors || colors.length < 2 || colors.length > 5) {
      return NextResponse.json(
        { error: 'Debes seleccionar entre 2 y 5 colores' },
        { status: 400 }
      );
    }

    if (!photos || photos.length < 3) {
      return NextResponse.json(
        { error: 'Debes subir al menos 3 fotos' },
        { status: 400 }
      );
    }

    // Validar límites según el plan
    const planLimits = {
      LITE: { maxPhotos: 10, maxBarbers: 1 },
      PRIME: { maxPhotos: 20, maxBarbers: 2 },
      ELITE: { maxPhotos: 40, maxBarbers: 999 },
    };

    const limits = planLimits[plan];

    if (photos.length > limits.maxPhotos) {
      return NextResponse.json(
        { error: `El plan ${plan} permite máximo ${limits.maxPhotos} fotos` },
        { status: 400 }
      );
    }

    // Buscar el usuario con su barbería
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { barbershop: true },
    });

    if (!user || !user.barbershop) {
      return NextResponse.json(
        { error: 'No tienes una barbería creada' },
        { status: 404 }
      );
    }

    // Generar slug único
    let slug = generateSlug(user.barbershop.name);
    let slugCounter = 1;

    // Verificar si el slug ya existe
    while (true) {
      const existingSlug = await prisma.barbershop.findUnique({
        where: { slug: slug },
      });

      if (!existingSlug || existingSlug.id === user.barbershop.id) {
        break;
      }

      slug = `${generateSlug(user.barbershop.name)}-${slugCounter}`;
      slugCounter++;
    }

    // Actualizar la barbería
    const updatedBarbershop = await prisma.barbershop.update({
      where: { id: user.barbershop.id },
      data: {
        bio,
        colors,
        theme,
        photos,
        logo: logo || null,
        slug,
      },
    });

    // Crear o actualizar suscripción
    await prisma.subscription.upsert({
      where: { barbershopId: user.barbershop.id },
      create: {
        barbershopId: user.barbershop.id,
        plan,
        status: 'TRIAL',
        maxBarbers: limits.maxBarbers,
        maxPhotos: limits.maxPhotos,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días
      },
      update: {
        plan,
        maxBarbers: limits.maxBarbers,
        maxPhotos: limits.maxPhotos,
      },
    });

    console.log('✅ Setup completado para:', updatedBarbershop.slug);

    return NextResponse.json({
      success: true,
      barbershop: updatedBarbershop,
      slug,
    });
  } catch (error) {
    console.error('❌ Error en setup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}