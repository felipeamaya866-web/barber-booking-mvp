import { Resend } from 'resend';
import { createHmac } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = 'BarberBooking <noreply@barberbooking.site>';

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}
function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

interface BookingEmailData {
  appointmentId:    string;
  clientName:       string;
  clientEmail?:     string | null;
  ownerEmail:       string;
  barbershopName:   string;
  barbershopAddress?: string | null;
  barbershopPhone?: string | null;
  barberName:       string;
  serviceName:      string;
  servicePrice:     number;
  date:             Date;
}

function cancelToken(appointmentId: string): string {
  return createHmac('sha256', process.env.NEXTAUTH_SECRET!)
    .update(appointmentId)
    .digest('hex');
}

function bookingHtml(data: BookingEmailData, role: 'client' | 'owner'): string {
  const dateStr   = formatDate(data.date);
  const timeStr   = formatTime(data.date);
  const priceStr  = `$${data.servicePrice.toLocaleString('es-CO')} COP`;
  const cancelUrl = `https://barberbooking.site/api/public/booking/cancel?id=${data.appointmentId}&token=${cancelToken(data.appointmentId)}`;

  const headline = role === 'client'
    ? `¡Tu cita está confirmada, ${data.clientName}!`
    : `Nueva cita en ${data.barbershopName}`;

  const intro = role === 'client'
    ? `Tu reserva en <strong>${data.barbershopName}</strong> ha sido confirmada exitosamente.`
    : `<strong>${data.clientName}</strong> ha agendado una nueva cita.`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222;">
        <!-- Header -->
        <tr><td style="padding:32px 36px 24px;border-bottom:1px solid #1e1e1e;">
          <p style="margin:0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;font-weight:600;">BarberBooking</p>
          <h1 style="margin:10px 0 0;font-size:22px;font-weight:700;color:#F5F0E8;line-height:1.3;">${headline}</h1>
        </td></tr>
        <!-- Intro -->
        <tr><td style="padding:24px 36px 0;">
          <p style="margin:0;font-size:15px;color:rgba(245,240,232,0.75);line-height:1.6;">${intro}</p>
        </td></tr>
        <!-- Details card -->
        <tr><td style="padding:20px 36px;">
          <table width="100%" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;">
            <tr><td style="padding:20px 24px;">
              ${row('📅 Fecha',    dateStr)}
              ${row('🕐 Hora',     timeStr)}
              ${row('✂️ Servicio', data.serviceName)}
              ${row('💈 Barbero',  data.barberName)}
              ${row('💰 Valor',    priceStr)}
              ${data.barbershopAddress ? row('📍 Dirección', data.barbershopAddress) : ''}
              ${data.barbershopPhone   ? row('📞 Teléfono',  data.barbershopPhone)   : ''}
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer note / cancel -->
        <tr><td style="padding:0 36px 32px;">
          ${role === 'client' ? `
          <a href="${cancelUrl}" style="display:inline-block;margin-bottom:16px;background:#1a1a1a;border:1px solid #333;color:rgba(245,240,232,0.6);padding:10px 20px;border-radius:8px;font-size:13px;text-decoration:none;">
            Cancelar esta cita
          </a><br>` : ''}
          <p style="margin:0;font-size:12px;color:rgba(245,240,232,0.3);line-height:1.6;">
            ${role === 'client'
              ? 'Solo puedes cancelar antes de la hora de la cita.'
              : 'Notificación automática de BarberBooking.'}
          </p>
        </td></tr>
        <!-- Brand footer -->
        <tr><td style="padding:20px 36px;border-top:1px solid #1e1e1e;text-align:center;">
          <p style="margin:0;font-size:12px;color:rgba(245,240,232,0.25);">
            © ${new Date().getFullYear()} BarberBooking · <a href="https://barberbooking.site" style="color:#C9A84C;text-decoration:none;">barberbooking.site</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:rgba(245,240,232,0.45);width:110px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#F5F0E8;font-weight:500;">${value}</td>
  </tr>`;
}

export async function sendBookingEmails(data: BookingEmailData) {
  const emails: Promise<unknown>[] = [];

  // Email al cliente (solo si tiene correo)
  if (data.clientEmail) {
    emails.push(
      resend.emails.send({
        from:    FROM,
        to:      data.clientEmail,
        subject: `Cita confirmada en ${data.barbershopName} · ${formatDate(data.date)}`,
        html:    bookingHtml(data, 'client'),
      })
    );
  }

  // Email al dueño de la barbería
  emails.push(
    resend.emails.send({
      from:    FROM,
      to:      data.ownerEmail,
      subject: `Nueva cita: ${data.clientName} · ${formatDate(data.date)} ${formatTime(data.date)}`,
      html:    bookingHtml(data, 'owner'),
    })
  );

  await Promise.allSettled(emails);
}
