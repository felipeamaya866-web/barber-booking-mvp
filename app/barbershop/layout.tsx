'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Rutas que NUNCA se bloquean (necesitan estar accesibles para renovar)
const RUTAS_LIBRES = [
  '/barbershop/plans',
  '/barbershop/plans/resultado',
];

export default function BarbershopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus]   = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch('/api/barbershop/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.barbershop?.subscriptionStatus) {
          setStatus(data.barbershop.subscriptionStatus);
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [pathname]);

  // No bloquear rutas libres (plans, resultado)
  const esRutaLibre = RUTAS_LIBRES.some(r => pathname.startsWith(r));

  // Mientras carga no bloqueamos para evitar flash
  if (!checked || esRutaLibre) return <>{children}</>;

  const expirada = status === 'EXPIRED' || status === 'CANCELLED';

  if (expirada) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-3">Suscripción vencida</h1>
          <p className="text-gray-400 mb-6">
            Tu suscripción ha vencido y el acceso al panel ha sido suspendido.
            Renueva tu plan para volver a usar todas las funciones.
          </p>
          <a href="/barbershop/plans"
            className="inline-block w-full bg-yellow-400 text-gray-900 py-4 rounded-xl font-bold text-sm hover:bg-yellow-300 transition mb-3">
            Renovar plan ahora
          </a>
          <a href="/" className="block text-sm text-gray-500 hover:text-gray-400 transition">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
