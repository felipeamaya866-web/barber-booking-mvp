// app/api/barber/stats/route.ts
// GET - Estadísticas personales del barbero
// Retorna: citas del mes, servicios vendidos, ingresos (solo si showEarnings=true)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barber = await prisma.barber.findUnique({
      where:   { userId: session.user.id },
      include: { barbershop: { select: { name: true } } },
    });
    if (!barber || barber.inviteStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const now        = new Date();
    const inicioMes  = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMes     = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const inicioSem  = new Date(now); inicioSem.setDate(now.getDate() - now.getDay());
    inicioSem.setHours(0, 0, 0, 0);

    const [citasMes, citasSemana, serviciosConteo, totalCitas] = await Promise.all([
      // Citas del mes actual
      prisma.appointment.count({
        where: { barberId: barber.id, date: { gte: inicioMes, lte: finMes }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      }),
      // Citas esta semana
      prisma.appointment.count({
        where: { barberId: barber.id, date: { gte: inicioSem }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      }),
      // Top servicios más vendidos (solo completados)
      prisma.appointment.groupBy({
        by:      ['serviceId'],
        where:   { barberId: barber.id, status: 'COMPLETED' },
        _count:  { serviceId: true },
        orderBy: { _count: { serviceId: 'desc' } },
        take:    5,
      }),
      // Total histórico de citas completadas
      prisma.appointment.count({
        where: { barberId: barber.id, status: 'COMPLETED' },
      }),
    ]);

    // Resolver nombres de servicios
    const serviceIds = serviciosConteo.map(s => s.serviceId);
    const services   = await prisma.service.findMany({
      where:  { id: { in: serviceIds } },
      select: { id: true, name: true, price: true },
    });
    const topServicios = serviciosConteo.map(s => ({
      nombre:  services.find(sv => sv.id === s.serviceId)?.name || 'Servicio',
      precio:  services.find(sv => sv.id === s.serviceId)?.price || 0,
      total:   s._count.serviceId,
    }));

    // Ingresos — solo si el dueño lo permitió
    let ingresosMes:  number | null = null;
    let ingresosTotal: number | null = null;

    if (barber.showEarnings) {
      const citasCompletadasMes = await prisma.appointment.findMany({
        where:   { barberId: barber.id, status: 'COMPLETED', date: { gte: inicioMes, lte: finMes } },
        include: { service: { select: { price: true } } },
      });
      const citasCompletadasTotal = await prisma.appointment.findMany({
        where:   { barberId: barber.id, status: 'COMPLETED' },
        include: { service: { select: { price: true } } },
      });
      ingresosMes   = citasCompletadasMes.reduce((sum, c)   => sum + (c.service?.price || 0), 0);
      ingresosTotal = citasCompletadasTotal.reduce((sum, c) => sum + (c.service?.price || 0), 0);
    }

    return NextResponse.json({
      citasMes,
      citasSemana,
      totalCitas,
      topServicios,
      showEarnings: barber.showEarnings,
      ingresosMes,
      ingresosTotal,
    });
  } catch (error) {
    console.error('[BARBER STATS]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}