// app/barbershop/setup/StepPlan.tsx
'use client';

interface Props {
  data: { plan: 'LITE' | 'PRIME' | 'ELITE'; photos: string[] };
  onUpdate: (data: any) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
}

const PLANS = [
  {
    id: 'LITE', name: 'Lite', price: 29900, emoji: '🌟',
    features: ['1 barbero', '3-10 fotos en galería', 'Página web personalizada', 'Gestión de citas', 'Estadísticas básicas', 'Soporte por email'],
    recommended: false,
    accentColor: '#3B82F6',
  },
  {
    id: 'PRIME', name: 'Prime', price: 49900, emoji: '⭐',
    features: ['Hasta 2 barberos', '3-20 fotos en galería', 'Página web personalizada', 'Gestión de citas avanzada', 'Estadísticas completas', 'Códigos QR', 'Soporte prioritario'],
    recommended: true,
    accentColor: '#C9A84C',
  },
  {
    id: 'ELITE', name: 'Elite', price: 79900, emoji: '💎',
    features: ['Barberos ilimitados', '3-40 fotos en galería', 'Página web premium', 'Sistema completo de citas', 'Analytics avanzado', 'Sistema de reseñas', 'Soporte 24/7'],
    recommended: false,
    accentColor: '#8B5CF6',
  },
] as const;

export default function StepPlan({ data, onUpdate, onBack, onSubmit, loading }: Props) {
  const selectedPlan = data.plan;
  const photosCount  = data.photos.length;

  const canSelect = (planId: string) => {
    const limits = { LITE: 10, PRIME: 20, ELITE: 40 };
    return photosCount <= limits[planId as keyof typeof limits];
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">💳 Elige tu Plan</h2>
        <p className="text-gray-400">Selecciona el plan que mejor se adapte a tu barbería</p>
        <div className="mt-3 inline-block bg-green-900/40 text-green-400 border border-green-800 px-4 py-2 rounded-full text-sm font-medium">
          🎉 14 días de prueba gratis en todos los planes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const isSelected = selectedPlan === plan.id;
          const available  = canSelect(plan.id);
          return (
            <button key={plan.id} onClick={() => available && onUpdate({ plan: plan.id })}
              disabled={!available}
              className={`relative p-6 rounded-2xl border-2 transition text-left ${
                isSelected
                  ? 'border-yellow-400 bg-yellow-400/5'
                  : available
                    ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    : 'border-gray-800 bg-gray-800/50 opacity-50 cursor-not-allowed'
              } ${plan.recommended ? 'ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-gray-900' : ''}`}>

              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                  RECOMENDADO
                </div>
              )}

              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{plan.emoji}</div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-white">{formatPrice(plan.price)}</span>
                  <span className="text-gray-500">/mes</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start text-sm text-gray-300">
                    <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div className={`w-full py-2 rounded-lg font-medium text-center transition ${
                isSelected ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300'
              }`}>
                {isSelected ? '✓ Seleccionado' : 'Seleccionar'}
              </div>

              {!available && (
                <p className="mt-2 text-xs text-red-400 text-center">
                  Has subido {photosCount} fotos — máximo {plan.id === 'LITE' ? 10 : plan.id === 'PRIME' ? 20 : 40}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h3 className="font-semibold text-gray-200 mb-2">ℹ️ Información importante:</h3>
        <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
          <li>Todos los planes incluyen 14 días de prueba gratis</li>
          <li>Puedes cambiar de plan en cualquier momento</li>
          <li>Sin permanencia mínima, cancela cuando quieras</li>
          <li>Soporte técnico incluido en todos los planes</li>
        </ul>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onBack} disabled={loading}
          className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg font-medium hover:bg-gray-700 border border-gray-700 disabled:opacity-50 transition">
          ← Atrás
        </button>
        <button onClick={onSubmit} disabled={loading}
          className="px-8 py-3 bg-yellow-400 text-gray-900 rounded-lg font-bold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2">
          {loading
            ? <><span className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />Creando tu página...</>
            : '🚀 Finalizar y Crear mi Página'
          }
        </button>
      </div>
    </div>
  );
}