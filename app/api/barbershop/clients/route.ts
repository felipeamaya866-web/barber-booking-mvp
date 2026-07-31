// GET /api/barbershop/clients — lista clientes de la barbería con filtros
// Query params: filter=all|loyal|lapsed|birthday

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await prisma.barbershop.findUnique({ where: { ownerId: session.user.id } });
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // all | loyal | lapsed | birthday | today

    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Traer todas las citas de esta barbería con cliente registrado
    const appointments = await prisma.appointment.findMany({
      where: {
        barbershopId: barbershop.id,
        OR: [
          { clientId: { not: null } },
          { guestPhone: { not: null } },
        ],
      },
      select: {
        id:          true,
        date:        true,
        attended:    true,
        status:      true,
        clientId:    true,
        guestName:   true,
        guestPhone:  true,
        client:      { select: { id: true, name: true, email: true, image: true, birthday: true, phone: true } },
        service:     { select: { name: true, price: true } },
        barber:      { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Agrupar por cliente (usando clientId o guestPhone como clave)
    const clientMap = new Map<string, {
      key:         string;
      clientId:    string | null;
      guestName:   string | null;
      guestPhone:  string | null;
      name:        string;
      email:       string | null;
      image:       string | null;
      birthday:    Date | null;
      phone:       string | null;
      visits:      number;
      lastVisit:   Date;
      firstVisit:  Date;
      totalSpent:  number;
      appointments: typeof appointments;
    }>();

    for (const apt of appointments) {
      const key = apt.clientId ?? `guest_${apt.guestPhone}`;
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          key,
          clientId:    apt.clientId,
          guestName:   apt.guestName,
          guestPhone:  apt.guestPhone,
          name:        apt.client?.name ?? apt.guestName ?? 'Sin nombre',
          email:       apt.client?.email ?? null,
          image:       apt.client?.image ?? null,
          birthday:    apt.client?.birthday ?? null,
          phone:       apt.client?.phone ?? apt.guestPhone,
          visits:      0,
          lastVisit:   apt.date,
          firstVisit:  apt.date,
          totalSpent:  0,
          appointments: [],
        });
      }
      const c = clientMap.get(key)!;
      c.visits++;
      c.totalSpent += apt.service?.price ?? 0;
      if (apt.date > c.lastVisit)  c.lastVisit  = apt.date;
      if (apt.date < c.firstVisit) c.firstVisit = apt.date;
      c.appointments.push(apt);
    }

    let clients = Array.from(clientMap.values());

    // Aplicar filtro
    if (filter === 'loyal') {
      clients = clients.filter(c => c.visits >= 3);
    } else if (filter === 'lapsed') {
      clients = clients.filter(c => c.lastVisit < sixtyDaysAgo);
    } else if (filter === 'birthday') {
      const todayMonth = now.getMonth() + 1;
      const todayDay   = now.getDate();
      clients = clients.filter(c => {
        if (!c.birthday) return false;
        const b = new Date(c.birthday);
        return b.getMonth() + 1 === todayMonth && b.getDate() === todayDay;
      });
    } else if (filter === 'today') {
      // Clientes con cita hoy
      clients = clients.filter(c =>
        c.appointments.some(a => a.date >= todayStart && a.date <= todayEnd)
      );
    }

    // Ordenar por última visita desc
    clients.sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('[CLIENTS GET]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
