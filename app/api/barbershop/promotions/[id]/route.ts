// PATCH  /api/barbershop/promotions/[id]
// DELETE /api/barbershop/promotions/[id]

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
    const promo = await prisma.promotion.findUnique({ where: { id } });
    if (!promo || promo.barbershopId !== barbershop.id) {
      return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 });
    }

    const { title, description, discount, discountType, validFrom, validUntil, isActive } = await req.json();

    const updated = await prisma.promotion.update({
      where: { id },
      data: {
        ...(title        != null && { title }),
        ...(description  != null && { description }),
        ...(discount     != null && { discount: parseFloat(discount) }),
        ...(discountType != null && { discountType }),
        ...(validFrom    != null && { validFrom: new Date(validFrom) }),
        ...(validUntil   != null && { validUntil: new Date(validUntil) }),
        ...(isActive     != null && { isActive }),
      },
    });

    return NextResponse.json({ promotion: updated });
  } catch (error) {
    console.error('[PROMOTIONS PATCH]', error);
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
    const promo = await prisma.promotion.findUnique({ where: { id } });
    if (!promo || promo.barbershopId !== barbershop.id) {
      return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 });
    }

    await prisma.promotion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[PROMOTIONS DELETE]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
