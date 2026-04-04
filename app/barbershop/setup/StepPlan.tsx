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
    id: 'LITE',
    name: 'Lite',
    price: 29900,
    emoji: '🌟',
    color: 'blue',
    features: [
      '1 barbero',
      '3-10 fotos en galería',
      'Página web personalizada',
      'Gestión de citas',
      'Estadísticas básicas',
      'Soporte por email',
    ],
    recommended: false,
  },
  {
    id: 'PRIME',
    name: 'Prime',
    price: 49900,
    emoji: '⭐',
    color: 'purple',
    features: [
      'Hasta 2 barberos',
      '3-20 fotos en galería',
      'Página web personalizada',
      'Gestión de citas avanzada',
      'Estadísticas completas',
      'Códigos QR personalizados',
      'Soporte prioritario',
    ],
    recommended: true,
  },
  {
    id: 'ELITE',
    name: 'Elite',
    price: 79900,
    emoji: '💎',
    color: 'yellow',
    features: [
      'Barberos ilimitados',
      '3-40 fotos en galería',
      'Página web premium',
      'Sistema completo de citas',
      'Analytics avanzado',
      'Sistema de reseñas',
      'Múltiples locales',
      'Soporte 24/7',
    ],
    recommended: false,
  },
] as const;

export default function StepPlan({ data, onUpdate, onBack, onSubmit, loading }: Props) {
  const selectedPlan = data.plan;
  const photosCount = data.photos.length;

  const validatePhotosForPlan = (planId: string) => {
    const limits = {
      LITE: 10,
      PRIME: 20,
      ELITE: 40,
    };
    const limit = limits[planId as keyof typeof limits];
    return photosCount <= limit;
  };

  const handlePlanSelect = (planId: 'LITE' | 'PRIME' | 'ELITE') => {
    if (!validatePhotosForPlan(planId)) {
      alert(`Has subido ${photosCount} fotos, pero el plan ${planId} solo permite ${planId === 'LITE' ? 10 : planId === 'PRIME' ? 20 : 40}. Por favor, elimina algunas fotos o elige un plan superior.`);
      return;
    }
    onUpdate({ plan: planId });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getColorClasses = (color: string, selected: boolean) => {
    const colors = {
      blue: selected
        ? 'border-blue-600 bg-blue-50'
        : 'border-gray-200 hover:border-blue-300',
      purple: selected
        ? 'border-purple-600 bg-purple-50'
        : 'border-gray-200 hover:border-purple-300',
      yellow: selected
        ? 'border-yellow-500 bg-yellow-50'
        : 'border-gray-200 hover:border-yellow-300',
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          💳 Elige tu Plan
        </h2>
        <p className="text-gray-600">
          Selecciona el plan que mejor se adapte a tu barbería
        </p>
        <div className="mt-2 inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
          🎉 14 días de prueba gratis en todos los planes
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const canSelect = validatePhotosForPlan(plan.id);

          return (
            <button
              key={plan.id}
              onClick={() => handlePlanSelect(plan.id as 'LITE' | 'PRIME' | 'ELITE')}
              disabled={!canSelect}
              className={`
                relative p-6 rounded-2xl border-2 transition text-left
                ${getColorClasses(plan.color, isSelected)}
                ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${plan.recommended ? 'ring-2 ring-purple-600 ring-offset-2' : ''}
              `}
            >
              {/* Recommended Badge */}
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  RECOMENDADO
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{plan.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-gray-600">/mes</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Select Button */}
              <div className={`
                w-full py-2 rounded-lg font-medium text-center transition
                ${isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}>
                {isSelected ? '✓ Seleccionado' : 'Seleccionar'}
              </div>

              {/* Warning if too many photos */}
              {!canSelect && (
                <div className="mt-2 text-xs text-red-600 text-center">
                  Has subido {photosCount} fotos. Este plan permite máximo {plan.id === 'LITE' ? 10 : plan.id === 'PRIME' ? 20 : 40}.
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información importante:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Todos los planes incluyen 14 días de prueba gratis</li>
          <li>Puedes cambiar de plan en cualquier momento</li>
          <li>Sin permanencia mínima, cancela cuando quieras</li>
          <li>Soporte técnico incluido en todos los planes</li>
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
        >
          ← Atrás
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando tu página...
            </span>
          ) : (
            '🚀 Finalizar y Crear mi Página'
          )}
        </button>
      </div>
    </div>
  );
}