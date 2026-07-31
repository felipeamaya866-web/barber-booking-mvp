// PATCH  /api/barbershop/combos/[id]
// DELETE /api/barbershop/combos/[id]

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
    const combo = await prisma.serviceCombo.findUnique({ where: { id } });
    if (!combo || combo.barbershopId !== barbershop.id) {
      return NextResponse.json({ error: 'Combo no encontrado' }, { status: 404 });
    }

    const { name, description, price, serviceIds, isActive } = await req.json();

    await prisma.$transaction(async (tx) => {
      await tx.serviceCombo.update({
        where: { id },
        data: {
          ...(name        != null && { name }),
          ...(description != null && { description }),
          ...(price       != null && { price: parseFloat(price) }),
          ...(isActive    != null && { isActive }),
        },
      });

      if (serviceIds) {
        await tx.serviceComboItem.deleteMany({ where: { comboId: id } });
        await tx.serviceComboItem.createMany({
          data: serviceIds.map((serviceId: string) => ({ comboId: id, serviceId })),
        });
      }
    });

    const updated = await prisma.serviceCombo.findUnique({
      where: { id },
      include: {
        items: {
          include: { service: { select: { id: true, name: true, price: true, duration: true } } },
        },
      },
    });

    return NextResponse.json({ combo: updated });
  } catch (error) {
    console.error('[COMBOS PATCH]', error);
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
    const combo = await prisma.serviceCombo.findUnique({ where: { id } });
    if (!combo || combo.barbershopId !== barbershop.id) {
      return NextResponse.json({ error: 'Combo no encontrado' }, { status: 404 });
    }

    await prisma.serviceCombo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[COMBOS DELETE]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
