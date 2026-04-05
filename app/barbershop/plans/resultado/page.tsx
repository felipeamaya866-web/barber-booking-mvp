// app/barbershop/plans/resultado/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Estado = 'cargando' | 'aprobado' | 'rechazado' | 'pendiente';

function ResultadoContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [estado, setEstado] = useState<Estado>('cargando');

  useEffect(() => {
    const transactionId = searchParams.get('id');
    const env           = searchParams.get('env');

    if (!transactionId) {
      router.push('/barbershop/plans');
      return;
    }

    verificarTransaccion(transactionId, env);
  }, [searchParams, router]);

  async function verificarTransaccion(transactionId: string, env: string | null) {
    try {
      const res  = await fetch(`/api/payments/verify?id=${transactionId}&env=${env || 'test'}`);
      const data = await res.json();
      const status = data.status as string;

      if (status === 'APPROVED') {
        setEstado('aprobado');
        setTimeout(() => router.push('/barbershop'), 4000);
      } else if (status === 'DECLINED' || status === 'ERROR' || status === 'VOIDED') {
        setEstado('rechazado');
      } else {
        setEstado('pendiente');
      }
    } catch {
      setEstado('pendiente');
    }
  }

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verificando pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">

        {estado === 'aprobado' && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-white mb-2">¡Pago exitoso!</h1>
            <p className="text-gray-400 mb-6">Tu plan ha sido activado. Redirigiendo...</p>
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <Link href="/barbershop" className="text-yellow-400 text-sm hover:underline">
              Ir al dashboard ahora →
            </Link>
          </>
        )}

        {estado === 'rechazado' && (
          <>
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-white mb-2">Pago no procesado</h1>
            <p className="text-gray-400 mb-6">El pago fue rechazado. Puedes intentarlo de nuevo.</p>
            <div className="flex flex-col gap-3">
              <Link href="/barbershop/plans"
                className="w-full bg-yellow-400 text-gray-900 py-3 rounded-xl font-bold text-sm hover:bg-yellow-300 transition text-center">
                Intentar de nuevo
              </Link>
              <Link href="/barbershop" className="text-gray-400 text-sm hover:text-white transition">
                Volver al dashboard
              </Link>
            </div>
          </>
        )}

        {estado === 'pendiente' && (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-white mb-2">Pago en proceso</h1>
            <p className="text-gray-400 mb-6">Tu pago está siendo verificado. En unos minutos se activará tu plan.</p>
            <Link href="/barbershop"
              className="w-full bg-gray-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-600 transition inline-block">
              Volver al dashboard
            </Link>
          </>
        )}

      </div>
    </div>
  );
}

// ✅ Suspense boundary requerido por Next.js para useSearchParams
export default function ResultadoPagoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResultadoContent />
    </Suspense>
  );
}