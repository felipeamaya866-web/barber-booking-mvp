// app/barbershop/plans/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type PlanKey = 'LITE' | 'PRIME' | 'ELITE';

interface Subscription {
  plan:   PlanKey;
  status: string;
}

interface Plan {
  key:        PlanKey;
  nombre:     string;
  precio:     number;
  barberos:   string;
  fotos:      string;
  badge?:     string;
  destacado:  boolean;
}

// ─────────────────────────────────────────────
// CONFIGURACIÓN DE PLANES
// ─────────────────────────────────────────────
const PLANES: Plan[] = [
  {
    key:       'LITE',
    nombre:    'Lite',
    precio:    29900,
    barberos:  '1 barbero / estilista',
    fotos:     'Hasta 10 fotos en galería',
    destacado: false,
  },
  {
    key:       'PRIME',
    nombre:    'Prime',
    precio:    49900,
    barberos:  '2 a 3 barberos / estilistas',
    fotos:     'Hasta 20 fotos en galería',
    badge:     '⭐ Más popular',
    destacado: true,
  },
  {
    key:       'ELITE',
    nombre:    'Elite',
    precio:    79900,
    barberos:  'Barberos ilimitados',
    fotos:     'Hasta 40 fotos en galería',
    destacado: false,
  },
];

const FEATURES_COMUNES = [
  '✅ Agenda de citas',
  '✅ Landing page pública',
  '✅ Código QR',
  '✅ Soporte WhatsApp 24/7',
  '✅ Estadísticas básicas',
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style:                 'currency',
    currency:              'COP',
    minimumFractionDigits: 0,
  }).format(precio);
}

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  TRIAL:     { label: 'Período de prueba',  color: 'text-yellow-400' },
  ACTIVE:    { label: 'Activo',             color: 'text-green-400'  },
  CANCELLED: { label: 'Cancelado',          color: 'text-red-400'    },
  EXPIRED:   { label: 'Expirado',           color: 'text-red-400'    },
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function PlansPage() {
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading]           = useState(true);
  const [procesando, setProcesando]     = useState<PlanKey | null>(null);
  const [error, setError]               = useState('');

  // ── Cargar plan actual ─────────────────────
  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch('/api/barbershop/settings');
      if (!res.ok) { router.push('/login'); return; }
      const data = await res.json();
      setSubscription({
        plan:   data.barbershop.plan,
        status: data.barbershop.subscriptionStatus,
      });
    } catch {
      setError('No se pudo cargar el plan actual');
    } finally {
      setLoading(false);
    }
  }

  // ── Iniciar pago ───────────────────────────
  async function handleSelectPlan(planKey: PlanKey) {
    try {
      setProcesando(planKey);
      setError('');

      const res = await fetch('/api/payments/create-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: planKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear sesión de pago');
        return;
      }

      // Redirigir al checkout de Wompi
      window.location.href = data.checkoutUrl;

    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setProcesando(null);
    }
  }

  // ── Loading ────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Cargando planes...</p>
        </div>
      </div>
    );
  }

  const estadoActual = subscription ? ESTADO_LABEL[subscription.status] : null;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/barbershop" className="text-gray-400 hover:text-white transition-colors p-1">←</Link>
          <div>
            <h1 className="text-lg font-bold text-white">💳 Planes</h1>
            <p className="text-xs text-gray-400">Elige el plan que mejor se adapte a tu barbería</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Plan actual */}
        {subscription && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Plan actual</p>
              <p className="text-white font-semibold">
                {subscription.plan}
                {estadoActual && (
                  <span className={`ml-2 text-sm font-normal ${estadoActual.color}`}>
                    · {estadoActual.label}
                  </span>
                )}
              </p>
            </div>
            {subscription.status === 'TRIAL' && (
              <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-3 py-1.5 rounded-full">
                ⏳ Período de prueba activo
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm mb-6">
            ❌ {error}
          </div>
        )}

        {/* Título */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Elige tu plan</h2>
          <p className="text-gray-400">Todos los planes incluyen 14 días de prueba gratis</p>
        </div>

        {/* Cards de planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {PLANES.map(plan => {
            const esPlanActual = subscription?.plan === plan.key && subscription?.status === 'ACTIVE';
            const estaProcesando = procesando === plan.key;

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all ${
                  plan.destacado
                    ? 'border-yellow-400 bg-gray-900 shadow-lg shadow-yellow-400/10'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Nombre y precio */}
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white mb-3">{plan.nombre}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-white">{formatPrecio(plan.precio)}</span>
                    <span className="text-gray-400 text-sm mb-1">/mes</span>
                  </div>
                </div>

                {/* Features del plan */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-yellow-400 mt-0.5 flex-shrink-0">💈</span>
                    {plan.barberos}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-yellow-400 mt-0.5 flex-shrink-0">📸</span>
                    {plan.fotos}
                  </li>
                  {FEATURES_COMUNES.map(f => (
                    <li key={f} className="text-sm text-gray-400">{f}</li>
                  ))}
                </ul>

                {/* Botón */}
                {esPlanActual ? (
                  <div className="w-full py-3 rounded-xl text-center text-sm font-semibold bg-green-900/30 text-green-400 border border-green-700">
                    ✓ Plan actual
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.key)}
                    disabled={!!procesando}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      plan.destacado
                        ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300 disabled:opacity-50'
                        : 'bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50'
                    }`}
                  >
                    {estaProcesando ? (
                      <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      `Elegir ${plan.nombre}`
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Info de seguridad */}
        <div className="text-center space-y-2">
          <p className="text-gray-500 text-sm">
            🔒 Pagos seguros procesados por{' '}
            <span className="text-gray-300 font-medium">Wompi</span>
            {' '}· Acepta PSE, tarjetas de crédito y Nequi
          </p>
          <p className="text-gray-600 text-xs">
            Puedes cancelar en cualquier momento desde tu panel
          </p>
        </div>

      </div>
    </div>
  );
}