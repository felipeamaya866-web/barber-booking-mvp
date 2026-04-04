// app/api/barbershop/create/route.ts
// POST /api/barbershop/create - Crea una nueva barbería

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
    const { name, address, phone, description } = body as {
      name: string;
      address: string;
      phone: string;
      description?: string;
    };

    // Validaciones
    if (!name || !address || !phone) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Buscar el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { barbershop: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya tiene una barbería
    if (user.barbershop) {
      return NextResponse.json(
        { error: 'Ya tienes una barbería creada' },
        { status: 400 }
      );
    }

    // Generar slug único
    let slug = generateSlug(name);
    let slugCounter = 1;

    // Verificar si el slug ya existe
    while (true) {
      const existingSlug = await prisma.barbershop.findUnique({
        where: { slug: slug },
      });

      if (!existingSlug) {
        break;
      }

      slug = `${generateSlug(name)}-${slugCounter}`;
      slugCounter++;
    }

    // Crear la barbería
    const barbershop = await prisma.barbershop.create({
      data: {
        name,
        address,
        phone,
        description: description && description.trim() !== '' ? description : null,
        slug,
        colors: [],
        photos: [],
        theme: 'MODERN',
        owner: {
          connect: { id: user.id },
        },
      },
    });

    console.log('✅ Barbería creada:', barbershop.slug);

    return NextResponse.json({
      success: true,
      barbershop,
    });
  } catch (error) {
    console.error('Error al crear barbería:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}