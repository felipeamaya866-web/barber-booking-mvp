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
  topServices: { id: string; name: string; price: number; duration: number }[];
  planInfo: {
    plan: string;
    status: string;
    maxPhotos: number;
    maxBarbers: number;
    currentPhotos: number;
    trialEndsAt: string | null;
  } | null;
  recentReviews: { id: string; rating: number; comment: string | null; createdAt: string }[];
}

interface IncomeData {
  total: number;
  citas: number;
  periodo: string;
}

type PeriodoType = 'dia' | 'semana' | 'mes';

const PERIODO_LABELS: Record<PeriodoType, string> = {
  dia:    'Hoy',
  semana: 'Esta semana',
  mes:    'Este mes',
};

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics]   = useState<Analytics | null>(null);
  const [loading, setLoading]        = useState(true);
  const [error, setError]            = useState<string | null>(null);
  const [periodo, setPeriodo]        = useState<PeriodoType>('mes');
  const [income, setIncome]          = useState<IncomeData | null>(null);
  const [loadingIncome, setLoadingIncome] = useState(false);

  useEffect(() => { loadAnalytics(); }, []);
  useEffect(() => { loadIncome(); }, [periodo]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res  = await fetch('/api/barbershop/analytics');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar analytics');
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const loadIncome = async () => {
    try {
      setLoadingIncome(true);
      const now   = new Date();
      let from: Date;
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      if (periodo === 'dia') {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      } else if (periodo === 'semana') {
        const day  = now.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0);
      } else {
        from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      }

      const toStr   = `${to.getFullYear()}-${String(to.getMonth()+1).padStart(2,'0')}-${String(to.getDate()).padStart(2,'0')}`;
      const fromStr = `${from.getFullYear()}-${String(from.getMonth()+1).padStart(2,'0')}-${String(from.getDate()).padStart(2,'0')}`;

      const res  = await fetch(`/api/barbershop/stats?mode=range&from=${fromStr}&to=${toStr}`);
      const data = await res.json();
      if (res.ok) {
        setIncome({ total: data.ingresosMes || 0, citas: data.totalCitas || 0, periodo: PERIODO_LABELS[periodo] });
      }
    } catch { /* silencioso */ }
    finally { setLoadingIncome(false); }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

  const getDaysRemaining = (date: string | null) => {
    if (!date) return null;
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto" />
        <p className="text-gray-400 mt-4">Cargando estadísticas...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-900/40 border border-red-700 rounded-xl p-6">
        <p className="text-red-300">{error || 'Error al cargar analytics'}</p>
        <button onClick={loadAnalytics} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          Reintentar
        </button>
      </div>
    );
  }

  const { overview, topServices, planInfo, recentReviews } = analytics;
  const trialDays = planInfo?.trialEndsAt ? getDaysRemaining(planInfo.trialEndsAt) : null;

  return (
    <div className="space-y-6">

      {/* Trial Banner */}
      {planInfo?.status === 'TRIAL' && trialDays !== null && trialDays > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-600/40 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-yellow-300">🎉 Periodo de Prueba Activo</h3>
              <p className="text-sm text-yellow-200/70">
                Te quedan <strong>{trialDays} días gratis</strong> en el plan {planInfo.plan}
              </p>
            </div>
            <button className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition text-sm">
              Actualizar Plan
            </button>
          </div>
        </div>
      )}

      {/* ── INGRESOS CON FILTRO ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-base font-semibold text-white">💰 Ingresos</h3>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {(['dia', 'semana', 'mes'] as PeriodoType[]).map(p => (
              <button key={p} onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  periodo === p ? 'bg-yellow-400 text-gray-900' : 'text-gray-400 hover:text-white'
                }`}>
                {PERIODO_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {loadingIncome ? (
          <div className="flex items-center gap-3 py-2">
            <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 text-sm">Calculando...</span>
          </div>
        ) : income ? (
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-3xl font-bold text-yellow-400">{formatPrice(income.total)}</p>
              <p className="text-sm text-gray-400 mt-1">{income.citas} cita{income.citas !== 1 ? 's' : ''} completada{income.citas !== 1 ? 's' : ''} · {income.periodo}</p>
            </div>
            {income.citas > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Promedio por cita</p>
                <p className="text-lg font-bold text-white">{formatPrice(income.total / income.citas)}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No hay datos disponibles</p>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Vistas Totales', value: overview.totalViews.toLocaleString(),
            sub: 'Visitas a tu página',
            color: 'from-blue-600 to-blue-700',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />,
          },
          {
            label: 'Servicios', value: overview.totalServices,
            sub: 'Activos en tu catálogo',
            color: 'from-purple-600 to-purple-700',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
          },
          {
            label: 'Reseñas', value: overview.totalReviews,
            sub: overview.avgRating > 0 ? `⭐ ${overview.avgRating} promedio` : 'Sin reseñas aún',
            color: 'from-green-600 to-green-700',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
          },
          {
            label: 'Plan Actual', value: planInfo?.plan || 'Sin Plan',
            sub: planInfo ? `${planInfo.currentPhotos}/${planInfo.maxPhotos} fotos` : 'Configura tu plan',
            color: 'from-yellow-500 to-orange-500',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
          },
        ].map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-xl p-5 text-white`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium opacity-80">{card.label}</h3>
              <svg className="w-6 h-6 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {card.icon}
              </svg>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs opacity-70 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Top Services */}
      {topServices.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">🏆 Servicios Destacados</h3>
          <div className="space-y-2">
            {topServices.map((service, index) => (
              <div key={service.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl hover:bg-gray-750 transition">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-yellow-400 text-gray-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{service.name}</p>
                    <p className="text-xs text-gray-400">⏱️ {service.duration} min</p>
                  </div>
                </div>
                <p className="font-bold text-yellow-400 text-sm">{formatPrice(service.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">⭐ Reseñas Recientes</h3>
          <div className="space-y-3">
            {recentReviews.map(review => (
              <div key={review.id} className="p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-base ${i < review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                </div>
                {review.comment && <p className="text-sm text-gray-300">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {topServices.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-300 mb-1">📊 Aún no tienes servicios</p>
          <p className="text-sm text-gray-500">Agrega servicios para ver estadísticas más detalladas</p>
        </div>
      )}
    </div>
  );
}