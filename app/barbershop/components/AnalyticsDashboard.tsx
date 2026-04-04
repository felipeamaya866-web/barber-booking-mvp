// app/barbershop/components/AnalyticsDashboard.tsx
'use client';

import { useEffect, useState } from 'react';

interface Analytics {
  overview: {
    totalViews: number;
    totalServices: number;
    totalReviews: number;
    avgRating: number;
  };
  topServices: {
    id: string;
    name: string;
    price: number;
    duration: number;
  }[];
  planInfo: {
    plan: string;
    status: string;
    maxPhotos: number;
    maxBarbers: number;
    currentPhotos: number;
    trialEndsAt: string | null;
  } | null;
  recentReviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }[];
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/barbershop/analytics');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar analytics');
      }

      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (date: string | null) => {
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Cargando estadísticas...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">{error || 'Error al cargar analytics'}</p>
        <button
          onClick={loadAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { overview, topServices, planInfo, recentReviews } = analytics;
  const trialDays = planInfo?.trialEndsAt ? getDaysRemaining(planInfo.trialEndsAt) : null;

  return (
    <div className="space-y-6">
      {/* Plan Info Banner */}
      {planInfo && planInfo.status === 'TRIAL' && trialDays !== null && trialDays > 0 && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">🎉 Periodo de Prueba Activo</h3>
              <p className="text-sm text-yellow-100">
                Te quedan <strong>{trialDays} días gratis</strong> en el plan {planInfo.plan}
              </p>
            </div>
            <button className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition">
              Actualizar Plan
            </button>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vistas */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Vistas Totales</h3>
            <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{overview.totalViews.toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-1">Visitas a tu página</p>
        </div>

        {/* Servicios */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Servicios</h3>
            <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{overview.totalServices}</p>
          <p className="text-xs opacity-75 mt-1">Activos en tu catálogo</p>
        </div>

        {/* Reseñas */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Reseñas</h3>
            <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{overview.totalReviews}</p>
          <p className="text-xs opacity-75 mt-1">
            {overview.avgRating > 0 ? `⭐ ${overview.avgRating} promedio` : 'Sin reseñas aún'}
          </p>
        </div>

        {/* Plan */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Plan Actual</h3>
            <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{planInfo?.plan || 'Sin Plan'}</p>
          <p className="text-xs opacity-75 mt-1">
            {planInfo ? `${planInfo.currentPhotos}/${planInfo.maxPhotos} fotos` : 'Configura tu plan'}
          </p>
        </div>
      </div>

      {/* Top Services */}
      {topServices.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            🏆 Servicios Destacados
          </h3>
          <div className="space-y-3">
            {topServices.map((service, index) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500">⏱️ {service.duration} min</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {formatPrice(service.price)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            ⭐ Reseñas Recientes
          </h3>
          <div className="space-y-3">
            {recentReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty States */}
      {topServices.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800 mb-2">📊 Aún no tienes servicios</p>
          <p className="text-sm text-blue-600">
            Agrega servicios para ver estadísticas más detalladas
          </p>
        </div>
      )}
    </div>
  );
}