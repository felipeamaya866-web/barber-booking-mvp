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
            Esta Política de Privacidad describe cómo se recolectan, usan, almacenan y protegen los datos personales de los
            Usuarios de la plataforma BarberBooking, conforme a la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas de
            protección de datos personales vigentes en Colombia.
          </p>

          <div className="tc">

            <h2>1. Identificación del Responsable del Tratamiento</h2>
            <p>
              El responsable del tratamiento de los datos personales recolectados a través de la plataforma BarberBooking es:
            </p>
            <table>
              <tbody>
                <tr><td><strong>Nombre completo</strong></td><td>Jose Felipe Amaya Castro</td></tr>
                <tr><td><strong>Identificación</strong></td><td>Cédula de ciudadanía No. 1.000.518.235</td></tr>
                <tr><td><strong>Domicilio</strong></td><td>Bogotá, Colombia</td></tr>
                <tr><td><strong>Correo de contacto</strong></td><td><a href="mailto:barber.boking@gmail.com">barber.boking@gmail.com</a></td></tr>
                <tr><td><strong>Marca comercial bajo la cual opera</strong></td><td>BarberBooking</td></tr>
              </tbody>
            </table>
            <p>
              Jose Felipe Amaya Castro opera la plataforma BarberBooking como persona natural. Para cualquier consulta
              relacionada con el tratamiento de sus datos, puede escribir al correo indicado o usar nuestro{' '}
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
              procesamiento de pagos se realiza directamente entre el navegador del Usuario y <strong>Wompi S.A.</strong>,
              pasarela de pagos vigilada por la Superintendencia Financiera de Colombia. Nuestros servidores únicamente reciben
              y almacenan un identificador de referencia (token de fuente de pago) que, por sí solo, no permite realizar
              transacciones ni representa información sensible.
            </p>

            <h2>4. Finalidad del tratamiento</h2>
            <p>Los datos personales recolectados se utilizan exclusivamente para:</p>
            <ul>
              <li>Crear y administrar la cuenta del Usuario y permitir la autenticación segura.</li>
              <li>Gestionar la agenda, reservas y comunicación entre Dueños de Barbería, Barberos y Clientes.</li>
              <li>Procesar pagos y suscripciones a través de Wompi.</li>
              <li>Mostrar la página pública de la barbería a Clientes potenciales.</li>
              <li>Brindar soporte técnico y atender solicitudes de los Usuarios.</li>
              <li>Enviar comunicaciones operativas relacionadas con el estado de la suscripción (vencimientos, fallos de cobro, renovaciones).</li>
              <li>Cumplir con obligaciones legales y prevenir fraude o uso indebido de la Plataforma.</li>
            </ul>
            <p>
              <strong>Consentimiento separado para mercadeo:</strong> las finalidades anteriores corresponden al tratamiento
              necesario para prestar el Servicio. Si en el futuro BarberBooking desea enviar comunicaciones de mercadeo,
              promocionales o publicitarias (por ejemplo, mensajes de WhatsApp o correos promocionales) distintas de las
              notificaciones operativas del Servicio, solicitará una autorización expresa y separada para dicha finalidad,
              la cual el Usuario podrá otorgar o negar independientemente de su aceptación de esta política, y podrá revocar
              en cualquier momento.
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
              El Operador se compromete a formalizar y mantener acuerdos o cláusulas contractuales de tratamiento de datos
              con cada uno de estos encargados, conforme al artículo 17 de la Ley 1581 de 2012, en la medida en que dichos
              proveedores los ofrezcan dentro de sus propios términos de servicio. Si en el futuro se incorpora un nuevo
              proveedor que trate datos personales (por ejemplo, una plataforma de mensajería para notificaciones de
              WhatsApp), esta política será actualizada antes de activar dicha funcionalidad para incluirlo expresamente en
              esta tabla.
            </p>
            <p>
              No vendemos, alquilamos ni comercializamos los datos personales de nuestros Usuarios a terceros con fines
              publicitarios.
            </p>
            <h3>5.1 Acceso interno a los datos</h3>
            <p>
              Actualmente, el único responsable con acceso administrativo directo a los datos personales almacenados en la
              Plataforma es Jose Felipe Amaya Castro, como Operador. En la medida en que el equipo crezca y se incorpore
              personal adicional, el acceso a los datos personales se limitará estrictamente a quienes lo requieran para el
              desempeño de sus funciones, bajo obligaciones de confidencialidad.
            </p>

            <h2>6. Transferencia internacional de datos</h2>
            <p>
              Los proveedores de infraestructura mencionados en la sección 5 (Vercel, Supabase, Upstash y Google) almacenan o
              procesan datos en servidores ubicados principalmente en <strong>Estados Unidos</strong>, país que a la fecha no
              cuenta con una declaración de nivel adecuado de protección de datos por parte de la Superintendencia de
              Industria y Comercio de Colombia.
            </p>
            <p>
              En consecuencia, al crear una cuenta en la Plataforma, se solicitará al Usuario una{' '}
              <strong>autorización expresa, previa e informada</strong> para la transferencia internacional de sus datos
              personales hacia dichos países, de forma separada e independiente a la aceptación general de esta política,
              mediante un mecanismo de confirmación específico (casilla de autorización) durante el proceso de registro. Sin
              dicha autorización expresa, no será posible completar el registro, dado que el funcionamiento de la Plataforma
              depende necesariamente de dicha infraestructura.
            </p>

            <h2>7. Registro Nacional de Bases de Datos (RNBD)</h2>
            <p>
              Conforme al Decreto 90 de 2018, las bases de datos personales tratadas por responsables que no clasifiquen como
              microempresa, o que superen los umbrales de activos definidos por la Superintendencia de Industria y Comercio,
              deben inscribirse en el Registro Nacional de Bases de Datos (RNBD). A la fecha de esta actualización, el
              Operador trata las bases de datos de BarberBooking como persona natural que no constituye una persona jurídica
              ni supera el umbral de 100.000 UVT en activos, por lo cual se encuentra dentro de la exención de microempresa
              prevista en la normativa vigente y, en consecuencia, <strong>no ha registrado aún sus bases de datos en el
              RNBD</strong>. El Operador se compromete a verificar periódicamente su situación frente a esta obligación y a
              realizar el registro correspondiente si en el futuro deja de calificar para dicha exención.
            </p>

            <h2>8. Derechos del Usuario (Habeas Data)</h2>
            <p>Conforme a los artículos 8 y 9 de la Ley 1581 de 2012, el Usuario, como titular de los datos, tiene derecho a:</p>
            <ul>
              <li><strong>Acceder</strong> de forma gratuita a sus datos personales almacenados en la Plataforma.</li>
              <li><strong>Conocer, actualizar y rectificar</strong> su información personal cuando sea inexacta, incompleta o esté desactualizada.</li>
              <li><strong>Solicitar la supresión (cancelación)</strong> de sus datos personales cuando no exista un deber legal o contractual de conservarlos.</li>
              <li><strong>Revocar la autorización</strong> otorgada para el tratamiento de sus datos en cualquier momento.</li>
              <li><strong>Solicitar prueba de la autorización</strong> otorgada al Operador para el tratamiento de sus datos personales.</li>
              <li><strong>Ser informado</strong>, previa solicitud, sobre el uso que se le ha dado a sus datos personales.</li>
              <li><strong>Solicitar la portabilidad</strong> de sus datos personales, es decir, recibir en un formato electrónico de uso común (por ejemplo, CSV o JSON) la información de su negocio, servicios y agenda almacenada en la Plataforma, para facilitar su traslado a otro proveedor si decide dejar de usar BarberBooking.</li>
              <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la normativa de protección de datos.</li>
            </ul>
            <p>
              Para ejercer cualquiera de estos derechos, el Usuario puede escribir a{' '}
              <a href="mailto:barber.boking@gmail.com">barber.boking@gmail.com</a>, indicando claramente su solicitud. Daremos
              respuesta dentro de los plazos establecidos por la ley (máximo 10 días hábiles para consultas y 15 días hábiles
              para reclamos, incluyendo solicitudes de portabilidad).
            </p>

            <h2>9. Conservación de los datos</h2>
            <p>
              Los datos personales de Dueños de Barbería y Barberos con cuenta registrada se conservarán mientras dicha cuenta
              permanezca activa y durante el tiempo adicional necesario para cumplir con obligaciones legales, contables,
              fiscales o de defensa ante reclamaciones, tras lo cual serán eliminados o anonimizados de forma segura.
            </p>
            <p>
              Los datos de <strong>Clientes que reservan citas como invitados</strong>, sin crear una cuenta, se conservarán
              por un período de <strong>dos (2) años</strong> contados desde la fecha de su última cita registrada en la
              Plataforma, salvo que exista una obligación legal, contable o fiscal que exija un plazo de conservación mayor, o
              que el Cliente solicite su eliminación anticipada conforme a la sección 8.
            </p>

            <h2>10. Seguridad de la información</h2>
            <p>
              Implementamos medidas técnicas, administrativas y de seguridad razonables para proteger los datos personales
              contra acceso no autorizado, pérdida, alteración o divulgación indebida, incluyendo cifrado en tránsito (HTTPS),
              autenticación segura mediante Google OAuth, y delegación del procesamiento de pagos a una pasarela certificada
              (Wompi). No obstante, ningún sistema es completamente infalible, por lo que el Usuario también debe adoptar
              buenas prácticas de seguridad (contraseñas seguras, no compartir su acceso, etc.).
            </p>

            <h2>11. Notificación de incidentes de seguridad</h2>
            <p>
              En caso de que se detecte una vulneración a la seguridad de los códigos o sistemas de información que comprometa
              la confidencialidad, integridad o disponibilidad de los datos personales de los Usuarios (por ejemplo, acceso no
              autorizado a la base de datos), el Operador se compromete a:
            </p>
            <ul>
              <li>Notificar a la Superintendencia de Industria y Comercio dentro de los plazos que establezca la normativa vigente una vez tenga conocimiento del incidente.</li>
              <li>Notificar a los Usuarios cuyos datos personales se vean razonablemente afectados, dentro de un plazo no mayor a setenta y dos (72) horas desde que el Operador tenga conocimiento confirmado del incidente, indicando la naturaleza de la vulneración y las medidas adoptadas.</li>
              <li>Adoptar de forma inmediata las medidas correctivas necesarias para contener y mitigar el incidente.</li>
            </ul>

            <h2>12. Datos de menores de edad</h2>
            <h3>12.1 Clientes menores de edad</h3>
            <p>
              La funcionalidad de reserva de citas no está dirigida a niños, niñas o adolescentes que actúen sin la
              supervisión de su representante legal. BarberBooking no solicita ni verifica activamente la edad de quien
              reserva una cita como invitado, dado que solo se recolecta nombre y teléfono con esa finalidad específica. Si el
              Operador tiene conocimiento o motivos razonables para creer que se recolectaron datos de un menor de edad sin la
              autorización de su representante legal, procederá a eliminar dichos datos a la mayor brevedad posible, ya sea de
              oficio o a solicitud del representante legal a través del <Link href="/contacto">formulario de contacto</Link>.
            </p>
            <h3>12.2 Barberos adolescentes</h3>
            <p>
              En caso de que un Dueño de Barbería vincule a través de la Plataforma a un Barbero adolescente (16 o 17 años) en
              calidad de aprendiz u otra figura permitida por la legislación laboral colombiana, el tratamiento de sus datos
              personales se realizará respetando su interés superior, y el Dueño de Barbería que lo invite será responsable de
              contar con las autorizaciones del Ministerio del Trabajo y de su representante legal que exija la ley para dicha
              vinculación.
            </p>

            <h2>13. Consecuencias de no proporcionar los datos solicitados</h2>
            <p>
              Algunos datos personales son indispensables para la prestación del Servicio. En particular: (a) si un Dueño de
              Barbería no proporciona la información básica de su negocio, no podrá publicar su página pública; (b) si no
              registra un método de pago válido conforme a la sección 6.6 de los Términos y Condiciones, no podrá iniciar o
              mantener activo el período de prueba ni su suscripción; y (c) si un Cliente no proporciona al menos su nombre y
              número de teléfono, no será posible confirmar ni gestionar su reserva.
            </p>

            <h2>14. Cookies y tecnologías similares</h2>
            <p>
              Actualmente, la Plataforma utiliza únicamente las siguientes cookies y tecnologías de almacenamiento local,
              estrictamente necesarias para su funcionamiento:
            </p>
            <table>
              <thead>
                <tr><th>Cookie / tecnología</th><th>Propósito</th><th>Duración</th></tr>
              </thead>
              <tbody>
                <tr><td><code>next-auth.session-token</code></td><td>Mantener la sesión autenticada del Usuario</td><td>Hasta cierre de sesión o expiración (sesión)</td></tr>
                <tr><td><code>next-auth.csrf-token</code></td><td>Protección contra ataques de falsificación de solicitudes (CSRF)</td><td>Sesión</td></tr>
              </tbody>
            </table>
            <p>
              No utilizamos cookies de seguimiento publicitario de terceros. Si en el futuro incorporamos herramientas de
              analítica (por ejemplo, Google Analytics o Vercel Analytics) u otras tecnologías que impliquen el uso de cookies
              o identificadores adicionales, esta sección será actualizada para listarlas expresamente antes de su activación,
              indicando su propósito y duración específicos.
            </p>

            <h2>15. Cambios a esta política</h2>
            <p>
              Esta Política de Privacidad podrá ser actualizada en cualquier momento para reflejar cambios legales,
              operativos o tecnológicos. La fecha de &ldquo;última actualización&rdquo; en la parte superior de este documento
              indicará la versión vigente. Recomendamos al Usuario revisar esta página periódicamente.
            </p>

            <h2>16. Contacto</h2>
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
