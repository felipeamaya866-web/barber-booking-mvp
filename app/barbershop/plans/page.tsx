// app/barbershop/plans/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type PlanKey = 'LITE' | 'PRIME' | 'ELITE';
type View    = 'plans' | 'payment' | 'success';

interface Subscription {
  plan:   PlanKey;
  status: string;
  trialEndsAt?: string | null;
  subscriptionEndDate?: string | null;
  paymentSourceId?: string | null;
}

interface AcceptanceTokens {
  acceptanceToken:    string;
  acceptPersonalAuth: string;
  termsUrl:           string;
  personalDataUrl:    string;
}

interface CardForm {
  number:             string;
  expMonth:           string;
  expYear:            string;
  cvc:                string;
  holder:             string;
  acceptTerms:        boolean;
  acceptPersonalData: boolean;
}

const CARD_EMPTY: CardForm = {
  number: '', expMonth: '', expYear: '', cvc: '', holder: '',
  acceptTerms: false, acceptPersonalData: false,
};

// ─────────────────────────────────────────────
// PLANES
// ─────────────────────────────────────────────
const PLANES = [
  { key: 'LITE'  as PlanKey, nombre: 'Lite',  precio: 29900, barberos: '1 barbero',          fotos: '10 fotos',  destacado: false },
  { key: 'PRIME' as PlanKey, nombre: 'Prime', precio: 49900, barberos: '2 a 3 barberos',     fotos: '20 fotos',  destacado: true,  badge: '⭐ Más popular' },
  { key: 'ELITE' as PlanKey, nombre: 'Elite', precio: 79900, barberos: 'Barberos ilimitados', fotos: '40 fotos', destacado: false },
];

const FEATURES_COMUNES = [
  '✅ Agenda de citas',
  '✅ Landing page pública',
  '✅ Código QR',
  '✅ Soporte WhatsApp 24/7',
  '✅ Estadísticas básicas',
];

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  TRIAL:     { label: 'Período de prueba', color: 'text-yellow-400' },
  ACTIVE:    { label: 'Activo',            color: 'text-green-400'  },
  CANCELLED: { label: 'Cancelado',         color: 'text-red-400'    },
  EXPIRED:   { label: 'Expirado',          color: 'text-red-400'    },
};

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio);
}

// ── Formatea número de tarjeta con espacios cada 4 dígitos
function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

// ─────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────
export default function PlansPage() {
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState<View>('plans');
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);

  // Form de tarjeta
  const [card, setCard]                 = useState<CardForm>(CARD_EMPTY);
  const [tokens, setTokens]             = useState<AcceptanceTokens | null>(null);
  const [procesando, setProcesando]     = useState(false);
  const [error, setError]               = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelando, setCancelando]     = useState(false);

  useEffect(() => { fetchSubscription(); }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch('/api/barbershop/settings');
      if (!res.ok) { router.push('/login'); return; }
      const data = await res.json();
      setSubscription({
        plan:               data.barbershop.plan,
        status:             data.barbershop.subscriptionStatus,
        trialEndsAt:        data.barbershop.trialEndsAt,
        subscriptionEndDate: data.barbershop.subscriptionEndDate,
        paymentSourceId:    data.barbershop.paymentSourceId,
      });
    } catch {
      setError('No se pudo cargar el plan actual');
    } finally {
      setLoading(false);
    }
  }

  // ── Cancelar suscripción ───────────────────────────────────────────────────
  async function handleCancelar() {
    try {
      setCancelando(true);
      setError('');
      const res  = await fetch('/api/payments/cancel-subscription', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al cancelar'); return; }
      setShowCancelModal(false);
      await fetchSubscription();
      setSuccessMsg(
        data.accessUntil
          ? `Cancelado. Conservas acceso hasta el ${new Date(data.accessUntil).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}.`
          : 'Suscripción cancelada correctamente.'
      );
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setCancelando(false);
    }
  }

  // ── Al elegir un plan → cargar tokens y mostrar formulario ─────────────────
  async function handleSelectPlan(planKey: PlanKey) {
    setSelectedPlan(planKey);
    setCard(CARD_EMPTY);
    setError('');
    setTokens(null);
    setView('payment');

    try {
      const res  = await fetch('/api/payments/acceptance-tokens');
      const data = await res.json();
      if (res.ok) {
        setTokens(data);
      } else {
        setError(data.error || 'No se pudo conectar con Wompi. Intenta de nuevo.');
      }
    } catch {
      setError('No se pudo conectar con Wompi. Intenta de nuevo.');
    }
  }

  // ── Tokenizar tarjeta en Wompi y luego registrar en backend ────────────────
  async function handleRegistrarTarjeta(e: React.FormEvent) {
    e.preventDefault();
    if (!tokens || !selectedPlan) return;

    // Validaciones básicas
    const numero = card.number.replace(/\s/g, '');
    if (numero.length < 13) { setError('Número de tarjeta inválido'); return; }
    if (!card.expMonth || !card.expYear) { setError('Fecha de vencimiento inválida'); return; }
    if (card.cvc.length < 3) { setError('CVC inválido'); return; }
    if (card.holder.trim().length < 5) { setError('Ingresa el nombre completo del titular'); return; }
    if (!card.acceptTerms) { setError('Debes aceptar los términos y condiciones de Wompi'); return; }
    if (!card.acceptPersonalData) { setError('Debes autorizar el tratamiento de datos personales'); return; }

    try {
      setProcesando(true);
      setError('');

      // PASO 1 — Tokenizar tarjeta directo en Wompi (usa llave PÚBLICA, seguro desde el browser)
      const wompiBase  = process.env.NEXT_PUBLIC_WOMPI_ENV === 'prod'
        ? 'https://production.wompi.co/v1'
        : 'https://sandbox.wompi.co/v1';

      const tokenRes = await fetch(`${wompiBase}/tokens/cards`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY}`,
        },
        body: JSON.stringify({
          number:      numero,
          exp_month:   card.expMonth.padStart(2, '0'),
          exp_year:    card.expYear.slice(-2),
          cvc:         card.cvc,
          card_holder: card.holder.trim(),
        }),
      });

      const tokenData = await tokenRes.json();

      if (tokenData.status !== 'CREATED' || !tokenData.data?.id) {
        const msgs = tokenData.error?.messages;
        const detail = msgs
          ? Object.entries(msgs).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
          : tokenData.error?.type ?? JSON.stringify(tokenData);
        setError(`Error Wompi: ${detail}`);
        return;
      }

      const cardToken = tokenData.data.id;

      // PASO 2 — Enviar a nuestro backend para crear fuente de pago y cobrar $100
      const regRes  = await fetch('/api/payments/register-payment-method', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardToken,
          acceptanceToken:    tokens.acceptanceToken,
          acceptPersonalAuth: tokens.acceptPersonalAuth,
          plan:               selectedPlan,
        }),
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        setError(regData.error || 'Error al registrar el método de pago');
        return;
      }

      setSuccessMsg(regData.message);
      setView('success');

    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  }

  // ─────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const planActualData = PLANES.find(p => p.key === selectedPlan);
  const estadoActual   = subscription ? ESTADO_LABEL[subscription.status] : null;
  const isExpired      = subscription?.status === 'EXPIRED' || subscription?.status === 'CANCELLED';
  const hasCard        = !!subscription?.paymentSourceId;

  // ─────────────────────────────────────────────
  // VISTA: ÉXITO
  // ─────────────────────────────────────────────
  if (view === 'success') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-3">¡Todo listo!</h1>
          <p className="text-gray-400 mb-2">{successMsg}</p>
          <p className="text-gray-500 text-sm mb-8">
            En 14 días cobraremos automáticamente{' '}
            <span className="text-white font-medium">{formatPrecio(PLANES.find(p => p.key === selectedPlan)?.precio ?? 0)}/mes</span>
            {' '}a tu tarjeta registrada.
          </p>
          <button onClick={() => router.push('/barbershop')}
            className="w-full bg-yellow-400 text-gray-900 py-3 rounded-xl font-bold hover:bg-yellow-300 transition">
            Ir a mi panel
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // VISTA: FORMULARIO DE TARJETA
  // ─────────────────────────────────────────────
  if (view === 'payment' && selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">

        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button onClick={() => { setView('plans'); setError(''); }} className="text-gray-400 hover:text-white p-1">←</button>
            <div>
              <h1 className="text-lg font-bold">💳 Registrar método de pago</h1>
              <p className="text-xs text-gray-400">Plan {planActualData?.nombre} · {formatPrecio(planActualData?.precio ?? 0)}/mes</p>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-8">

          {/* Info trial */}
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mb-6">
            <p className="text-yellow-400 font-semibold text-sm mb-1">⏳ 14 días gratis</p>
            <p className="text-gray-300 text-sm">
              <strong>Hoy no se hace ningún cobro.</strong> Solo guardamos tu tarjeta.
              El primer cobro del plan se realizará al finalizar los 14 días de prueba.
            </p>
          </div>

          {!tokens ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              {error ? (
                <>
                  <p className="text-red-400 text-sm text-center">❌ {error}</p>
                  <button onClick={() => handleSelectPlan(selectedPlan!)}
                    className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition">
                    Reintentar
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  Conectando con Wompi...
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleRegistrarTarjeta} className="space-y-5">

              {/* ── Datos de tarjeta ── */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Número de tarjeta</label>
                <input
                  type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={e => setCard(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none tracking-widest"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Mes (MM)</label>
                  <input
                    type="text" inputMode="numeric" placeholder="06" maxLength={2}
                    value={card.expMonth}
                    onChange={e => setCard(p => ({ ...p, expMonth: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Año (YY)</label>
                  <input
                    type="text" inputMode="numeric" placeholder="29" maxLength={2}
                    value={card.expYear}
                    onChange={e => setCard(p => ({ ...p, expYear: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">CVC</label>
                  <input
                    type="text" inputMode="numeric" placeholder="123" maxLength={4}
                    value={card.cvc}
                    onChange={e => setCard(p => ({ ...p, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre del titular</label>
                <input
                  type="text" placeholder="Como aparece en la tarjeta"
                  value={card.holder}
                  onChange={e => setCard(p => ({ ...p, holder: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              {/* ── Checkboxes de aceptación (obligatorios por Wompi) ── */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Aceptación de términos</p>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={card.acceptTerms}
                    onChange={e => setCard(p => ({ ...p, acceptTerms: e.target.checked }))}
                    className="mt-0.5 accent-yellow-400 w-4 h-4 flex-shrink-0" />
                  <span className="text-sm text-gray-300">
                    He leído y acepto los{' '}
                    <a href={tokens.termsUrl} target="_blank" rel="noopener noreferrer"
                      className="text-yellow-400 underline hover:text-yellow-300">
                      Términos y Condiciones de Wompi
                    </a>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={card.acceptPersonalData}
                    onChange={e => setCard(p => ({ ...p, acceptPersonalData: e.target.checked }))}
                    className="mt-0.5 accent-yellow-400 w-4 h-4 flex-shrink-0" />
                  <span className="text-sm text-gray-300">
                    Autorizo el{' '}
                    <a href={tokens.personalDataUrl} target="_blank" rel="noopener noreferrer"
                      className="text-yellow-400 underline hover:text-yellow-300">
                      tratamiento de mis datos personales
                    </a>
                  </span>
                </label>
              </div>

              {/* ── Error ── */}
              {error && (
                <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                  ❌ {error}
                </div>
              )}

              {/* ── Submit ── */}
              <button type="submit" disabled={procesando}
                className="w-full bg-yellow-400 text-gray-900 py-4 rounded-xl font-bold text-sm hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {procesando ? (
                  <>
                    <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    Verificando tarjeta...
                  </>
                ) : (
                  `Registrar tarjeta y comenzar prueba gratis`
                )}
              </button>

              <p className="text-center text-xs text-gray-600">
                🔒 Datos procesados por Wompi · Tu tarjeta nunca pasa por nuestros servidores
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // VISTA: LISTA DE PLANES
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

        {/* Banner suscripción vencida */}
        {isExpired && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-4 rounded-xl mb-6 text-sm">
            ⚠️ <strong>Tu suscripción ha vencido.</strong> Selecciona un plan para renovar tu acceso y volver a usar todas las funciones.
          </div>
        )}

        {/* Plan actual */}
        {subscription && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8 flex items-center justify-between flex-wrap gap-3">
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
            <div className="flex items-center gap-3">
              {hasCard && (
                <span className="text-xs bg-green-900/40 text-green-400 border border-green-800 px-3 py-1.5 rounded-full">
                  ✅ Tarjeta registrada
                </span>
              )}
              {subscription.status === 'TRIAL' && (
                <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-3 py-1.5 rounded-full">
                  ⏳ Período de prueba activo
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error general */}
        {error && !view.includes('payment') && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm mb-6">
            ❌ {error}
          </div>
        )}

        {/* Título */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Elige tu plan</h2>
          <p className="text-gray-400">
            {hasCard
              ? 'Cambia de plan cuando quieras. El cambio aplica al próximo ciclo de cobro.'
              : '14 días gratis • Solo $100 COP de verificación hoy • Cancela cuando quieras'}
          </p>
        </div>

        {/* Cards de planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {PLANES.map(plan => {
            const esPlanActual  = subscription?.plan === plan.key && subscription?.status === 'ACTIVE';

            return (
              <div key={plan.key}
                className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all ${
                  plan.destacado
                    ? 'border-yellow-400 bg-gray-900 shadow-lg shadow-yellow-400/10'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                }`}>

                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white mb-3">{plan.nombre}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-white">{formatPrecio(plan.precio)}</span>
                    <span className="text-gray-400 text-sm mb-1">/mes</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-yellow-400 mt-0.5 flex-shrink-0">💈</span>
                    {plan.barberos}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-yellow-400 mt-0.5 flex-shrink-0">📸</span>
                    {plan.fotos} en galería
                  </li>
                  {FEATURES_COMUNES.map(f => (
                    <li key={f} className="text-sm text-gray-400">{f}</li>
                  ))}
                </ul>

                {esPlanActual ? (
                  <div className="w-full py-3 rounded-xl text-center text-sm font-semibold bg-green-900/30 text-green-400 border border-green-700">
                    ✓ Plan actual
                  </div>
                ) : (
                  <button onClick={() => handleSelectPlan(plan.key)}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                      plan.destacado
                        ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}>
                    {isExpired ? `Renovar con ${plan.nombre}` : `Elegir ${plan.nombre}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center space-y-2">
          <p className="text-gray-500 text-sm">
            🔒 Pagos seguros procesados por{' '}
            <span className="text-gray-300 font-medium">Wompi</span>
            {' '}· Acepta tarjetas de crédito y débito
          </p>
          <p className="text-gray-600 text-xs">
            Puedes cancelar en cualquier momento · Sin contratos
          </p>
        </div>

        {/* ── Cancelar suscripción ── */}
        {hasCard && (subscription?.status === 'ACTIVE' || subscription?.status === 'TRIAL') && (
          <div className="mt-10 border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm mb-3">¿Deseas cancelar tu suscripción?</p>
            <button onClick={() => setShowCancelModal(true)}
              className="text-red-400 hover:text-red-300 text-sm underline transition">
              Cancelar renovación automática
            </button>
          </div>
        )}

        {/* ── Mensaje de éxito ── */}
        {successMsg && (
          <div className="mt-6 bg-green-900/40 border border-green-700 text-green-300 px-4 py-3 rounded-xl text-sm text-center">
            ✅ {successMsg}
          </div>
        )}

      </div>

      {/* ── Modal confirmación cancelar ── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-white mb-2">¿Cancelar suscripción?</h2>
            <p className="text-gray-400 text-sm mb-2">
              {subscription?.status === 'TRIAL'
                ? 'Podrás seguir usando la app durante el período de prueba, pero no se hará el cobro al finalizar.'
                : subscription?.subscriptionEndDate
                  ? `Conservarás acceso hasta el ${new Date(subscription.subscriptionEndDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}. Después se suspenderá el servicio.`
                  : 'Conservarás acceso hasta que venza el período actual.'
              }
            </p>
            <p className="text-gray-500 text-xs mb-6">No se realizarán más cobros automáticos.</p>
            {error && <p className="text-red-400 text-sm mb-4">❌ {error}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowCancelModal(false); setError(''); }}
                className="flex-1 bg-gray-700 text-white py-3 rounded-xl text-sm hover:bg-gray-600 transition">
                Volver
              </button>
              <button onClick={handleCancelar} disabled={cancelando}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {cancelando
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Cancelando...</>
                  : 'Sí, cancelar'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
