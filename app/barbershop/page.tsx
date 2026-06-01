// app/barbershop/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import dynamic from 'next/dynamic';

const QRCodeDisplay = dynamic(() => import('./components/QRCodeDisplay'), {
  ssr: false,
  loading: () => <button className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm">Cargando...</button>,
});

const AnalyticsDashboard = dynamic(() => import('./components/AnalyticsDashboard'), {
  ssr: false,
});

interface Barbershop {
  id: string; name: string; slug: string;
  address: string; phone: string;
  description: string | null; createdAt: string;
}

const ACTIONS = [
  { path: '/barbershop/services', icon: '✂️', label: 'Gestionar Servicios',  sub: 'Ver y crear servicios',    bg: 'bg-blue-900/30',   text: 'text-blue-400' },
  { path: '/barbershop/agenda',   icon: '📅', label: 'Ver Agenda',           sub: 'Gestionar citas',           bg: 'bg-green-900/30',  text: 'text-green-400' },
  { path: '/barbershop/barbers',  icon: '👥', label: 'Mi Equipo',            sub: 'Gestionar barberos',        bg: 'bg-orange-900/30', text: 'text-orange-400' },
  { path: '/barbershop/settings', icon: '⚙️', label: 'Configuración',        sub: 'Editar barbería',           bg: 'bg-purple-900/30', text: 'text-purple-400' },
  { path: '/barbershop/plans',    icon: '💳', label: 'Planes y pagos',       sub: 'Gestionar suscripción',     bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
  { path: '/barbershop/stats',    icon: '📊', label: 'Estadísticas',         sub: 'Ingresos y métricas',       bg: 'bg-indigo-900/30', text: 'text-indigo-400' },
];

export default function BarbershopHome() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [barbershop, setBarbershop]     = useState<Barbershop | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [showLinkCopied, setShowLinkCopied] = useState(false);

  const publicUrl = barbershop && typeof window !== 'undefined'
    ? `${window.location.origin}/b/${barbershop.slug}` : '';

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setShowLinkCopied(true);
    setTimeout(() => setShowLinkCopied(false), 2000);
  };

  useEffect(() => {
    if (status === 'unauthenticated') { signOut({ callbackUrl: '/login' }); return; }
    if (status === 'authenticated')   { loadBarbershop(); }
  }, [status]);

  const loadBarbershop = async () => {
    try {
      setLoading(true);
      const res  = await fetch('/api/barbershop');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4" />
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-6 max-w-md">
          <h2 className="text-red-300 font-semibold mb-2">Error</h2>
          <p className="text-red-400">{error}</p>
          <button onClick={loadBarbershop} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Reintentar</button>
        </div>
      </div>
    );
  }

  if (!barbershop) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-lg flex items-center justify-center text-base flex-shrink-0">✂️</div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white leading-tight">{barbershop.name}</h1>
                <p className="text-xs text-gray-400">{barbershop.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-gray-400">{session?.user?.name}</span>
              <button onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-xs sm:text-sm text-red-400 hover:text-red-300 font-medium transition">
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* ── Banner Página Pública ── */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl shadow-lg p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-lg text-white">🌐 Tu Página Pública</h3>
              <p className="text-blue-200 text-sm">Comparte este link con tus clientes</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition border border-white/20 text-center">
                👁️ Ver Mi Página
              </a>
              <button onClick={copyPublicLink}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition border border-white/20">
                {showLinkCopied ? '✓ Copiado!' : '📋 Copiar Link'}
              </button>
              <QRCodeDisplay url={publicUrl} barbershopName={barbershop.name} />
            </div>
          </div>
          {/* ✅ Fondo oscuro para que el link se vea */}
          <div className="bg-black/30 rounded-xl px-4 py-2.5 text-sm font-mono text-white truncate border border-white/10">
            {publicUrl}
          </div>
        </div>

        {/* ── Analytics ── */}
        <AnalyticsDashboard />

        {/* ── Acciones Rápidas ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-base font-semibold text-white">⚡ Acciones Rápidas</h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ACTIONS.map(action => (
              <button key={action.path} onClick={() => router.push(action.path)}
                className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl transition text-left group">
                <div className={`${action.bg} p-3 rounded-xl flex-shrink-0`}>
                  <span className="text-xl">{action.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-white text-sm group-hover:text-yellow-400 transition">{action.label}</p>
                  <p className="text-xs text-gray-400">{action.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Info Card ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">🏪 Información de la Barbería</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nombre',    value: barbershop.name },
              { label: 'Teléfono', value: barbershop.phone },
              { label: 'Dirección', value: barbershop.address, full: true },
              ...(barbershop.description ? [{ label: 'Descripción', value: barbershop.description, full: true }] : []),
            ].map(item => (
              <div key={item.label} className={item.full ? 'sm:col-span-2' : ''}>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{item.label}</dt>
                <dd className="mt-1 text-sm text-gray-200">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

      </main>
    </div>
  );
}