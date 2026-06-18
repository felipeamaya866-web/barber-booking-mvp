// app/b/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  client: { name: string | null; image: string | null };
}

interface Barbershop {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  description: string | null;
  bio: string | null;
  logo: string | null;
  colors: string[];
  theme: string;
  photos: string[];
  viewCount: number;
  services: Service[];
  reviews: Review[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function isLight(hex: string): boolean {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  } catch { return false; }
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
function IconCalendar({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}
function IconClock({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />
    </svg>
  );
}
function IconPin({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
    </svg>
  );
}
function IconPhone({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}
function StarIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill={filled ? color : 'none'} stroke={color} strokeWidth={1.2}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function SectionHeading({ eyebrow, title, c0, c1 }: { eyebrow: string; title: string; c0: string; c1: string }) {
  const serif = "'Playfair Display', Georgia, serif";
  return (
    <div className="text-center mb-16">
      <p className="text-xs uppercase tracking-[5px] font-semibold mb-5" style={{ color: c1 }}>
        {eyebrow}
      </p>
      <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-7" style={{ fontFamily: serif }}>
        {title}
      </h2>
      <div className="flex items-center justify-center gap-3">
        <div className="h-px w-14" style={{ background: `linear-gradient(to right, transparent, ${c0}50)` }} />
        <div className="w-2 h-2 rotate-45" style={{ backgroundColor: c1 }} />
        <div className="h-px w-14" style={{ background: `linear-gradient(to left, transparent, ${c0}50)` }} />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function PublicBarbershopPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [scrolled, setScrolled]     = useState(false);

  useEffect(() => { loadBarbershop(); }, [slug]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 90);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const loadBarbershop = async () => {
    try {
      const res  = await fetch(`/api/public/barbershop/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar');
      setBarbershop(data.barbershop);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-800 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !barbershop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">✂️</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Barbería no encontrada</h1>
          <p className="text-gray-500 mb-6 text-sm">No pudimos encontrar la barbería que buscas</p>
          <a href="/" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-gray-700 transition">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  // ── Color system: ALL selected colors put to work ─────────────────────────
  const palette  = barbershop.colors.length >= 2 ? barbershop.colors : ['#0F3460', '#C9A84C'];
  const c0       = palette[0];           // primary brand
  const c1       = palette[1];           // main accent
  const c2       = palette[2] || c1;     // secondary accent
  const c3       = palette[3] || c0;     // supporting
  const colorAt  = (i: number) => palette[i % palette.length];
  const heroText = isLight(c0) ? '#111111' : '#FFFFFF';
  const serif    = "'Playfair Display', Georgia, serif";

  const aboutText = barbershop.bio || barbershop.description;
  const avgRating = barbershop.reviews.length
    ? barbershop.reviews.reduce((s, r) => s + r.rating, 0) / barbershop.reviews.length
    : null;

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap');`}</style>

      {/* ── Palette strip (fixed top, 4px) ───────────────────────── */}
      <div className="h-1 flex fixed top-0 left-0 right-0 z-50">
        {palette.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      {/* ── Sticky nav ────────────────────────────────────────────── */}
      <nav
        className="fixed top-1 left-0 right-0 z-40 transition-all duration-300"
        style={{
          background:     scrolled ? `${c0}f2` : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom:   scrolled ? `1px solid ${c1}28` : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <span
            className="font-bold tracking-tight capitalize transition-all duration-300"
            style={{ fontFamily: serif, color: heroText, opacity: scrolled ? 1 : 0 }}
          >
            {barbershop.name}
          </span>
          <Link
            href={`/b/${barbershop.slug}/booking`}
            className="text-sm font-bold px-5 py-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor:  scrolled ? c1 : 'transparent',
              color:            scrolled ? (isLight(c1) ? '#111' : '#fff') : 'transparent',
              pointerEvents:    scrolled ? 'auto' : 'none',
            }}
          >
            Reservar
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: c0 }}>
        {/* Multi-color ambient glow from full palette */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30" style={{ backgroundColor: c1 }} />
          <div className="absolute top-0 -right-40 w-96 h-96 rounded-full blur-[100px] opacity-20" style={{ backgroundColor: c2 }} />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[100px] opacity-15" style={{ backgroundColor: c3 }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 sm:px-10 py-36 text-center">
          {/* Palette indicator dots (shown when 3+ colors) */}
          {palette.length >= 3 && (
            <div className="flex items-center justify-center gap-2 mb-10">
              {palette.map((color, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{ backgroundColor: color, width: i === 0 ? 10 : 7, height: i === 0 ? 10 : 7, opacity: 0.85 }}
                />
              ))}
            </div>
          )}

          {/* Logo / avatar */}
          {barbershop.logo ? (
            <div className="mb-10">
              <img
                src={barbershop.logo}
                alt={barbershop.name}
                className="w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-full object-cover"
                style={{ boxShadow: `0 0 0 3px ${c1}, 0 0 0 9px ${c0}, 0 24px 60px rgba(0,0,0,0.5)` }}
              />
            </div>
          ) : (
            <div className="mb-10">
              <div
                className="w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-full flex items-center justify-center font-bold text-5xl"
                style={{
                  fontFamily: serif,
                  background: `linear-gradient(135deg, ${c1}30, ${c2}18)`,
                  border:     `2px solid ${c1}60`,
                  color:      heroText,
                  boxShadow:  `0 0 0 9px ${c0}, 0 24px 60px rgba(0,0,0,0.4), 0 0 60px ${c1}25`,
                }}
              >
                {barbershop.name.trim().charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          <h1
            className="capitalize text-6xl sm:text-7xl lg:text-8xl font-black mb-6 leading-[0.9] tracking-tight"
            style={{ fontFamily: serif, color: heroText }}
          >
            {barbershop.name}
          </h1>

          {barbershop.description && (
            <p
              className="text-lg sm:text-xl mb-10 max-w-md mx-auto leading-relaxed font-light"
              style={{ color: `${heroText}80` }}
            >
              {barbershop.description}
            </p>
          )}

          {avgRating && (
            <div className="flex items-center justify-center gap-1 mb-10">
              {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < Math.round(avgRating)} color={c1} />)}
              <span className="text-sm ml-2.5" style={{ color: `${heroText}70` }}>
                {avgRating.toFixed(1)} · {barbershop.reviews.length} reseña{barbershop.reviews.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/b/${barbershop.slug}/booking`}
              className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full font-bold text-base transition-transform hover:-translate-y-0.5 duration-200"
              style={{
                backgroundColor: c1,
                color:           isLight(c1) ? '#111111' : '#FFFFFF',
                boxShadow:       `0 8px 40px ${c1}55`,
              }}
            >
              <IconCalendar className="w-5 h-5" />
              Reservar mi cita
            </Link>
            <a
              href="#servicios"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full font-semibold text-base transition hover:bg-white/10 duration-200"
              style={{ border: `1.5px solid ${heroText}35`, color: `${heroText}85` }}
            >
              Ver servicios
            </a>
          </div>
        </div>

        {/* Wave separator into white */}
        <div className="absolute bottom-0 left-0 right-0 leading-[0] overflow-hidden">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-12 sm:h-20">
            <path d="M0,80 C200,30 400,70 600,40 C800,10 1000,60 1200,35 L1200,80 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* ── Sobre Nosotros ───────────────────────────────────────── */}
      {aboutText && (
        <section className="py-24 sm:py-32 bg-white">
          <div className="max-w-3xl mx-auto px-6 sm:px-10">
            <SectionHeading eyebrow="Nuestra historia" title="Sobre nosotros" c0={c0} c1={c1} />
            <div className="relative">
              <span
                className="absolute -top-10 -left-6 text-[140px] leading-none font-black select-none pointer-events-none"
                style={{ fontFamily: serif, color: `${c1}12` }}
                aria-hidden
              >
                "
              </span>
              <p className="relative text-lg sm:text-xl text-gray-600 leading-[2] font-light whitespace-pre-wrap">
                {aboutText}
              </p>
              <div className="mt-12 flex items-center gap-4">
                <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${c0}35, transparent)` }} />
                <div className="flex gap-1.5">
                  {palette.slice(0, 5).map((color, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Galería ──────────────────────────────────────────────── */}
      {barbershop.photos.length > 0 && (
        <section className="py-24 sm:py-32" style={{ backgroundColor: `${c0}07` }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <SectionHeading eyebrow="Portafolio" title="Nuestro trabajo" c0={c0} c1={c1} />

            {barbershop.photos.length >= 3 ? (
              /* Editorial grid: first photo larger */
              <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] sm:auto-rows-[240px] gap-3 sm:gap-4">
                <div className="col-span-2 row-span-2 relative group overflow-hidden rounded-2xl">
                  <img
                    src={barbershop.photos[0]}
                    alt="Foto destacada"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-400"
                    style={{ background: `linear-gradient(135deg, ${c0}70, ${c1}45)` }}
                  />
                  <div
                    className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition duration-300 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: c1, color: isLight(c1) ? '#111' : '#fff' }}
                  >
                    Destacado
                  </div>
                </div>
                {barbershop.photos.slice(1).map((photo, i) => (
                  <div key={i} className="relative group overflow-hidden rounded-2xl">
                    <img
                      src={photo}
                      alt={`Foto ${i + 2}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-600"
                    />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-400"
                      style={{ background: `linear-gradient(135deg, ${colorAt(i)}55, ${colorAt(i + 2)}35)` }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {barbershop.photos.map((photo, i) => (
                  <div key={i} className="relative group aspect-square overflow-hidden rounded-2xl">
                    <img
                      src={photo}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                    />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                      style={{ background: `${colorAt(i)}45` }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Servicios ────────────────────────────────────────────── */}
      <section id="servicios" className="py-24 sm:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <SectionHeading eyebrow="Lo que hacemos" title="Nuestros servicios" c0={c0} c1={c1} />

          {barbershop.services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {barbershop.services.map((service, idx) => {
                const ca = colorAt(idx);
                const cb = colorAt(idx + 1);
                return (
                  <div
                    key={service.id}
                    className="group bg-white rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300"
                    style={{ boxShadow: `0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px ${ca}25` }}
                  >
                    {/* Top gradient accent bar — uses two palette colors */}
                    <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${ca}, ${cb})` }} />

                    <div className="p-7 flex flex-col flex-1">
                      {/* Index badge */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black mb-5 tracking-wide"
                        style={{ backgroundColor: `${ca}18`, color: ca }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{service.name}</h3>
                      {service.description && (
                        <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-5">{service.description}</p>
                      )}

                      <div className="mt-auto">
                        <div
                          className="flex items-end justify-between mb-5 pt-4"
                          style={{ borderTop: `1px solid ${ca}22` }}
                        >
                          <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Precio</p>
                            <span className="text-2xl font-black leading-none" style={{ color: ca, fontFamily: serif }}>
                              {formatPrice(service.price)}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Duración</p>
                            <span className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-500">
                              <IconClock className="w-3.5 h-3.5" />
                              {service.duration} min
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/b/${barbershop.slug}/booking`}
                          className="w-full py-3.5 rounded-xl font-bold text-sm text-center block hover:opacity-90 transition-opacity"
                          style={{
                            background: `linear-gradient(135deg, ${ca}, ${cb})`,
                            color:      isLight(ca) ? '#111111' : '#FFFFFF',
                          }}
                        >
                          Reservar
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12 text-sm">Próximamente agregaremos nuestros servicios</p>
          )}
        </div>
      </section>

      {/* ── Reseñas ──────────────────────────────────────────────── */}
      {barbershop.reviews.length > 0 && (
        <section className="py-24 sm:py-32" style={{ backgroundColor: `${c0}07` }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <SectionHeading eyebrow="Testimonios" title="Lo que dicen nuestros clientes" c0={c0} c1={c1} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {barbershop.reviews.map((review, idx) => {
                const rc = colorAt(idx);
                return (
                  <div
                    key={review.id}
                    className="bg-white rounded-2xl p-7 relative overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    style={{ borderLeft: `4px solid ${rc}`, boxShadow: `0 2px 12px rgba(0,0,0,0.05)` }}
                  >
                    <span
                      className="absolute top-3 right-5 text-7xl font-black leading-none select-none pointer-events-none"
                      style={{ fontFamily: serif, color: `${rc}12` }}
                      aria-hidden
                    >
                      "
                    </span>

                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < review.rating} color={rc} />)}
                    </div>

                    {review.comment && (
                      <p className="text-gray-600 text-[15px] leading-relaxed mb-6 italic">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center gap-3">
                      {review.client.image ? (
                        <img
                          src={review.client.image}
                          alt={review.client.name || 'Cliente'}
                          className="w-10 h-10 rounded-full object-cover"
                          style={{ border: `2px solid ${rc}50` }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ backgroundColor: `${rc}20`, color: rc }}
                        >
                          {(review.client.name || 'C')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{review.client.name || 'Cliente'}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Contacto ─────────────────────────────────────────────── */}
      <section className="relative py-28 sm:py-36 overflow-hidden" style={{ backgroundColor: c0 }}>
        {/* Ambient glow using full palette */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[130px] opacity-25" style={{ backgroundColor: c1 }} />
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[130px] opacity-20" style={{ backgroundColor: c2 }} />
          {palette[3] && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-10" style={{ backgroundColor: palette[3] }} />
          )}
        </div>

        <div className="relative max-w-2xl mx-auto px-6 sm:px-10 text-center">
          <p className="text-xs uppercase tracking-[5px] font-semibold mb-6" style={{ color: c1 }}>
            Encuéntranos
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-14" style={{ fontFamily: serif, color: heroText }}>
            Visítanos
          </h2>

          <div className="space-y-4 mb-14 max-w-sm mx-auto">
            <div
              className="flex items-center gap-4 p-5 rounded-2xl text-left"
              style={{ backgroundColor: `${heroText}0d`, border: `1px solid ${heroText}18` }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${c1}28`, color: c1 }}
              >
                <IconPin className="w-5 h-5" />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: `${heroText}85` }}>
                {barbershop.address}
              </p>
            </div>

            <a
              href={`tel:${barbershop.phone}`}
              className="flex items-center gap-4 p-5 rounded-2xl text-left transition hover:opacity-80"
              style={{ backgroundColor: `${heroText}0d`, border: `1px solid ${heroText}18` }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${c2}28`, color: c2 }}
              >
                <IconPhone className="w-5 h-5" />
              </div>
              <p className="text-sm" style={{ color: `${heroText}85` }}>
                {barbershop.phone}
              </p>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/b/${barbershop.slug}/booking`}
              className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full font-bold text-base transition-transform hover:-translate-y-0.5 duration-200"
              style={{
                backgroundColor: c1,
                color:           isLight(c1) ? '#111111' : '#FFFFFF',
                boxShadow:       `0 8px 40px ${c1}50`,
              }}
            >
              <IconCalendar className="w-5 h-5" />
              Reservar cita
            </Link>
            <a
              href={`tel:${barbershop.phone}`}
              className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full font-semibold text-base transition hover:bg-white/10 duration-200"
              style={{ border: `1.5px solid ${heroText}40`, color: `${heroText}85` }}
            >
              <IconPhone className="w-5 h-5" />
              Llamar ahora
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-[#050505] text-white py-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 text-center">
          {/* Mini palette bar */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {palette.map((color, i) => (
              <div key={i} className="w-6 h-1 rounded-full" style={{ backgroundColor: color, opacity: 0.6 }} />
            ))}
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} <span className="capitalize">{barbershop.name}</span>. Todos los derechos reservados.
          </p>
          <p className="mt-2">
            <a href="https://barberbooking.site" className="text-xs hover:underline transition" style={{ color: `${c1}70` }}>
              Creado con BarberBooking
            </a>
          </p>
        </div>
      </footer>

      {/* ── Floating CTA — mobile only ────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 z-30 sm:hidden"
        style={{ background: `linear-gradient(to top, ${c0}f0 60%, transparent)` }}
      >
        <Link
          href={`/b/${barbershop.slug}/booking`}
          className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl font-bold text-base"
          style={{
            backgroundColor: c1,
            color:           isLight(c1) ? '#111111' : '#FFFFFF',
            boxShadow:       `0 8px 40px ${c1}65`,
          }}
        >
          <IconCalendar className="w-5 h-5" />
          Reservar mi cita
        </Link>
      </div>
    </div>
  );
}
