// GET /api/public/booking/cancel?id=APPOINTMENT_ID&token=HMAC_TOKEN
// Cancela una cita usando un token firmado enviado por email al cliente

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';

function generarToken(appointmentId: string): string {
  return createHmac('sha256', process.env.NEXTAUTH_SECRET!)
    .update(appointmentId)
    .digest('hex');
}

export async function GET(req: NextRequest) {
  const id    = req.nextUrl.searchParams.get('id')    ?? '';
  const token = req.nextUrl.searchParams.get('token') ?? '';

  if (!id || !token) {
    return new NextResponse(cancelHtml('Enlace inválido.', false), { headers: { 'Content-Type': 'text/html' } });
  }

  // Verificar token HMAC
  const esperado = generarToken(id);
  if (token !== esperado) {
    return new NextResponse(cancelHtml('Este enlace no es válido o ya fue usado.', false), { headers: { 'Content-Type': 'text/html' } });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { barbershop: { select: { name: true } } },
    });

    if (!appointment) {
      return new NextResponse(cancelHtml('La cita no existe.', false), { headers: { 'Content-Type': 'text/html' } });
    }

    if (appointment.status === 'CANCELLED') {
      return new NextResponse(cancelHtml('Esta cita ya fue cancelada.', false), { headers: { 'Content-Type': 'text/html' } });
    }

    if (appointment.status === 'COMPLETED') {
      return new NextResponse(cancelHtml('Esta cita ya fue completada y no puede cancelarse.', false), { headers: { 'Content-Type': 'text/html' } });
    }

    // Solo cancelar si la cita es en el futuro
    if (appointment.date <= new Date()) {
      return new NextResponse(cancelHtml('No puedes cancelar una cita que ya pasó.', false), { headers: { 'Content-Type': 'text/html' } });
    }

    await prisma.appointment.update({
      where: { id },
      data:  { status: 'CANCELLED' },
    });

    return new NextResponse(
      cancelHtml(`Tu cita en ${appointment.barbershop.name} ha sido cancelada exitosamente.`, true),
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch {
    return new NextResponse(cancelHtml('Error al cancelar. Intenta de nuevo.', false), { headers: { 'Content-Type': 'text/html' } });
  }
}

function cancelHtml(message: string, success: boolean): string {
  const color = success ? '#22c55e' : '#ef4444';
  const icon  = success ? '✓' : '✗';
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${success ? 'Cita cancelada' : 'Error'} · BarberBooking</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="text-align:center;padding:40px 24px;max-width:400px;">
    <div style="width:64px;height:64px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:28px;color:${color};">${icon}</div>
    <p style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;margin:0 0 12px;">BarberBooking</p>
    <p style="font-size:17px;color:#F5F0E8;margin:0 0 24px;line-height:1.5;">${message}</p>
    <a href="https://barberbooking.site" style="display:inline-block;background:#C9A84C;color:#0a0a0a;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">Ir a BarberBooking</a>
  </div>
</body>
</html>`;
}
