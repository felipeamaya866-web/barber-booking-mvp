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
  const heroStyle      = { backgroundColor: primaryColor };
  const aboutText      = barbershop.bio || barbershop.description;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="relative" style={heroStyle}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center text-white">

            {barbershop.logo && (
              <img
                src={barbershop.logo}
                alt={barbershop.name}
                className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-white shadow-lg object-cover"
              />
            )}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              {barbershop.name}
            </h1>

            {barbershop.description && (
              <p className="text-xl sm:text-2xl mb-8 max-w-2xl mx-auto opacity-90">
                {barbershop.description}
              </p>
            )}

            {/* ✅ Botón principal → flujo de reserva */}
            <Link
              href={`/b/${barbershop.slug}/booking`}
              className="inline-block px-8 py-4 rounded-full font-bold text-lg transition shadow-lg hover:opacity-90"
              style={{ backgroundColor: secondaryColor, color: primaryColor }}
            >
              🗓️ Reservar Cita
            </Link>

          </div>
        </div>

        {/* Ola decorativa */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-8 sm:h-12">
            <path d="M0,60 C300,0 900,0 1200,60 L1200,60 L0,60 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ── Sobre Nosotros ───────────────────────────────────── */}
      {aboutText && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Sobre Nosotros</h2>
            <div className="w-16 h-1 mx-auto mb-8 rounded-full" style={{ backgroundColor: primaryColor }} />
            <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">{aboutText}</p>
          </div>
        </section>
      )}

      {/* ── Galería ──────────────────────────────────────────── */}
      {barbershop.photos.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">📸 Nuestro Trabajo</h2>
            <div className="w-16 h-1 mx-auto mb-8 rounded-full" style={{ backgroundColor: primaryColor }} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {barbershop.photos.map((photo, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition">
                  <img
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Servicios ────────────────────────────────────────── */}
      <section id="servicios" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">💈 Nuestros Servicios</h2>
          <div className="w-16 h-1 mx-auto mb-8 rounded-full" style={{ backgroundColor: primaryColor }} />
          {barbershop.services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {barbershop.services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white border-2 rounded-xl p-6 hover:shadow-lg transition"
                  style={{ borderColor: primaryColor }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-gray-600 mb-4 text-sm">{service.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                      {formatPrice(service.price)}
                    </span>
                    <span className="text-gray-500 text-sm">⏱️ {service.duration} min</span>
                  </div>
                  {/* ✅ Botón de cada servicio → flujo de reserva */}
                  <Link
                    href={`/b/${barbershop.slug}/booking`}
                    className="mt-4 w-full py-2 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition block text-center"
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
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">⭐ Reseñas de Clientes</h2>
            <div className="w-16 h-1 mx-auto mb-8 rounded-full" style={{ backgroundColor: primaryColor }} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {barbershop.reviews.map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    {review.client.image ? (
                      <img src={review.client.image} alt={review.client.name || 'Cliente'} className="w-10 h-10 rounded-full mr-3 object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center text-gray-600 font-bold">
                        {(review.client.name || 'C')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{review.client.name || 'Cliente'}</p>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} style={{ color: i < review.rating ? secondaryColor : '#D1D5DB' }}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && <p className="text-gray-700 text-sm">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Contacto ─────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-8">📍 Visítanos</h2>
          <div className="space-y-4 mb-8">
            <p className="text-lg flex items-center justify-center gap-2 opacity-90">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {barbershop.address}
            </p>
            <p className="text-lg flex items-center justify-center gap-2 opacity-90">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href={`tel:${barbershop.phone}`} className="hover:underline">{barbershop.phone}</a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* ✅ Botón de reserva en la sección de contacto */}
            <Link
              href={`/b/${barbershop.slug}/booking`}
              className="inline-block px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition shadow-lg"
              style={{ backgroundColor: secondaryColor, color: primaryColor }}
            >
              🗓️ Reservar Cita
            </Link>
            <a
              href={`tel:${barbershop.phone}`}
              className="inline-block px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition shadow-lg border-2 border-white text-white"
            >
              📞 Llamar Ahora
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2024 {barbershop.name}. Todos los derechos reservados.</p>
          <p className="text-gray-500 text-sm mt-2">🔗 Powered by Barber Booking</p>
        </div>
      </footer>
    </div>
  );
}