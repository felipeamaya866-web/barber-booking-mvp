// app/cookies/page.tsx
import Link from 'next/link';

export const metadata = { title: 'Política de Cookies · BarberBooking' };

export default function CookiesPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #080808; color: #F5F0E8; font-family: 'DM Sans', sans-serif; }
        h1, h2 { font-family: 'Playfair Display', serif; }
        .tc h2 { font-size: 20px; font-weight: 700; color: #C9A84C; margin: 36px 0 14px; }
        .tc p, .tc li { font-size: 14.5px; line-height: 1.75; color: rgba(245,240,232,0.75); }
        .tc ul { margin: 8px 0 8px 22px; }
        .tc li { margin-bottom: 6px; }
        .tc strong { color: #F5F0E8; }
        .tc a { color: #C9A84C; text-decoration: underline; }
        .tc table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 13.5px; }
        .tc th, .tc td { border: 1px solid #2A2A2A; padding: 10px 12px; text-align: left; vertical-align: top; }
        .tc th { background: #111111; color: #C9A84C; font-weight: 600; }
        .tc td { color: rgba(245,240,232,0.75); }
      `}</style>

      <div style={{ minHeight: '100vh', padding: '64px 24px 100px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          <Link href="/" style={{ color: 'rgba(245,240,232,0.5)', textDecoration: 'none', fontSize: 14 }}>← Volver al inicio</Link>

          <h1 style={{ fontSize: 'clamp(30px,5vw,40px)', fontWeight: 900, marginTop: 24, marginBottom: 8 }}>
            Política de <span style={{ color: '#C9A84C' }}>Cookies</span>
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.4)', marginBottom: 32 }}>
            Última actualización: 16 de junio de 2026
          </p>

          <div className="tc">
            <p>
              Una cookie es un pequeño archivo de texto que un sitio web guarda en el navegador del Usuario para recordar
              información entre visitas. Esta política detalla qué cookies y tecnologías similares usa BarberBooking, con qué
              propósito y por cuánto tiempo.
            </p>

            <h2>1. Cookies que utilizamos actualmente</h2>
            <p>
              BarberBooking utiliza únicamente cookies <strong>estrictamente necesarias</strong> para el funcionamiento del
              Servicio. No utilizamos cookies de publicidad, seguimiento de terceros, ni de perfilamiento comercial.
            </p>
            <table>
              <thead>
                <tr><th>Cookie</th><th>Proveedor</th><th>Propósito</th><th>Duración</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>next-auth.session-token</code></td>
                  <td>BarberBooking (NextAuth.js)</td>
                  <td>Mantener la sesión autenticada del Usuario para que no tenga que iniciar sesión en cada página.</td>
                  <td>Hasta cierre de sesión o expiración del token (sesión)</td>
                </tr>
                <tr>
                  <td><code>next-auth.csrf-token</code></td>
                  <td>BarberBooking (NextAuth.js)</td>
                  <td>Protección contra ataques de falsificación de solicitudes entre sitios (CSRF) durante el inicio de sesión.</td>
                  <td>Sesión</td>
                </tr>
                <tr>
                  <td><code>next-auth.callback-url</code></td>
                  <td>BarberBooking (NextAuth.js)</td>
                  <td>Recordar a qué página redirigir al Usuario después de iniciar sesión con Google.</td>
                  <td>Sesión</td>
                </tr>
              </tbody>
            </table>

            <h2>2. Cookies que no utilizamos (por ahora)</h2>
            <p>
              Actualmente no utilizamos herramientas de analítica (como Google Analytics o Vercel Analytics), píxeles de
              publicidad, ni cookies de redes sociales. Si en el futuro incorporamos alguna de estas herramientas, esta página
              será actualizada antes de su activación, listando explícitamente la nueva cookie, su proveedor, propósito y
              duración, y se solicitará el consentimiento correspondiente cuando la ley lo exija.
            </p>

            <h2>3. Cómo administrar las cookies</h2>
            <p>
              Las cookies descritas en la sección 1 son necesarias para que la Plataforma funcione (iniciar sesión y mantener
              su sesión activa). Si el Usuario configura su navegador para bloquear todas las cookies, es posible que no pueda
              iniciar sesión ni usar las funcionalidades de gestión de la Plataforma. La mayoría de los navegadores permiten
              ver y eliminar cookies desde su configuración de privacidad.
            </p>

            <h2>4. Más información</h2>
            <p>
              Para más detalles sobre cómo tratamos los datos personales en general, consulta nuestra{' '}
              <Link href="/privacidad">Política de Privacidad</Link>. Para dudas específicas sobre cookies, escríbenos a{' '}
              <a href="mailto:barber.boking@gmail.com">barber.boking@gmail.com</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
