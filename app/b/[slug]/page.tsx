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
  client: {
    name: string | null;
    image: string | null;
  };
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

// ── Iconos de línea, minimalistas ────────────────────────────────
function IconCalendar({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}
function IconClock({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="9" strokeWidth={1.6} />
    </svg>
  );
}
function IconPin({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657 13.414 20.9a2 2 0 0 1-2.828 0l-4.243-4.243a8 8 0 1 1 11.314 0Z" />
      <circle cx="12" cy="11" r="3" strokeWidth={1.6} />
    </svg>
  );
}
function IconPhone({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.04 11.04 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5Z" />
    </svg>
  );
}
function StarIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill={filled ? color : 'none'} stroke={filled ? color : '#D1D5DB'} strokeWidth={1.2}>
      <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.2 1.3 6.1L10 14.9l-5.4 3.1 1.3-6.1L1.3 7.7l6.1-.6L10 1.5z" />
    </svg>
  );
}

export default function PublicBarbershopPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBarbershop();
  }, [slug]);

  const loadBarbershop = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/public/barbershop/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar barbería');
      setBarbershop(data.barbershop);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !barbershop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Barbería no encontrada</h1>
          <p className="text-gray-600 mb-6">No pudimos encontrar la barbería que buscas</p>
          <a href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  const primaryColor   = barbershop.colors[0] || '#111827';
  const secondaryColor = barbershop.colors[1] || '#F59E0B';
  const aboutText      = barbershop.bio || barbershop.description;
  const avgRating      = barbershop.reviews.length
    ? barbershop.reviews.reduce((s, r) => s + r.rating, 0) / barbershop.reviews.length
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap');`}</style>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${secondaryColor}33, transparent 70%)` }}
        />
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 py-28 sm:py-40">
          <div className="text-center text-white">

            {barbershop.logo ? (
              <img
                src={barbershop.logo}
                alt={barbershop.name}
                className="w-40 h-40 sm:w-52 sm:h-52 mx-auto mb-8 rounded-full object-cover ring-2 shadow-2xl"
                style={{ boxShadow: `0 0 0 3px ${secondaryColor}55, 0 25px 70px rgba(0,0,0,0.4)` }}
              />
            ) : (
              <div
                className="w-40 h-40 sm:w-52 sm:h-52 mx-auto mb-8 rounded-full flex items-center justify-center text-6xl sm:text-7xl font-bold ring-2 shadow-2xl"
                style={{ fontFamily: "'Playfair Display', serif", background: 'rgba(255,255,255,0.08)', boxShadow: `0 0 0 3px ${secondaryColor}55, 0 25px 70px rgba(0,0,0,0.4)` }}
              >
                {barbershop.name.trim().charAt(0).toUpperCase()}
              </div>
            )}

            <h1
              className="capitalize text-5xl sm:text-6xl lg:text-7xl font-bold mb-5 leading-[1.05] tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {barbershop.name}
            </h1>

            {barbershop.description && (
              <p className="text-lg sm:text-xl mb-10 max-w-xl mx-auto opacity-80 font-light leading-relaxed">
                {barbershop.description}
              </p>
            )}

            {avgRating && (
              <div className="flex items-center justify-center gap-1.5 mb-8 opacity-90">
                {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < Math.round(avgRating)} color={secondaryColor} />)}
                <span className="text-sm ml-1.5 opacity-80">{avgRating.toFixed(1)} · {barbershop.reviews.length} reseña{barbershop.reviews.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            <Link
              href={`/b/${barbershop.slug}/booking`}
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full font-semibold text-base transition shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              style={{ backgroundColor: secondaryColor, color: primaryColor }}
            >
              <IconCalendar className="w-5 h-5" />
              Reservar cita
            </Link>

          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-[0]">
          <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-10 sm:h-14">
            <path d="M0,60 C300,0 900,0 1200,60 L1200,60 L0,60 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ── Sobre Nosotros ───────────────────────────────────── */}
      {aboutText && (
        <section className="py-20 sm:py-24 bg-gray-50">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Sobre nosotros
            </h2>
            <div className="w-12 h-px mx-auto mb-9" style={{ backgroundColor: secondaryColor }} />
            <p className="text-lg text-gray-600 leading-loose whitespace-pre-wrap font-light">{aboutText}</p>
          </div>
        </section>
      )}

      {/* ── Galería ──────────────────────────────────────────── */}
      {barbershop.photos.length > 0 && (
        <section className="py-20 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
                Nuestro trabajo
              </h2>
              <div className="w-12 h-px mx-auto" style={{ backgroundColor: secondaryColor }} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {barbershop.photos.map((photo, index) => (
                <div key={index} className="aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300">
                  <img
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Servicios ────────────────────────────────────────── */}
      <section id="servicios" className="py-20 sm:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Nuestros servicios
            </h2>
            <div className="w-12 h-px mx-auto" style={{ backgroundColor: secondaryColor }} />
          </div>
          {barbershop.services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {barbershop.services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col"
                  style={{ borderTop: `3px solid ${primaryColor}` }}
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-gray-500 mb-5 text-sm leading-relaxed flex-1">{service.description}</p>
                  )}
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-2xl font-bold" style={{ color: primaryColor, fontFamily: "'Playfair Display', serif" }}>
                      {formatPrice(service.price)}
                    </span>
                    <span className="text-gray-400 text-sm flex items-center gap-1.5">
                      <IconClock /> {service.duration} min
                    </span>
                  </div>
                  <Link
                    href={`/b/${barbershop.slug}/booking`}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition text-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Reservar
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Próximamente agregaremos nuestros servicios</p>
          )}
        </div>
      </section>

      {/* ── Reseñas ──────────────────────────────────────────── */}
      {barbershop.reviews.length > 0 && (
        <section className="py-20 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
                Lo que dicen nuestros clientes
              </h2>
              <div className="w-12 h-px mx-auto" style={{ backgroundColor: secondaryColor }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {barbershop.reviews.map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-2xl p-7 shadow-sm">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < review.rating} color={secondaryColor} />)}
                  </div>
                  {review.comment && (
                    <p className="text-gray-600 text-[15px] leading-relaxed mb-5 italic">&ldquo;{review.comment}&rdquo;</p>
                  )}
                  <div className="flex items-center gap-3">
                    {review.client.image ? (
                      <img src={review.client.image} alt={review.client.name || 'Cliente'} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">
                        {(review.client.name || 'C')[0].toUpperCase()}
                      </div>
                    )}
                    <p className="font-medium text-gray-800 text-sm">{review.client.name || 'Cliente'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Contacto ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-24" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-2xl mx-auto px-6 sm:px-8 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12" style={{ fontFamily: "'Playfair Display', serif" }}>
            Visítanos
          </h2>
          <div className="space-y-5 mb-12">
            <p className="text-lg flex items-center justify-center gap-3 opacity-85 font-light">
              <IconPin />
              {barbershop.address}
            </p>
            <p className="text-lg flex items-center justify-center gap-3 opacity-85 font-light">
              <IconPhone />
              <a href={`tel:${barbershop.phone}`} className="hover:underline">{barbershop.phone}</a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/b/${barbershop.slug}/booking`}
              className="inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-full font-semibold text-base hover:shadow-2xl hover:-translate-y-0.5 transition shadow-xl"
              style={{ backgroundColor: secondaryColor, color: primaryColor }}
            >
              <IconCalendar className="w-5 h-5" /> Reservar cita
            </Link>
            <a
              href={`tel:${barbershop.phone}`}
              className="inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-full font-semibold text-base hover:bg-white/10 transition shadow-xl border border-white/30 text-white"
            >
              <IconPhone className="w-5 h-5" /> Llamar ahora
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-white py-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} {barbershop.name}. Todos los derechos reservados.</p>
          <p className="text-gray-600 text-xs mt-2">Creado con BarberBooking</p>
        </div>
      </footer>
    </div>
  );
}
