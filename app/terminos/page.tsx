// app/terminos/page.tsx
import Link from 'next/link';

export const metadata = { title: 'Términos y Condiciones · BarberBooking' };

export default function TerminosPage() {
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
      `}</style>

      <div style={{ minHeight: '100vh', padding: '64px 24px 100px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          <Link href="/" style={{ color: 'rgba(245,240,232,0.5)', textDecoration: 'none', fontSize: 14 }}>← Volver al inicio</Link>

          <h1 style={{ fontSize: 'clamp(30px,5vw,40px)', fontWeight: 900, marginTop: 24, marginBottom: 8 }}>
            Términos y <span style={{ color: '#C9A84C' }}>Condiciones</span>
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.4)', marginBottom: 8 }}>
            Última actualización: 16 de junio de 2026
          </p>
          <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.4)', marginBottom: 32 }}>
            Vigentes para el uso de la plataforma BarberBooking (en adelante, &ldquo;la Plataforma&rdquo;, &ldquo;el Servicio&rdquo; o &ldquo;nosotros&rdquo;).
          </p>

          <div className="tc">

            <h2>1. Aceptación de los términos</h2>
            <p>
              Al acceder, registrarse o utilizar BarberBooking, usted (en adelante &ldquo;el Usuario&rdquo;) acepta de forma expresa,
              libre e informada los presentes Términos y Condiciones (en adelante &ldquo;los Términos&rdquo;), así como nuestra
              Política de Privacidad. Si no está de acuerdo con alguna disposición de estos Términos, debe abstenerse de usar la
              Plataforma. El uso continuado del Servicio después de la publicación de modificaciones constituye la aceptación de
              dichas modificaciones.
            </p>
            <p>
              Si el Usuario actúa en representación de una persona jurídica o de un establecimiento de comercio (barbería),
              declara contar con la facultad suficiente para vincular a dicha entidad a estos Términos.
            </p>

            <h2>2. Descripción del servicio</h2>
            <p>
              BarberBooking es una plataforma tecnológica tipo Software as a Service (SaaS) que permite a propietarios de
              barberías y negocios de barbería (en adelante &ldquo;Dueños de Barbería&rdquo;):
            </p>
            <ul>
              <li>Crear una página pública personalizable para su negocio.</li>
              <li>Gestionar una agenda de citas, servicios, precios y equipo de barberos.</li>
              <li>Recibir reservas en línea realizadas por clientes finales (en adelante &ldquo;Clientes&rdquo;).</li>
              <li>Acceder a estadísticas básicas de su negocio.</li>
              <li>Contratar planes de suscripción con distintos niveles de funcionalidad.</li>
            </ul>
            <p>
              BarberBooking actúa exclusivamente como un intermediario tecnológico que facilita la conexión entre Dueños de
              Barbería y Clientes. <strong>No prestamos servicios de barbería, no empleamos barberos y no somos parte de la
              relación comercial o de prestación de servicios</strong> que se genere entre el Dueño de Barbería y el Cliente como
              consecuencia del uso de la Plataforma.
            </p>

            <h2>3. Registro de cuenta</h2>
            <p>
              Para acceder a las funcionalidades de gestión, el Dueño de Barbería debe registrarse mediante autenticación con
              Google, proporcionando información veraz, actual y completa. El Usuario es el único responsable de mantener la
              confidencialidad de las credenciales de acceso a su cuenta y de toda actividad que ocurra bajo la misma.
            </p>
            <p>
              El Usuario debe ser mayor de edad (18 años o más) o, en caso de ser menor, contar con la autorización de su
              representante legal, conforme a la legislación aplicable en su jurisdicción.
            </p>
            <p>
              BarberBooking se reserva el derecho de suspender o cancelar cuentas que proporcionen información falsa, incompleta,
              o que se utilicen de forma fraudulenta o contraria a estos Términos.
            </p>

            <h2>4. Planes, precios y período de prueba</h2>
            <h3>4.1 Planes disponibles</h3>
            <p>
              BarberBooking ofrece distintos planes de suscripción (actualmente denominados Lite, Prime y Elite), cada uno con
              límites diferenciados de número de barberos, fotografías en galería y funcionalidades, según se describa en la
              sección de Planes de la Plataforma al momento de la contratación. Los precios se muestran en pesos colombianos
              (COP) e incluyen los impuestos aplicables según la normativa vigente, salvo que se indique lo contrario.
            </p>
            <h3>4.2 Período de prueba gratuito</h3>
            <p>
              Los nuevos Dueños de Barbería que registren un método de pago válido tienen derecho a un período de prueba gratuito
              de <strong>catorce (14) días calendario</strong>, contados a partir del momento del registro de la tarjeta. Durante
              este período no se realiza ningún cobro. El período de prueba gratuito solo aplica <strong>una vez por barbería</strong>;
              si una suscripción ya hizo uso del período de prueba con anterioridad, cualquier reactivación posterior implicará el
              cobro inmediato y total del plan seleccionado, sin derecho a un nuevo período de prueba.
            </p>
            <h3>4.3 Facturación recurrente automática</h3>
            <p>
              Al finalizar el período de prueba, y salvo que el Usuario haya cancelado la renovación automática con anterioridad,
              se realizará el cobro automático del valor correspondiente al plan seleccionado a la tarjeta de crédito o débito
              registrada. A partir de dicho cobro, la suscripción se renueva automáticamente cada treinta (30) días mediante
              cobros recurrentes a la misma tarjeta, hasta que el Usuario cancele la suscripción conforme a la sección 6.
            </p>
            <h3>4.4 Cambios de plan</h3>
            <p>
              El Usuario puede cambiar de plan en cualquier momento desde la Plataforma. Los cambios de plan aplicarán a partir
              del siguiente ciclo de cobro, ajustando el valor y los límites de funcionalidad correspondientes.
            </p>
            <h3>4.5 Modificación de precios</h3>
            <p>
              BarberBooking podrá modificar el valor de los planes en cualquier momento. Cualquier incremento de precio será
              notificado al Usuario con una antelación razonable y solo aplicará a partir del siguiente ciclo de facturación; en
              ningún caso se aplicarán retroactivamente a períodos ya facturados.
            </p>

            <h2>5. Procesamiento de pagos</h2>
            <p>
              Todos los pagos y la tokenización de tarjetas son procesados a través de <strong>Wompi</strong>, una pasarela de
              pagos autorizada y vigilada por la Superintendencia Financiera de Colombia. BarberBooking{' '}
              <strong>no almacena, procesa ni tiene acceso en ningún momento a los números completos de tarjeta, códigos de
              seguridad (CVV/CVC) ni fechas de vencimiento</strong> de los métodos de pago registrados. Dicha información es
              capturada y gestionada directamente por Wompi conforme a los más altos estándares de seguridad de la industria
              (PCI-DSS).
            </p>
            <p>
              BarberBooking únicamente almacena un identificador de referencia de la fuente de pago (token de uso interno),
              que no constituye información sensible ni permite, por sí solo, realizar transacciones fuera de la infraestructura
              de Wompi.
            </p>
            <p>
              El Usuario es responsable de mantener actualizada la información de su método de pago y de garantizar que la
              tarjeta registrada cuente con fondos suficientes y esté habilitada para compras y pagos recurrentes en línea.
              BarberBooking no es responsable por rechazos de transacciones originados por el banco emisor, fondos
              insuficientes, bloqueos del producto financiero o restricciones impuestas por la entidad bancaria del Usuario.
            </p>

            <h2>6. Cancelación y reembolsos</h2>
            <h3>6.1 Cancelación por el Usuario</h3>
            <p>
              El Usuario puede cancelar la renovación automática de su suscripción en cualquier momento desde la sección de
              Planes de la Plataforma. Al cancelar, se elimina el cobro automático futuro, pero el Usuario conserva el acceso a
              las funcionalidades del plan hasta el final del período ya pagado o, si se encuentra en período de prueba, hasta
              el vencimiento de dicho período.
            </p>
            <h3>6.2 Período de gracia ante fallos de cobro</h3>
            <p>
              Si un cobro recurrente es rechazado, BarberBooking otorgará un período de gracia de tres (3) días calendario,
              durante el cual reintentará el cobro automáticamente y notificará al Usuario para que actualice su método de pago.
              Si transcurrido dicho período el cobro no se ha podido realizar exitosamente, la suscripción quedará{' '}
              <strong>suspendida (estado &ldquo;vencida&rdquo;)</strong> y el Usuario perderá el acceso al panel de administración
              de su barbería hasta que regularice su situación.
            </p>
            <h3>6.3 Política de reembolsos</h3>
            <p>
              Salvo que la ley aplicable disponga lo contrario, los pagos realizados por períodos de suscripción ya iniciados{' '}
              <strong>no son reembolsables</strong>, incluyendo en los casos en que el Usuario decida cancelar antes de que
              finalice el ciclo de facturación vigente. No obstante, conforme a la legislación colombiana de protección al
              consumidor, el Usuario podrá ejercer su derecho de retracto dentro de los cinco (5) días hábiles siguientes a la
              contratación inicial del Servicio, cuando dicho derecho resulte aplicable según la normativa vigente.
            </p>

            <h2>7. Obligaciones del Dueño de Barbería</h2>
            <p>El Dueño de Barbería se compromete a:</p>
            <ul>
              <li>Proporcionar información veraz, actualizada y completa sobre su negocio, servicios, precios y disponibilidad.</li>
              <li>Cumplir con las citas confirmadas a través de la Plataforma o notificar oportunamente cualquier cambio o cancelación a sus Clientes.</li>
              <li>Contar con los permisos, licencias y autorizaciones legales necesarias para operar su negocio de barbería conforme a la normativa local.</li>
              <li>No utilizar la Plataforma para fines fraudulentos, ilícitos o contrarios a la moral y las buenas costumbres.</li>
              <li>Respetar los derechos de privacidad de sus Clientes y utilizar la información obtenida a través de la Plataforma exclusivamente para la prestación del servicio de barbería.</li>
              <li>Mantener la confidencialidad y seguridad de las credenciales de acceso otorgadas a los barberos vinculados a su cuenta.</li>
            </ul>

            <h2>8. Obligaciones del Cliente final</h2>
            <p>Los Clientes que reserven citas a través de la Plataforma se comprometen a:</p>
            <ul>
              <li>Proporcionar datos de contacto veraces al momento de realizar una reserva.</li>
              <li>Asistir a las citas reservadas o cancelarlas con razonable anticipación.</li>
              <li>Utilizar la Plataforma de forma respetuosa, sin generar reservas falsas, duplicadas o de mala fe.</li>
            </ul>

            <h2>9. Limitación de responsabilidad</h2>
            <p>
              BarberBooking pone a disposición la infraestructura tecnológica para la gestión y reserva de citas, pero no
              garantiza la calidad, idoneidad, puntualidad o resultado de los servicios de barbería prestados por los Dueños de
              Barbería. Cualquier controversia relacionada con la prestación del servicio de barbería en sí (calidad del corte,
              incumplimiento de horarios, trato al Cliente, entre otros) deberá resolverse directamente entre el Cliente y el
              Dueño de Barbería correspondiente, sin que BarberBooking asuma responsabilidad alguna al respecto.
            </p>
            <p>
              En la máxima medida permitida por la ley, BarberBooking no será responsable por daños indirectos, incidentales,
              especiales, consecuenciales o lucro cesante derivados del uso o la imposibilidad de uso de la Plataforma,
              incluyendo, sin limitarse a, interrupciones del servicio, pérdida de datos, fallas técnicas de terceros
              (incluyendo Wompi, Google, Vercel u otros proveedores de infraestructura) o fallos en el procesamiento de pagos.
            </p>
            <p>
              La responsabilidad total de BarberBooking frente al Usuario, en cualquier caso, se limitará al valor efectivamente
              pagado por el Usuario en los últimos tres (3) meses de suscripción.
            </p>

            <h2>10. Disponibilidad del servicio</h2>
            <p>
              BarberBooking procura mantener la Plataforma disponible de forma continua, pero no garantiza un funcionamiento
              ininterrumpido o libre de errores. Podrán existir interrupciones programadas o no programadas por mantenimiento,
              actualizaciones, causas de fuerza mayor o fallas de proveedores de infraestructura externos. BarberBooking no será
              responsable por pérdidas derivadas de dichas interrupciones.
            </p>

            <h2>11. Propiedad intelectual</h2>
            <p>
              Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo su software, diseño, marca, logotipos
              y contenidos propios, son titularidad exclusiva de BarberBooking. Se concede al Usuario una licencia limitada, no
              exclusiva, intransferible y revocable para el uso del Servicio conforme a estos Términos. El contenido cargado por
              el Dueño de Barbería (fotografías, descripciones, logotipos) permanece de su propiedad, otorgando a BarberBooking
              una licencia para exhibirlo dentro de la Plataforma con el único fin de prestar el Servicio.
            </p>

            <h2>12. Protección de datos personales</h2>
            <p>
              El tratamiento de los datos personales de Dueños de Barbería, barberos y Clientes se rige por nuestra Política de
              Privacidad y por la Ley 1581 de 2012 y demás normas concordantes sobre protección de datos personales en Colombia.
              Al usar la Plataforma, el Usuario autoriza el tratamiento de sus datos personales conforme a dicha política.
            </p>

            <h2>13. Modificaciones a los Términos</h2>
            <p>
              BarberBooking podrá modificar estos Términos en cualquier momento. Las modificaciones serán publicadas en esta
              misma página, indicando la fecha de última actualización. El uso continuado del Servicio después de la publicación
              de cambios constituye la aceptación de los nuevos Términos. Si los cambios son sustanciales, se procurará notificar
              al Usuario por correo electrónico o mediante avisos dentro de la Plataforma.
            </p>

            <h2>14. Terminación</h2>
            <p>
              BarberBooking podrá suspender o terminar el acceso de un Usuario a la Plataforma, sin previo aviso, en caso de
              incumplimiento de estos Términos, uso fraudulento, impago reiterado o cualquier conducta que ponga en riesgo la
              seguridad o el correcto funcionamiento del Servicio. El Usuario podrá terminar su relación con BarberBooking en
              cualquier momento cancelando su suscripción conforme a la sección 6.
            </p>

            <h2>15. Ley aplicable y jurisdicción</h2>
            <p>
              Estos Términos se rigen por las leyes de la República de Colombia. Cualquier controversia derivada de la
              interpretación, ejecución o cumplimiento de los presentes Términos será sometida a los jueces y tribunales
              competentes de la República de Colombia, sin perjuicio de los mecanismos de protección al consumidor disponibles
              ante la Superintendencia de Industria y Comercio (SIC).
            </p>

            <h2>16. Contacto</h2>
            <p>
              Para preguntas, solicitudes o reclamos relacionados con estos Términos, el Usuario puede comunicarse a través de
              nuestro <Link href="/contacto">formulario de contacto</Link> o escribiendo directamente a{' '}
              <a href="mailto:barber.boking@gmail.com">barber.boking@gmail.com</a>.
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
