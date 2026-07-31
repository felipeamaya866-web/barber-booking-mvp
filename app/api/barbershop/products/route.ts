// GET  /api/barbershop/products — lista productos de la barbería
// POST /api/barbershop/products — crea producto

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getOwnerBarbershop(userId: string) {
  return prisma.barbershop.findUnique({ where: { ownerId: userId } });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await getOwnerBarbershop(session.user.id);
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const products = await prisma.product.findMany({
      where: { barbershopId: barbershop.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[PRODUCTS GET]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await getOwnerBarbershop(session.user.id);
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const { name, description, price, image, isAvailable } = await req.json();

    if (!name || price == null) {
      return NextResponse.json({ error: 'Nombre y precio son requeridos' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        image: image || null,
        isAvailable: isAvailable ?? true,
        barbershopId: barbershop.id,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('[PRODUCTS POST]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
