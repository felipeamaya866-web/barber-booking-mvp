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

// Generate UTC Date objects for each slot, converting local working hours to UTC.
// utcOffset = new Date().getTimezoneOffset() from the client (e.g. 300 for Colombia UTC-5).
// Local time + utcOffset = UTC time.
function generarSlots(
  year: number, month: number, day: number,
  startTime: string, endTime: string,
  duration: number, utcOffset: number
): Date[] {
  const slots: Date[] = [];
  const inicioMin = timeToMinutes(startTime);
  const finMin    = timeToMinutes(endTime);

  let cursor = inicioMin;
  while (cursor + duration <= finMin) {
    // Convert local minutes-from-midnight to UTC
    const utcCursor = cursor + utcOffset;
    // Date.UTC handles overflow/underflow automatically (e.g. -60 → previous day 23:00)
    const slot = new Date(Date.UTC(
      year, month - 1, day,
      Math.floor(utcCursor / 60),
      utcCursor % 60,
      0, 0
    ));
    slots.push(slot);
    cursor += SLOT_MIN;
  }
  return slots;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barberId       = searchParams.get('barberId');
    const dateStr        = searchParams.get('date');
    const duration       = parseInt(searchParams.get('duration') || '30');
    // Minimum booking notice in hours (0 = no restriction)
    const minNoticeHours = parseInt(searchParams.get('minNoticeHours') || '0');
    // Client's getTimezoneOffset() — positive for UTC-x zones (e.g. 300 for Colombia UTC-5)
    const utcOffset      = parseInt(searchParams.get('utcOffset') || '0');

    if (!barberId || !dateStr) {
      return NextResponse.json({ error: 'Se requiere barberId y date' }, { status: 400 });
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 });
    }

    // UTC boundaries for this LOCAL day (used for the appointments DB query)
    // e.g. Colombia (utcOffset=300): July 31 00:00 local = July 31 05:00 UTC
    const localDayStartMs = Date.UTC(year, month - 1, day) + utcOffset * 60_000;
    const localDayEndMs   = localDayStartMs + 24 * 3_600_000;

    // Day-of-week for the schedule lookup (based on the local date selected by the user)
    const dayOfWeek = new Date(year, month - 1, day).getDay(); // 0=Sun … 6=Sat

    const ahora = new Date();

    // Load schedule, breaks, and existing appointments in parallel
    const [schedule, breaksRaw, citasExistentes] = await Promise.all([
      prisma.barberSchedule.findUnique({
        where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
      }),
      prisma.barberBreak.findMany({
        where: {
          barberId,
          OR: [
            { dayOfWeek },
            { dayOfWeek: -1 }, // descanso para todos los días
          ],
        },
      }),
      prisma.appointment.findMany({
        where: {
          barberId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          date: {
            gte: new Date(localDayStartMs),
            lt:  new Date(localDayEndMs),
          },
        },
        include: { service: { select: { duration: true } } },
      }),
    ]);

    // El barbero no trabaja ese día
    if (schedule && !schedule.isWorking) {
      return NextResponse.json({ slots: [], message: 'El barbero no trabaja este día' });
    }

    const startTime = schedule?.startTime || DEFAULT_START;
    const endTime   = schedule?.endTime   || DEFAULT_END;

    const todosLosSlots = generarSlots(year, month, day, startTime, endTime, duration, utcOffset);
    const minNoticeMs   = minNoticeHours * 3_600_000;

    const slotsDisponibles = todosLosSlots.filter(slot => {
      // Filtrar slots que ya pasaron O que están dentro de la ventana de anticipación mínima
      if (slot.getTime() - ahora.getTime() < minNoticeMs) return false;

      const slotInicio = slot.getTime();
      const slotFin    = slotInicio + duration * 60_000;

      // Slot en minutos locales (para comparar con descansos que están en hora local)
      const slotLocalMs    = slotInicio - utcOffset * 60_000;
      const slotLocalDate  = new Date(slotLocalMs);
      const slotInicioMin  = slotLocalDate.getUTCHours() * 60 + slotLocalDate.getUTCMinutes();
      const slotFinMin     = slotInicioMin + duration;

      // Verificar que no choca con descansos (guardados en hora local del barbero)
      const enDescanso = breaksRaw.some(b => {
        const breakInicio = timeToMinutes(b.startTime);
        const breakFin    = timeToMinutes(b.endTime);
        return slotInicioMin < breakFin && slotFinMin > breakInicio;
      });
      if (enDescanso) return false;

      // Verificar que no choca con citas existentes
      const hayConflicto = citasExistentes.some(cita => {
        const citaInicio = cita.date.getTime();
        const citaFin    = citaInicio + (cita.service?.duration || 30) * 60_000;
        return slotInicio < citaFin && slotFin > citaInicio;
      });

      return !hayConflicto;
    });

    const slots = slotsDisponibles.map(slot => {
      // Convert UTC timestamp back to local time for display
      // utcOffset = getTimezoneOffset() = minutes to add to local to get UTC
      // So local time = UTC - utcOffset
      const localMs   = slot.getTime() - utcOffset * 60_000;
      const localDate = new Date(localMs);
      const h = localDate.getUTCHours();
      const m = localDate.getUTCMinutes();
      const period   = h >= 12 ? 'p. m.' : 'a. m.';
      const displayH = h % 12 || 12;
      const label    = `${displayH}:${String(m).padStart(2, '0')} ${period}`;
      return { datetime: slot.toISOString(), label };
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('[AVAILABILITY]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
