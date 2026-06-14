// app/api/barbershop/photos/route.ts
// POST  - Agregar una foto a la galería
// DELETE - Eliminar una foto por índice

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getBarbershop(userId: string) {
  return prisma.barbershop.findUnique({
    where: { ownerId: userId },
    select: { id: true, photos: true, subscription: { select: { plan: true } } },
  });
}

// POST /api/barbershop/photos — agrega una sola foto
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { photo } = await req.json();
    if (!photo || typeof photo !== 'string') {
      return NextResponse.json({ error: 'Foto inválida' }, { status: 400 });
    }

    const barbershop = await getBarbershop(session.user.id);
    if (!barbershop) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });
    }

    const plan = barbershop.subscription?.plan ?? 'LITE';
    const maxPhotos = plan === 'ELITE' ? 40 : plan === 'PRIME' ? 20 : 10;

    if (barbershop.photos.length >= maxPhotos) {
      return NextResponse.json(
        { error: `Límite de ${maxPhotos} fotos alcanzado para tu plan` },
        { status: 400 }
      );
    }

    const updated = await prisma.barbershop.update({
      where: { id: barbershop.id },
      data: { photos: { push: photo } },
      select: { photos: true },
    });

    return NextResponse.json({ photos: updated.photos });
  } catch (error) {
    console.error('[PHOTOS POST]', error);
    return NextResponse.json({ error: 'Error al guardar la foto' }, { status: 500 });
  }
}

// DELETE /api/barbershop/photos — elimina una foto por índice
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { index } = await req.json();
    if (typeof index !== 'number' || index < 0) {
      return NextResponse.json({ error: 'Índice inválido' }, { status: 400 });
    }

    const barbershop = await getBarbershop(session.user.id);
    if (!barbershop) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });
    }

    const updatedPhotos = barbershop.photos.filter((_, i) => i !== index);

    const updated = await prisma.barbershop.update({
      where: { id: barbershop.id },
      data: { photos: updatedPhotos },
      select: { photos: true },
    });

    return NextResponse.json({ photos: updated.photos });
  } catch (error) {
    console.error('[PHOTOS DELETE]', error);
    return NextResponse.json({ error: 'Error al eliminar la foto' }, { status: 500 });
  }
}
