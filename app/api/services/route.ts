// app/api/services/route.ts
// GET: Listar servicios de la barbería
// POST: Crear un nuevo servicio

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Obtener todos los servicios de la barbería del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Buscar el usuario con su barbería
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { barbershop: true },
    });

    if (!user || !user.barbershop) {
      return NextResponse.json(
        { error: 'No tienes una barbería' },
        { status: 404 }
      );
    }

    // Obtener los servicios de la barbería
    const services = await prisma.service.findMany({
      where: { barbershopId: user.barbershop.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo servicio
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
    const { name, description, price, duration } = body as {
      name: string;
      description?: string;
      price: number;
      duration: number;
    };

    // Validaciones
    if (!name || !price || !duration) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    if (price <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (duration <= 0) {
      return NextResponse.json(
        { error: 'La duración debe ser mayor a 0' },
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
        { error: 'No tienes una barbería' },
        { status: 404 }
      );
    }

    // Crear el servicio
    const service = await prisma.service.create({
      data: {
        name,
        description: description && description.trim() !== '' ? description : null,
        price: parseFloat(price.toString()),
        duration: parseInt(duration.toString()),
        barbershopId: user.barbershop.id,
      },
    });

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}