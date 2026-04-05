// app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [slug, setSlug] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);

  // ✅ Redirigir según rol si ya tiene sesión
  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as { role?: string })?.role;
      if (role === 'BARBER') router.replace('/barber/dashboard');
      else router.replace('/barbershop');
    }
  }, [status, session, router]);

  // ✅ Observer con delay para que el DOM esté listo
  useEffect(() => {
    if (status === 'authenticated' || status === 'loading') return;
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
          });
        },
        { threshold: 0.1 }
      );
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }, 150);
    return () => clearTimeout(timer);
  }, [status]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (slug.trim()) router.push(`/b/${slug.trim().toLowerCase()}`);
  }

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #C9A84C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --gold: #C9A84C; --gold-lt: #E8C96A; --gold-dk: #8B6914;
          --black: #080808; --gray-1: #111111; --gray-2: #1A1A1A;
          --gray-3: #2A2A2A; --gray-4: #555555; --white: #F5F0E8;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--black); color: var(--white); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
        h1, h2, h3 { font-family: 'Playfair Display', serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
        @keyframes scrollPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

        body::before {
          content: ''; position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 9999; opacity: 0.4;
        }

        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 20px 48px; display: flex; align-items: center; justify-content: space-between; background: linear-gradient(to bottom, rgba(8,8,8,0.95), transparent); backdrop-filter: blur(8px); }
        .logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .logo-icon { width: 42px; height: 42px; background: linear-gradient(135deg, var(--gold), var(--gold-dk)); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 0 20px rgba(201,168,76,0.3); }
        .logo-text { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--white); }
        .logo-text span { color: var(--gold); }
        .nav-links { display: flex; align-items: center; gap: 36px; list-style: none; }
        .nav-links a { color: rgba(245,240,232,0.6); text-decoration: none; font-size: 14px; transition: color 0.2s; }
        .nav-links a:hover { color: var(--white); }
        .nav-cta { background: linear-gradient(135deg, var(--gold), var(--gold-dk)); color: var(--black) !important; padding: 10px 24px !important; border-radius: 8px; font-weight: 500 !important; }

        .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; padding: 120px 24px 80px; }
        .hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(201,168,76,0.05) 0%, transparent 50%); }
        .hero-lines { position: absolute; inset: 0; background-image: linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse at center, black 20%, transparent 80%); }
        .hero-content { position: relative; text-align: center; max-width: 820px; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25); padding: 6px 16px; border-radius: 999px; font-size: 12px; color: var(--gold); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 32px; animation: fadeDown 0.8s ease both; }
        .hero-title { font-size: clamp(48px, 8vw, 96px); font-weight: 900; line-height: 1.0; letter-spacing: -2px; margin-bottom: 24px; animation: fadeUp 0.8s 0.1s ease both; }
        .hero-title .gold { color: var(--gold); }
        .hero-title .outline { -webkit-text-stroke: 1px rgba(245,240,232,0.3); color: transparent; }
        .hero-sub { font-size: 18px; color: rgba(245,240,232,0.55); font-weight: 300; max-width: 520px; margin: 0 auto 48px; line-height: 1.7; animation: fadeUp 0.8s 0.2s ease both; }
        .hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; animation: fadeUp 0.8s 0.3s ease both; }
        .hero-scroll { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; opacity: 0.4; animation: fadeUp 1s 0.8s ease both; }
        .scroll-line { width: 1px; height: 48px; background: linear-gradient(to bottom, transparent, var(--gold)); animation: scrollPulse 2s infinite; }

        .btn-primary { background: linear-gradient(135deg, var(--gold-lt), var(--gold-dk)); color: var(--black); padding: 16px 36px; border-radius: 10px; font-weight: 600; font-size: 15px; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 8px 32px rgba(201,168,76,0.25); border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; display: inline-block; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(201,168,76,0.35); }
        .btn-secondary { background: transparent; color: var(--white); padding: 16px 36px; border-radius: 10px; font-weight: 400; font-size: 15px; text-decoration: none; border: 1px solid rgba(245,240,232,0.15); transition: border-color 0.2s, background 0.2s; cursor: pointer; font-family: 'DM Sans', sans-serif; display: inline-block; }
        .btn-secondary:hover { border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.05); }

        .stats { padding: 60px 48px; border-top: 1px solid rgba(201,168,76,0.1); border-bottom: 1px solid rgba(201,168,76,0.1); display: grid; grid-template-columns: repeat(4, 1fr); }
        .stat { text-align: center; padding: 24px; border-right: 1px solid rgba(201,168,76,0.1); }
        .stat:last-child { border-right: none; }
        .stat-number { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 700; color: var(--gold); line-height: 1; margin-bottom: 8px; }
        .stat-label { font-size: 13px; color: rgba(245,240,232,0.45); }

        section { padding: 100px 48px; max-width: 1200px; margin: 0 auto; }
        .section-tag { font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold); margin-bottom: 16px; display: block; }
        .section-title { font-size: clamp(32px, 4vw, 52px); font-weight: 700; line-height: 1.15; letter-spacing: -1px; margin-bottom: 20px; }
        .section-sub { font-size: 16px; color: rgba(245,240,232,0.5); font-weight: 300; line-height: 1.7; max-width: 480px; }

        .paths { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 64px; }
        .path-card { background: var(--gray-1); border: 1px solid var(--gray-3); border-radius: 20px; padding: 48px; position: relative; overflow: hidden; transition: border-color 0.3s, transform 0.3s; text-decoration: none; display: block; }
        .path-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at top left, rgba(201,168,76,0.08), transparent 60%); opacity: 0; transition: opacity 0.3s; }
        .path-card:hover { border-color: rgba(201,168,76,0.4); transform: translateY(-4px); }
        .path-card:hover::before { opacity: 1; }
        .path-icon { width: 64px; height: 64px; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 28px; }
        .path-title { font-size: 28px; font-weight: 700; margin-bottom: 12px; color: var(--white); }
        .path-desc { font-size: 15px; color: rgba(245,240,232,0.5); line-height: 1.6; margin-bottom: 32px; }
        .path-features { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 36px; }
        .path-features li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: rgba(245,240,232,0.7); }
        .path-features li::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--gold); flex-shrink: 0; }
        .path-cta { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: var(--gold); }

        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 64px; background: var(--gray-3); border-radius: 20px; overflow: hidden; }
        .feature { background: var(--gray-1); padding: 40px 36px; transition: background 0.2s; }
        .feature:hover { background: var(--gray-2); }
        .feature-icon { font-size: 32px; margin-bottom: 20px; display: block; }
        .feature-title { font-size: 18px; font-weight: 600; margin-bottom: 10px; color: var(--white); font-family: 'Playfair Display', serif; }
        .feature-desc { font-size: 14px; color: rgba(245,240,232,0.45); line-height: 1.6; }

        .steps { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 64px; position: relative; }
        .steps::before { content: ''; position: absolute; top: 28px; left: 12.5%; right: 12.5%; height: 1px; background: linear-gradient(to right, transparent, var(--gold-dk), var(--gold), var(--gold-dk), transparent); }
        .step { text-align: center; padding: 0 24px; }
        .step-num { width: 56px; height: 56px; background: var(--black); border: 1px solid rgba(201,168,76,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--gold); margin: 0 auto 24px; position: relative; z-index: 1; }
        .step-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; color: var(--white); }
        .step-desc { font-size: 13px; color: rgba(245,240,232,0.4); line-height: 1.6; }

        .cta-section { padding: 100px 48px; text-align: center; position: relative; overflow: hidden; }
        .cta-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(201,168,76,0.07), transparent 70%); }
        .cta-box { position: relative; max-width: 680px; margin: 0 auto; background: var(--gray-1); border: 1px solid rgba(201,168,76,0.2); border-radius: 28px; padding: 72px 56px; }
        .cta-title { font-size: clamp(32px, 4vw, 52px); font-weight: 900; letter-spacing: -1.5px; margin-bottom: 16px; line-height: 1.1; }
        .cta-sub { font-size: 16px; color: rgba(245,240,232,0.5); margin-bottom: 40px; line-height: 1.6; }

        footer { border-top: 1px solid var(--gray-3); padding: 40px 48px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        footer p { font-size: 13px; color: rgba(245,240,232,0.3); }
        .footer-links { display: flex; gap: 24px; list-style: none; }
        .footer-links a { font-size: 13px; color: rgba(245,240,232,0.3); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--gold); }

        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.visible { opacity: 1; transform: none; }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }

        @media (max-width: 768px) {
          nav { padding: 16px 20px; }
          .nav-links { display: none; }
          section { padding: 72px 20px; }
          .stats { grid-template-columns: repeat(2, 1fr); padding: 40px 20px; }
          .stat { border-right: none; border-bottom: 1px solid rgba(201,168,76,0.1); }
          .paths { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .steps { grid-template-columns: repeat(2, 1fr); gap: 40px; }
          .steps::before { display: none; }
          .cta-box { padding: 48px 28px; }
          footer { flex-direction: column; text-align: center; padding: 32px 20px; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav>
        <a href="#" className="logo">
          <div className="logo-icon">✂️</div>
          <span className="logo-text">Barber<span>Booking</span></span>
        </a>
        <ul className="nav-links">
          <li><a href="#como-funciona">Cómo funciona</a></li>
          <li><a href="#caracteristicas">Características</a></li>
          <li><a href="#para-ti">Para ti</a></li>
          <li><a href="/login" className="nav-cta">Iniciar sesión</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <div className="hero" ref={heroRef}>
        <div className="hero-bg" />
        <div className="hero-lines" />
        <div className="hero-content">
          <div className="hero-badge">✦ La plataforma de barberías #1 en Colombia</div>
          <h1 className="hero-title">
            El futuro de las<br />
            <span className="gold">barberías</span>{' '}
            <span className="outline">modernas</span>
          </h1>
          <p className="hero-sub">Gestiona tu barbería, recibe reservas 24/7 y haz crecer tu negocio con la plataforma más completa del mercado.</p>
          <div className="hero-actions">
            <a href="/login" className="btn-primary">Registra tu barbería →</a>
            <a href="#para-ti" className="btn-secondary">Reservar una cita</a>
          </div>
        </div>
        <div className="hero-scroll"><div className="scroll-line" /></div>
      </div>

      {/* STATS */}
      <div className="stats reveal">
        {[
          { number: '500+', label: 'Barberías activas' },
          { number: '12K+', label: 'Citas al mes' },
          { number: '98%',  label: 'Clientes satisfechos' },
          { number: '24/7', label: 'Reservas online' },
        ].map(s => (
          <div key={s.label} className="stat">
            <div className="stat-number">{s.number}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* PARA TI */}
      <section id="para-ti">
        <span className="section-tag reveal">¿Quién eres?</span>
        <h2 className="section-title reveal">Diseñado para<br />cada parte del negocio</h2>
        <p className="section-sub reveal">Tanto si eres dueño de una barbería como si buscas el mejor corte, BarberBooking tiene lo que necesitas.</p>
        <div className="paths">
          <a href="/login" className="path-card reveal">
            <div className="path-icon">💼</div>
            <h3 className="path-title">Soy dueño de barbería</h3>
            <p className="path-desc">Administra tu negocio, gestiona tu equipo y recibe reservas desde cualquier lugar.</p>
            <ul className="path-features">
              <li>Agenda semanal en tiempo real</li>
              <li>Gestión de barberos y horarios</li>
              <li>Estadísticas e ingresos</li>
              <li>Página pública personalizable</li>
              <li>Planes desde gratis</li>
            </ul>
            <span className="path-cta">Crear mi barbería →</span>
          </a>
          <div className="path-card reveal reveal-delay-1" style={{ cursor: 'default' }}>
            <div className="path-icon">✂️</div>
            <h3 className="path-title">Busco una barbería</h3>
            <p className="path-desc">Encuentra las mejores barberías cerca de ti y reserva en segundos.</p>
            <ul className="path-features">
              <li>Barberías cerca de tu ubicación</li>
              <li>Reserva sin crear cuenta</li>
              <li>Elige tu barbero y servicio</li>
              <li>Confirmación inmediata</li>
              <li>Sin filas ni esperas</li>
            </ul>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="Ej: piplex, barberking..."
                style={{ flex: 1, minWidth: 160, background: 'var(--gray-2)', border: '1px solid var(--gray-3)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.5)'; }}
                onBlur={e  => { e.target.style.borderColor = 'var(--gray-3)'; }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '12px 20px', fontSize: 14 }}>Buscar →</button>
            </form>
          </div>
        </div>
      </section>

      {/* CARACTERÍSTICAS */}
      <section id="caracteristicas">
        <span className="section-tag reveal">Plataforma completa</span>
        <h2 className="section-title reveal">Todo lo que tu barbería<br />necesita para crecer</h2>
        <div className="features-grid reveal">
          {[
            { icon: '📅', title: 'Agenda inteligente',  desc: 'Vista semanal con todas las citas, filtros por barbero y gestión de estados en tiempo real.' },
            { icon: '✂️', title: 'Gestión de equipo',   desc: 'Agrega barberos, configura sus horarios, descansos y controla su acceso al sistema.' },
            { icon: '🌐', title: 'Página pública',       desc: 'Cada barbería tiene su propia landing page personalizable con colores, fotos y servicios.' },
            { icon: '📊', title: 'Estadísticas',         desc: 'Ingresos, citas por mes, servicios más vendidos y tasa de cancelaciones en un solo lugar.' },
            { icon: '🔒', title: 'Roles y permisos',     desc: 'El dueño controla qué puede ver cada barbero. Privacidad total de los datos del negocio.' },
            { icon: '📱', title: 'Reservas 24/7',        desc: 'Los clientes reservan desde cualquier dispositivo, sin llamadas ni mensajes de WhatsApp.' },
          ].map((f, i) => (
            <div key={f.title} className={`feature reveal reveal-delay-${(i % 3) + 1}`}>
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{ background: 'var(--gray-1)', maxWidth: '100%', borderTop: '1px solid var(--gray-3)', borderBottom: '1px solid var(--gray-3)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <span className="section-tag reveal" style={{ textAlign: 'center', display: 'block' }}>Simple y rápido</span>
          <h2 className="section-title reveal" style={{ textAlign: 'center', maxWidth: '100%' }}>En 4 pasos tienes<br />tu barbería online</h2>
          <div className="steps reveal">
            {[
              { n: '1', title: 'Crea tu cuenta',        desc: 'Regístrate con Google en menos de 1 minuto. Sin tarjeta requerida.' },
              { n: '2', title: 'Configura tu barbería', desc: 'Agrega tus servicios, fotos, colores y la información de tu negocio.' },
              { n: '3', title: 'Invita a tu equipo',    desc: 'Genera links de invitación para cada barbero y aprueba su acceso.' },
              { n: '4', title: 'Recibe reservas',       desc: 'Comparte tu página pública y empieza a recibir citas al instante.' },
            ].map(s => (
              <div key={s.n} className="step">
                <div className="step-num">{s.n}</div>
                <h4 className="step-title">{s.title}</h4>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <div className="cta-section">
        <div className="cta-bg" />
        <div className="cta-box reveal">
          <h2 className="cta-title">Tu barbería merece<br /><span style={{ color: 'var(--gold)' }}>más que una agenda</span></h2>
          <p className="cta-sub">Únete a cientos de barberías que ya gestionan su negocio con BarberBooking.</p>
          <a href="/login" className="btn-primary">Crear mi barbería gratis →</a>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-icon" style={{ width: 32, height: 32, fontSize: 14 }}>✂️</div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: 'var(--white)' }}>
            Barber<span style={{ color: 'var(--gold)' }}>Booking</span>
          </span>
        </div>
        <p>© 2025 BarberBooking. Todos los derechos reservados.</p>
        <ul className="footer-links">
          <li><a href="#">Términos</a></li>
          <li><a href="#">Privacidad</a></li>
          <li><a href="#">Contacto</a></li>
        </ul>
      </footer>
    </>
  );
}