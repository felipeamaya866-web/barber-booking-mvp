// app/barbershop/page.tsx
// Dashboard principal de la barbería

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

const QRCodeDisplay = dynamic(() => import('./components/QRCodeDisplay'), {
  ssr: false,
  loading: () => <button className="px-4 py-2 bg-purple-400 text-white rounded-lg">Cargando...</button>,
});

const AnalyticsDashboard = dynamic(() => import('./components/AnalyticsDashboard'), {
  ssr: false,
});

interface Barbershop {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  description: string | null;
  createdAt: string;
}

export default function BarbershopHome() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLinkCopied, setShowLinkCopied] = useState(false);

  const publicUrl = barbershop ? `${window.location.origin}/b/${barbershop.slug}` : '';

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setShowLinkCopied(true);
    setTimeout(() => setShowLinkCopied(false), 2000);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      loadBarbershop();
    }
  }, [status, router]);

  const loadBarbershop = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/barbershop');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar barbería');
      if (!data.barbershop) { router.push('/barbershop/create'); return; }
      setBarbershop(data.barbershop);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button onClick={loadBarbershop} className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!barbershop) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{barbershop.name}</h1>
              <p className="text-xs sm:text-sm text-gray-500">{barbershop.address}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-gray-600">{session?.user?.name}</span>
              <button
                onClick={() => router.push('/api/auth/signout')}
                className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Public Link Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-lg mb-1">🌐 Tu Página Pública</h3>
              <p className="text-blue-100 text-sm">Comparte este link con tus clientes</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition text-center"
              >
                👁️ Ver Mi Página
              </a>
              <button
                onClick={copyPublicLink}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400 transition"
              >
                {showLinkCopied ? '✓ Copiado!' : '📋 Copiar Link'}
              </button>
              <QRCodeDisplay url={publicUrl} barbershopName={barbershop.name} />
            </div>
          </div>
          <div className="mt-3 bg-white bg-opacity-20 rounded px-3 py-2 text-sm font-mono truncate">
            {publicUrl}
          </div>
        </div>

        {/* Analytics */}
        <div className="mb-6 sm:mb-8">
          <AnalyticsDashboard />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Servicios */}
            <button
              onClick={() => router.push('/barbershop/services')}
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition text-left"
            >
              <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Gestionar Servicios</p>
                <p className="text-sm text-gray-500">Ver y crear servicios</p>
              </div>
            </button>

            {/* Agenda */}
            <button
              onClick={() => router.push('/barbershop/agenda')}
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition text-left"
            >
              <div className="bg-green-100 p-3 rounded-lg flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Ver Agenda</p>
                <p className="text-sm text-gray-500">Gestionar citas</p>
              </div>
            </button>

            {/* ✅ Mi Equipo */}
            <button
              onClick={() => router.push('/barbershop/barbers')}
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition text-left"
            >
              <div className="bg-orange-100 p-3 rounded-lg flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Mi Equipo</p>
                <p className="text-sm text-gray-500">Gestionar barberos</p>
              </div>
            </button>

            {/* Configuración */}
            <button
              onClick={() => router.push('/barbershop/settings')}
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition text-left"
            >
              <div className="bg-purple-100 p-3 rounded-lg flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Configuración</p>
                <p className="text-sm text-gray-500">Editar barbería</p>
              </div>
            </button>

            {/* Planes y pagos */}
            <button
              onClick={() => router.push('/barbershop/plans')}
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition text-left"
            >
              <div className="bg-yellow-100 p-3 rounded-lg flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Planes y pagos</p>
                <p className="text-sm text-gray-500">Gestionar suscripción</p>
              </div>
            </button>

          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Barbería</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nombre</dt>
              <dd className="mt-1 text-sm text-gray-900">{barbershop.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
              <dd className="mt-1 text-sm text-gray-900">{barbershop.phone}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Dirección</dt>
              <dd className="mt-1 text-sm text-gray-900">{barbershop.address}</dd>
            </div>
            {barbershop.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                <dd className="mt-1 text-sm text-gray-900">{barbershop.description}</dd>
              </div>
            )}
          </dl>
        </div>

      </main>
    </div>
  );
}