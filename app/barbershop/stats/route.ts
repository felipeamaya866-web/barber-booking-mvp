// app/api/barbershop/stats/route.ts
// GET - Estadísticas avanzadas con filtros de periodo

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
}
function parseLocalDate(str: string) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const barbershop = await prisma.barbershop.findUnique({
      where:  { ownerId: session.user.id },
      select: { id: true, viewCount: true },
    });
    if (!barbershop) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const mode    = searchParams.get('mode') || 'month';
    const fromStr = searchParams.get('from');
    const toStr   = searchParams.get('to');
    const now     = new Date();

    // ── Calcular rangos ──────────────────────────────────────────
    let rangeStart: Date, rangeEnd: Date, prevStart: Date, prevEnd: Date;

    if (mode === 'range' && fromStr && toStr) {
      rangeStart = startOfDay(parseLocalDate(fromStr));
      rangeEnd   = endOfDay(parseLocalDate(toStr));
      const diffMs = rangeEnd.getTime() - rangeStart.getTime();
      prevStart  = new Date(rangeStart.getTime() - diffMs - 1000);
      prevEnd    = new Date(rangeStart.getTime() - 1000);
    } else {
      // Mes actual por defecto
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
      rangeEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      prevStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    const bId = barbershop.id;

    // ── Consultas en paralelo ────────────────────────────────────
    const [
      citasRango,
      citasPrevio,
      citasPorDia,
      topBarberos,
      topServicios,
      cancelaciones,
    ] = await Promise.all([
      prisma.appointment.findMany({
        where:   { barbershopId: bId, date: { gte: rangeStart, lte: rangeEnd }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        include: { service: { select: { price: true } } },
      }),
      prisma.appointment.findMany({
        where:   { barbershopId: bId, date: { gte: prevStart, lte: prevEnd }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        include: { service: { select: { price: true } } },
      }),
      prisma.appointment.groupBy({
        by:      ['date'],
        where:   { barbershopId: bId, date: { gte: rangeStart, lte: rangeEnd }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _count:  { id: true },
        orderBy: { date: 'asc' },
      }),
      prisma.appointment.groupBy({
        by:      ['barberId'],
        where:   { barbershopId: bId, date: { gte: rangeStart, lte: rangeEnd }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _count:  { id: true },
        orderBy: { _count: { id: 'desc' } },
        take:    5,
      }),
      prisma.appointment.groupBy({
        by:      ['serviceId'],
        where:   { barbershopId: bId, date: { gte: rangeStart, lte: rangeEnd }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _count:  { id: true },
        orderBy: { _count: { id: 'desc' } },
        take:    5,
      }),
      prisma.appointment.count({
        where: { barbershopId: bId, date: { gte: rangeStart, lte: rangeEnd }, status: 'CANCELLED' },
      }),
    ]);

    // ── Resolver nombres ─────────────────────────────────────────
    const [barberosDatos, serviciosDatos] = await Promise.all([
      prisma.barber.findMany({
        where:  { id: { in: topBarberos.map(b => b.barberId) } },
        select: { id: true, name: true, photo: true },
      }),
      prisma.service.findMany({
        where:  { id: { in: topServicios.map(s => s.serviceId) } },
        select: { id: true, name: true, price: true },
      }),
    ]);

    // ── Calcular métricas ────────────────────────────────────────
    const ingresosMes  = citasRango.reduce((s, c)  => s + (c.service?.price || 0), 0);
    const ingresosPrev = citasPrevio.reduce((s, c) => s + (c.service?.price || 0), 0);
    const totalCitas   = citasRango.length;
    const totalCitasPrev = citasPrevio.length;

    const totalParaCancelacion = totalCitas + cancelaciones;
    const tasaCancelacion = totalParaCancelacion > 0
      ? Math.round((cancelaciones / totalParaCancelacion) * 100) : 0;

    const variacionIngresos = ingresosPrev > 0
      ? Math.round(((ingresosMes - ingresosPrev) / ingresosPrev) * 100) : null;
    const variacionCitas = totalCitasPrev > 0
      ? Math.round(((totalCitas - totalCitasPrev) / totalCitasPrev) * 100) : null;

    // Agrupar citas por día
    const graficaDias = citasPorDia.map(g => ({
      fecha: new Date(g.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
      citas: g._count.id,
    }));

    // Rankings
    const rankingBarberos = topBarberos.map(b => ({
      nombre: barberosDatos.find(bd => bd.id === b.barberId)?.name || '—',
      foto:   barberosDatos.find(bd => bd.id === b.barberId)?.photo || null,
      citas:  b._count.id,
    }));

    const rankingServicios = topServicios.map(s => {
      const srv = serviciosDatos.find(sd => sd.id === s.serviceId);
      return {
        nombre:   srv?.name || '—',
        citas:    s._count.id,
        ingresos: (srv?.price || 0) * s._count.id,
      };
    });

    return NextResponse.json({
      ingresosMes,
      ingresosPrev,
      variacionIngresos,
      totalCitas,
      totalCitasPrev,
      variacionCitas,
      cancelaciones,
      tasaCancelacion,
      visitasPagina: barbershop.viewCount,
      graficaDias,
      rankingBarberos,
      rankingServicios,
      rangeStart: rangeStart.toISOString(),
      rangeEnd:   rangeEnd.toISOString(),
    });
  } catch (error) {
    console.error('[STATS]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}