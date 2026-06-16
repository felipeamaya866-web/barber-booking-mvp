// app/privacidad/page.tsx
import Link from 'next/link';

export const metadata = { title: 'Política de Privacidad · BarberBooking' };

export default function PrivacidadPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #080808; color: #F5F0E8; font-family: 'DM Sans', sans-serif; }
        h1, h2 { font-family: 'Playfair Display', serif; }
        .tc h2 { font-size: 20px; font-weight: 700; color: #C9A84C; margin: 36px 0 14px; }
        .tc h3 { font-size: 15px; font-weight: 600; color: #F5F0E8; margin: 20px 0 8px; }
        .tc p, .tc li { font-size: 14.5px; line-height: 1.75; color: rgba(245,240,232,0.75); }
        .tc ul, .tc ol { margin: 8px 0 8px 22px; }
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
            Política de <span style={{ color: '#C9A84C' }}>Privacidad</span>
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.4)', marginBottom: 8 }}>
            Última actualización: 16 de junio de 2026
          </p>
          <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.4)', marginBottom: 32 }}>
            Esta Política de Privacidad describe cómo BarberBooking (en adelante &ldquo;nosotros&rdquo; o &ldquo;la
            Plataforma&rdquo;) recolecta, usa, almacena y protege los datos personales de sus Usuarios, conforme a la Ley 1581
            de 2012, el Decreto 1377 de 2013 y demás normas de protección de datos personales vigentes en Colombia.
          </p>

          <div className="tc">

            <h2>1. Responsable del tratamiento</h2>
            <p>
              BarberBooking es responsable del tratamiento de los datos personales recolectados a través de la Plataforma.
              Para cualquier consulta relacionada con el tratamiento de sus datos, puede escribir a{' '}
              <a href="mailto:barber.boking@gmail.com">barber.boking@gmail.com</a> o usar nuestro{' '}
              <Link href="/contacto">formulario de contacto</Link>.
            </p>

            <h2>2. Datos personales que recolectamos</h2>
            <p>Dependiendo de cómo interactúe con la Plataforma, podemos recolectar los siguientes datos:</p>
            <table>
              <thead>
                <tr><th>Tipo de Usuario</th><th>Datos recolectados</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Dueño de Barbería</strong></td>
                  <td>Nombre, correo electrónico y foto de perfil (vía autenticación con Google); nombre, dirección, teléfono, descripción, fotografías y ubicación geográfica del negocio; identificador de referencia de la fuente de pago registrada en Wompi (no datos de tarjeta).</td>
                </tr>
                <tr>
                  <td><strong>Barbero</strong></td>
                  <td>Nombre, fotografía, horarios de trabajo y, si aplica, correo de acceso al sistema.</td>
                </tr>
                <tr>
                  <td><strong>Cliente final</strong></td>
                  <td>Nombre, número de teléfono y, opcionalmente, correo electrónico, proporcionados al momento de reservar una cita.</td>
                </tr>
                <tr>
                  <td><strong>Todos los Usuarios</strong></td>
                  <td>Datos técnicos de uso de la Plataforma (dirección IP, tipo de dispositivo, registros de actividad) recolectados automáticamente con fines de seguridad y soporte.</td>
                </tr>
              </tbody>
            </table>

            <h2>3. Datos sensibles de pago: lo que NUNCA recolectamos</h2>
            <p>
              BarberBooking <strong>no almacena, procesa, ni tiene acceso en ningún momento</strong> a números completos de
              tarjeta de crédito o débito, códigos de seguridad (CVV/CVC) ni fechas de vencimiento. La tokenización y el
              procesamiento de pagos se realiza directamente entre el navegador del Usuario y{' '}
              <strong>Wompi S.A.</strong>, pasarela de pagos vigilada por la Superintendencia Financiera de Colombia. Nuestros
              servidores únicamente reciben y almacenan un identificador de referencia (token de fuente de pago) que, por sí
              solo, no permite realizar transacciones ni representa información sensible.
            </p>

            <h2>4. Finalidad del tratamiento</h2>
            <p>Los datos personales recolectados se utilizan exclusivamente para:</p>
            <ul>
              <li>Crear y administrar la cuenta del Usuario y permitir la autenticación segura.</li>
              <li>Gestionar la agenda, reservas y comunicación entre Dueños de Barbería, barberos y Clientes.</li>
              <li>Procesar pagos y suscripciones a través de Wompi.</li>
              <li>Mostrar la página pública de la barbería a Clientes potenciales.</li>
              <li>Brindar soporte técnico y atender solicitudes de los Usuarios.</li>
              <li>Enviar comunicaciones relacionadas con el estado de la suscripción (vencimientos, fallos de cobro, renovaciones).</li>
              <li>Cumplir con obligaciones legales y prevenir fraude o uso indebido de la Plataforma.</li>
            </ul>
            <p>
              No utilizamos los datos personales de los Clientes finales con fines de publicidad o mercadeo directo no
              relacionados con la prestación del Servicio, salvo autorización expresa adicional.
            </p>

            <h2>5. Terceros y encargados del tratamiento</h2>
            <p>
              Para operar la Plataforma, compartimos datos estrictamente necesarios con los siguientes encargados del
              tratamiento, quienes están sujetos a sus propias políticas de privacidad y estándares de seguridad:
            </p>
            <table>
              <thead>
                <tr><th>Proveedor</th><th>Finalidad</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>Google (OAuth)</strong></td><td>Autenticación segura de la cuenta del Usuario.</td></tr>
                <tr><td><strong>Wompi</strong></td><td>Procesamiento de pagos, tokenización de tarjetas y cobros recurrentes.</td></tr>
                <tr><td><strong>Vercel</strong></td><td>Alojamiento (hosting) e infraestructura de la aplicación.</td></tr>
                <tr><td><strong>Supabase (PostgreSQL)</strong></td><td>Almacenamiento de la base de datos de la Plataforma.</td></tr>
                <tr><td><strong>Upstash (QStash)</strong></td><td>Ejecución de tareas automáticas programadas, como el cobro recurrente de suscripciones.</td></tr>
              </tbody>
            </table>
            <p>
              No vendemos, alquilamos ni comercializamos los datos personales de nuestros Usuarios a terceros con fines
              publicitarios.
            </p>

            <h2>6. Transferencia internacional de datos</h2>
            <p>
              Algunos de nuestros proveedores de infraestructura (como Vercel, Supabase, Google y Upstash) pueden almacenar o
              procesar datos en servidores ubicados fuera de Colombia. Al usar la Plataforma, el Usuario autoriza dicha
              transferencia internacional, la cual se realiza bajo estándares de seguridad adecuados conforme a la normativa
              vigente.
            </p>

            <h2>7. Derechos del Usuario (Habeas Data)</h2>
            <p>Conforme a la Ley 1581 de 2012, el Usuario tiene derecho a:</p>
            <ul>
              <li><strong>Acceder</strong> de forma gratuita a sus datos personales almacenados en la Plataforma.</li>
              <li><strong>Conocer, actualizar y rectificar</strong> su información personal cuando sea inexacta, incompleta o esté desactualizada.</li>
              <li><strong>Solicitar la supresión (cancelación)</strong> de sus datos personales cuando no exista un deber legal o contractual de conservarlos.</li>
              <li><strong>Revocar la autorización</strong> otorgada para el tratamiento de sus datos en cualquier momento.</li>
              <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la normativa de protección de datos.</li>
            </ul>
            <p>
              Para ejercer cualquiera de estos derechos, el Usuario puede escribir a{' '}
              <a href="mailto:barber.boking@gmail.com">barber.boking@gmail.com</a>, indicando claramente su solicitud. Daremos
              respuesta dentro de los plazos establecidos por la ley (máximo 10 días hábiles para consultas y 15 días hábiles
              para reclamos).
            </p>

            <h2>8. Conservación de los datos</h2>
            <p>
              Los datos personales se conservarán mientras la cuenta del Usuario permanezca activa y durante el tiempo
              adicional necesario para cumplir con obligaciones legales, contables, fiscales o de defensa ante reclamaciones.
              Una vez cumplida la finalidad del tratamiento y los plazos legales de conservación, los datos serán eliminados o
              anonimizados de forma segura.
            </p>

            <h2>9. Seguridad de la información</h2>
            <p>
              Implementamos medidas técnicas, administrativas y de seguridad razonables para proteger los datos personales
              contra acceso no autorizado, pérdida, alteración o divulgación indebida, incluyendo cifrado en tránsito (HTTPS),
              autenticación segura mediante Google OAuth, y delegación del procesamiento de pagos a una pasarela certificada
              (Wompi). No obstante, ningún sistema es completamente infalible, por lo que el Usuario también debe adoptar
              buenas prácticas de seguridad (contraseñas seguras, no compartir su acceso, etc.).
            </p>

            <h2>10. Datos de menores de edad</h2>
            <p>
              La Plataforma no está dirigida a menores de edad para la creación de cuentas de Dueño de Barbería. En caso de que
              un Cliente menor de edad reserve una cita, se entiende que dicha reserva se realiza con la supervisión o
              autorización de su representante legal.
            </p>

            <h2>11. Cookies y tecnologías similares</h2>
            <p>
              La Plataforma puede utilizar cookies técnicas y de sesión estrictamente necesarias para el funcionamiento de la
              autenticación y la navegación. No utilizamos cookies de seguimiento publicitario de terceros.
            </p>

            <h2>12. Cambios a esta política</h2>
            <p>
              Esta Política de Privacidad podrá ser actualizada en cualquier momento para reflejar cambios legales,
              operativos o tecnológicos. La fecha de &ldquo;última actualización&rdquo; en la parte superior de este documento
              indicará la versión vigente. Recomendamos al Usuario revisar esta página periódicamente.
            </p>

            <h2>13. Contacto</h2>
            <p>
              Para preguntas, solicitudes o reclamos relacionados con el tratamiento de sus datos personales, escríbanos a{' '}
              <a href="mailto:barber.boking@gmail.com">barber.boking@gmail.com</a> o use nuestro{' '}
              <Link href="/contacto">formulario de contacto</Link>.
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
