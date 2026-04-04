// app/api/public/barbershop/[slug]/route.ts
// GET - Datos públicos completos de una barbería
// Usada tanto por la landing (/b/[slug]) como por el booking (/b/[slug]/booking)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } | Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const barbershop = await prisma.barbershop.findUnique({
      where: { slug },
      select: {
        id:          true,
        name:        true,
        slug:        true,
        address:     true,
        phone:       true,
        description: true,
        bio:         true,
        logo:        true,
        colors:      true,
        theme:       true,
        photos:      true,
        viewCount:   true,
        services: {
          orderBy: { createdAt: 'asc' },
          select: {
            id:          true,
            name:        true,
            description: true,
            price:       true,
            duration:    true,
          },
        },
        barbers: {
          where:   { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: {
            id:    true,
            name:  true,
            photo: true,
            bio:   true,
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take:    10,
          select: {
            id:        true,
            rating:    true,
            comment:   true,
            createdAt: true,
            client: {
              select: {
                name:  true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!barbershop) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });
    }

    // Incrementar contador de visitas (sin await para no bloquear)
    prisma.barbershop.update({
      where: { slug },
      data:  { viewCount: { increment: 1 } },
    }).catch(() => {});

    return NextResponse.json({ barbershop });
  } catch (error) {
    console.error('[PUBLIC BARBERSHOP]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}