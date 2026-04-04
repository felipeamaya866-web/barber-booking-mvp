// app/api/public/booking/route.ts
// POST - Crear una cita (público, no requiere autenticación)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      barbershopSlug,
      serviceId,
      barberId,
      datetime,    // ISO string
      // Cliente registrado (opcional)
      // Si no viene, se usa guestName y guestPhone
      guestName,
      guestPhone,
    } = body;

    // Validaciones básicas
    if (!barbershopSlug || !serviceId || !barberId || !datetime) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Si es invitado, nombre y teléfono son obligatorios
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && (!guestName || !guestPhone)) {
      return NextResponse.json(
        { error: 'Por favor ingresa tu nombre y teléfono' },
        { status: 400 }
      );
    }

    // Obtener barbería
    const barbershop = await prisma.barbershop.findUnique({
      where: { slug: barbershopSlug },
    });
    if (!barbershop) {
      return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });
    }

    // Verificar que el servicio pertenece a esta barbería
    const service = await prisma.service.findFirst({
      where: { id: serviceId, barbershopId: barbershop.id },
    });
    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    // Verificar que el barbero pertenece a esta barbería y está activo
    const barber = await prisma.barber.findFirst({
      where: { id: barberId, barbershopId: barbershop.id, isActive: true },
    });
    if (!barber) {
      return NextResponse.json({ error: 'Barbero no disponible' }, { status: 404 });
    }

    const fechaCita = new Date(datetime);

    // Verificar disponibilidad — que no haya conflicto con otra cita
    const inicioCita = fechaCita.getTime();
    const finCita    = inicioCita + service.duration * 60 * 1000;

    const conflicto = await prisma.appointment.findFirst({
      where: {
        barberId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        date: {
          gte: new Date(inicioCita - service.duration * 60 * 1000),
          lte: new Date(finCita),
        },
      },
      include: { service: { select: { duration: true } } },
    });

    if (conflicto) {
      return NextResponse.json(
        { error: 'Ese horario ya no está disponible. Por favor elige otro.' },
        { status: 409 }
      );
    }

    // Crear la cita
    const appointment = await prisma.appointment.create({
      data: {
        date:         fechaCita,
        status:       'CONFIRMED',
        serviceId,
        barberId,
        barbershopId: barbershop.id,
        // Cliente registrado o invitado
        clientId:   session?.user?.id || null,
        guestName:  session?.user?.id ? null : guestName,
        guestPhone: session?.user?.id ? null : guestPhone,
      },
      include: {
        service:    { select: { name: true, duration: true, price: true } },
        barber:     { select: { name: true } },
        barbershop: { select: { name: true, address: true, phone: true } },
      },
    });

    return NextResponse.json({
      appointment,
      message: '¡Cita agendada exitosamente!',
    }, { status: 201 });

  } catch (error) {
    console.error('[BOOKING]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}