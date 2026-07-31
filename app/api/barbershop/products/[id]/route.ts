// PATCH /api/barbershop/products/[id] — actualiza producto
// DELETE /api/barbershop/products/[id] — elimina producto

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getOwnerBarbershop(userId: string) {
  return prisma.barbershop.findUnique({ where: { ownerId: userId } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await getOwnerBarbershop(session.user.id);
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.barbershopId !== barbershop.id) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const { name, description, price, image, isAvailable } = await req.json();

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name        != null && { name }),
        ...(description != null && { description }),
        ...(price       != null && { price: parseFloat(price) }),
        ...(image       != null && { image }),
        ...(isAvailable != null && { isAvailable }),
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error('[PRODUCTS PATCH]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await getOwnerBarbershop(session.user.id);
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.barbershopId !== barbershop.id) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[PRODUCTS DELETE]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
