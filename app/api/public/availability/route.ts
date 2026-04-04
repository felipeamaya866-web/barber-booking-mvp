// app/api/public/availability/route.ts
// GET - Horas disponibles respetando horario + descansos del barbero

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_START = '08:00';
const DEFAULT_END   = '19:00';
const SLOT_MIN      = 30;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function generarSlots(fecha: Date, startTime: string, endTime: string, duration: number): Date[] {
  const slots: Date[] = [];
  const inicioMin = timeToMinutes(startTime);
  const finMin    = timeToMinutes(endTime);

  let cursor = inicioMin;
  while (cursor + duration <= finMin) {
    const slot = new Date(fecha);
    slot.setHours(Math.floor(cursor / 60), cursor % 60, 0, 0);
    slots.push(slot);
    cursor += SLOT_MIN;
  }
  return slots;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barberId = searchParams.get('barberId');
    const dateStr  = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '30');

    if (!barberId || !dateStr) {
      return NextResponse.json({ error: 'Se requiere barberId y date' }, { status: 400 });
    }

    // ✅ Fecha en hora local (evita bug UTC)
    const [year, month, day] = dateStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    if (isNaN(fecha.getTime())) return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fecha < hoy) return NextResponse.json({ slots: [] });

    const dayOfWeek = fecha.getDay(); // 0=Dom ... 6=Sáb

    // Cargar horario, descansos y citas en paralelo
    const [schedule, breaksRaw, citasExistentes] = await Promise.all([
      prisma.barberSchedule.findUnique({
        where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
      }),
      prisma.barberBreak.findMany({
        where: {
          barberId,
          OR: [
            { dayOfWeek: dayOfWeek }, // descanso específico de este día
            { dayOfWeek: -1 },        // descanso para todos los días
          ],
        },
      }),
      prisma.appointment.findMany({
        where: {
          barberId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          date:   {
            gte: new Date(year, month - 1, day, 0, 0, 0),
            lte: new Date(year, month - 1, day, 23, 59, 59),
          },
        },
        include: { service: { select: { duration: true } } },
      }),
    ]);

    // Si no trabaja ese día
    if (schedule && !schedule.isWorking) {
      return NextResponse.json({ slots: [], message: 'El barbero no trabaja este día' });
    }

    const startTime = schedule?.startTime || DEFAULT_START;
    const endTime   = schedule?.endTime   || DEFAULT_END;

    const todosLosSlots = generarSlots(fecha, startTime, endTime, duration);
    const ahora = new Date();

    const slotsDisponibles = todosLosSlots.filter(slot => {
      // No mostrar slots pasados
      if (slot <= ahora) return false;

      const slotInicio = slot.getTime();
      const slotFin    = slotInicio + duration * 60 * 1000;

      const slotInicioMin = slot.getHours() * 60 + slot.getMinutes();
      const slotFinMin    = slotInicioMin + duration;

      // ✅ Verificar que no choca con descansos
      const enDescanso = breaksRaw.some(b => {
        const breakInicio = timeToMinutes(b.startTime);
        const breakFin    = timeToMinutes(b.endTime);
        // El slot cae dentro del descanso si hay superposición
        return slotInicioMin < breakFin && slotFinMin > breakInicio;
      });
      if (enDescanso) return false;

      // Verificar que no choca con citas existentes
      const hayConflicto = citasExistentes.some(cita => {
        const citaInicio = cita.date.getTime();
        const citaFin    = citaInicio + (cita.service?.duration || 30) * 60 * 1000;
        return slotInicio < citaFin && slotFin > citaInicio;
      });

      return !hayConflicto;
    });

    const slots = slotsDisponibles.map(slot => ({
      datetime: slot.toISOString(),
      label:    slot.toLocaleTimeString('es-CO', {
        hour:   '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    }));

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('[AVAILABILITY]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}