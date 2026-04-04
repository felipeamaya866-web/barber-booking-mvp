// app/api/services/[id]/route.ts
// PUT: Actualizar un servicio
// DELETE: Eliminar un servicio

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT - Actualizar un servicio
export async function PUT(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Await params si es Promise (Next.js 15+)
    const resolvedParams = await params;
    const serviceId = resolvedParams.id;
    
    console.log('🔍 PUT /api/services/[id] - ID recibido:', serviceId);

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log('❌ PUT: No autenticado');
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

    console.log('📝 PUT: Datos recibidos:', { name, price, duration });

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
      console.log('❌ PUT: Usuario sin barbería');
      return NextResponse.json(
        { error: 'No tienes una barbería' },
        { status: 404 }
      );
    }

    // Verificar que el servicio pertenece a la barbería del usuario
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!existingService) {
      console.log('❌ PUT: Servicio no encontrado:', serviceId);
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    if (existingService.barbershopId !== user.barbershop.id) {
      console.log('❌ PUT: Sin permiso para editar');
      return NextResponse.json(
        { error: 'No tienes permiso para editar este servicio' },
        { status: 403 }
      );
    }

    // Actualizar el servicio
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name,
        description: description && description.trim() !== '' ? description : null,
        price: parseFloat(price.toString()),
        duration: parseInt(duration.toString()),
      },
    });

    console.log('✅ PUT: Servicio actualizado:', service.id);

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error('❌ Error al actualizar servicio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un servicio
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Await params si es Promise (Next.js 15+)
    const resolvedParams = await params;
    const serviceId = resolvedParams.id;
    
    console.log('🔍 DELETE /api/services/[id] - ID recibido:', serviceId);

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log('❌ DELETE: No autenticado');
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
      console.log('❌ DELETE: Usuario sin barbería');
      return NextResponse.json(
        { error: 'No tienes una barbería' },
        { status: 404 }
      );
    }

    // Verificar que el servicio pertenece a la barbería del usuario
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!existingService) {
      console.log('❌ DELETE: Servicio no encontrado:', serviceId);
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    if (existingService.barbershopId !== user.barbershop.id) {
      console.log('❌ DELETE: Sin permiso para eliminar');
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este servicio' },
        { status: 403 }
      );
    }

    // Eliminar el servicio
    await prisma.service.delete({
      where: { id: serviceId },
    });

    console.log('✅ DELETE: Servicio eliminado:', serviceId);

    return NextResponse.json({
      success: true,
      message: 'Servicio eliminado correctamente',
    });
  } catch (error) {
    console.error('❌ Error al eliminar servicio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}