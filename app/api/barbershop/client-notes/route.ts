// GET  /api/barbershop/client-notes?clientId=xxx — lee nota de un cliente para este barbero/barbería
// POST /api/barbershop/client-notes — crea o actualiza nota (upsert)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clientId   = searchParams.get('clientId');
    const guestPhone = searchParams.get('guestPhone');

    // El barbero lee sus propias notas
    const barber = await prisma.barber.findFirst({
      where: { userId: session.user.id },
    });
    if (!barber) return NextResponse.json({ error: 'Perfil de barbero no encontrado' }, { status: 404 });

    const note = clientId
      ? await prisma.clientNote.findUnique({ where: { barberId_clientId: { barberId: barber.id, clientId } } })
      : guestPhone
        ? await prisma.clientNote.findFirst({ where: { barberId: barber.id, guestPhone } })
        : null;

    return NextResponse.json({ note });
  } catch (error) {
    console.error('[CLIENT-NOTES GET]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { clientId, guestPhone, rating, note } = await req.json() as {
      clientId?: string; guestPhone?: string; rating: number; note?: string;
    };

    if (!clientId && !guestPhone) {
      return NextResponse.json({ error: 'Se requiere clientId o guestPhone' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating debe ser entre 1 y 5' }, { status: 400 });
    }

    // Puede ser el dueño de la barbería (también puede tener un perfil de barber) o un barbero
    const barber = await prisma.barber.findFirst({
      where: { userId: session.user.id },
    });
    if (!barber) return NextResponse.json({ error: 'Perfil de barbero no encontrado' }, { status: 404 });

    let clientNote;
    if (clientId) {
      clientNote = await prisma.clientNote.upsert({
        where: { barberId_clientId: { barberId: barber.id, clientId } },
        update: { rating, note: note || null },
        create: { barberId: barber.id, clientId, rating, note: note || null },
      });
    } else {
      const existing = await prisma.clientNote.findFirst({ where: { barberId: barber.id, guestPhone } });
      if (existing) {
        clientNote = await prisma.clientNote.update({
          where: { id: existing.id },
          data:  { rating, note: note || null },
        });
      } else {
        clientNote = await prisma.clientNote.create({
          data: { barberId: barber.id, guestPhone: guestPhone!, rating, note: note || null },
        });
      }
    }

    return NextResponse.json({ clientNote });
  } catch (error) {
    console.error('[CLIENT-NOTES POST]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
