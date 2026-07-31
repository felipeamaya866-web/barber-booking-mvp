// app/barbershop/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import dynamic from 'next/dynamic';

const QRCodeDisplay = dynamic(() => import('./components/QRCodeDisplay'), {
  ssr: false,
  loading: () => <button className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Cargando...</button>,
});

const AnalyticsDashboard = dynamic(() => import('./components/AnalyticsDashboard'), {
  ssr: false,
});

interface Barbershop {
  id: string; name: string; slug: string;
  address: string; phone: string;
  description: string | null; createdAt: string;
}

interface SubState {
  status:         string;
  chargeFailedAt: string | null;
  nextChargeAt:   string | null;
}

const ACTIONS = [
  { path: '/barbershop/agenda',     icon: '📅', label: 'Agenda',        sub: 'Gestionar citas'         },
  { path: '/barbershop/clients',    icon: '👥', label: 'Clientes',      sub: 'Ver y gestionar clientes'},
  { path: '/barbershop/services',   icon: '✂️', label: 'Servicios',     sub: 'Ver y crear servicios'   },
  { path: '/barbershop/combos',     icon: '📦', label: 'Combos',        sub: 'Paquetes de servicios'   },
  { path: '/barbershop/products',   icon: '🛍️', label: 'Productos',     sub: 'Productos en venta'      },
  { path: '/barbershop/promotions', icon: '🏷️', label: 'Promociones',   sub: 'Ofertas y descuentos'    },
  { path: '/barbershop/barbers',    icon: '💈', label: 'Mi Equipo',     sub: 'Gestionar barberos'      },
  { path: '/barbershop/stats',      icon: '📊', label: 'Estadísticas',  sub: 'Ingresos y métricas'     },
  { path: '/barbershop/settings',   icon: '⚙️', label: 'Configuración', sub: 'Editar barbería'         },
];

const GOLD = '#C9A84C';

export default function BarbershopHome() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [barbershop, setBarbershop]         = useState<Barbershop | null>(null);
  const [sub, setSub]                       = useState<SubState | null>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
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
      const [barbRes, settingsRes] = await Promise.all([
        fetch('/api/barbershop'),
        fetch('/api/barbershop/settings'),
      ]);
      const barbData = await barbRes.json();
      if (!barbRes.ok) throw new Error(barbData.error || 'Error al cargar barbería');
      if (!barbData.barbershop) { router.push('/barbershop/create'); return; }
      setBarbershop(barbData.barbershop);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSub({
          status:         settingsData.barbershop.subscriptionStatus,
          chargeFailedAt: settingsData.barbershop.chargeFailedAt,
          nextChargeAt:   settingsData.barbershop.nextChargeAt,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="rounded-2xl p-6 max-w-md" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <h2 className="text-white font-semibold mb-2">Error</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>{error}</p>
          <button onClick={loadBarbershop}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80 transition"
            style={{ backgroundColor: GOLD, color: '#000' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!barbershop) return null;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* ── Banner: cobro fallido ─────────────────────────────────── */}
        {sub?.chargeFailedAt && sub.status !== 'EXPIRED' && (() => {
          const limite = new Date(new Date(sub.chargeFailedAt).getTime() + 3 * 24 * 60 * 60 * 1000);
          const dias   = Math.max(0, Math.ceil((limite.getTime() - Date.now()) / 86_400_000));
          return (
            <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              style={{ backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)' }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#FDE68A' }}>⚠️ No pudimos cobrar tu suscripción</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(253,230,138,0.7)' }}>
                  {dias > 0 ? `Tienes ${dias} día${dias !== 1 ? 's' : ''} antes de la suspensión.` : 'Hoy es el último día.'}
                </p>
              </div>
              <a href="/barbershop/plans"
                className="shrink-0 px-4 py-2 rounded-lg text-xs font-bold hover:opacity-80 transition"
                style={{ backgroundColor: GOLD, color: '#000' }}>
                Actualizar tarjeta
              </a>
            </div>
          );
        })()}

        {/* ── Banner: suscripción expirada ──────────────────────────── */}
        {(sub?.status === 'EXPIRED' || sub?.status === 'CANCELLED') && (
          <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div>
              <p className="font-semibold text-sm text-red-400">Suscripción vencida</p>
              <p className="text-xs mt-0.5 text-red-400/70">Renueva tu plan para usar todas las funciones.</p>
            </div>
            <a href="/barbershop/plans"
              className="shrink-0 px-4 py-2 rounded-lg text-xs font-bold hover:opacity-80 transition"
              style={{ backgroundColor: GOLD, color: '#000' }}>
              Renovar plan
            </a>
          </div>
        )}

        {/* ── Página pública ────────────────────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
                <h3 className="font-bold text-white">Tu Página Pública</h3>
              </div>
              <p className="text-xs pl-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Comparte este enlace con tus clientes
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80 border"
                style={{ borderColor: '#2a2a2a', color: 'rgba(255,255,255,0.7)', backgroundColor: '#1a1a1a' }}>
                Ver página ↗
              </a>
              <button onClick={copyPublicLink}
                className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80 border"
                style={{ borderColor: '#2a2a2a', color: showLinkCopied ? GOLD : 'rgba(255,255,255,0.7)', backgroundColor: '#1a1a1a' }}>
                {showLinkCopied ? '✓ Copiado' : 'Copiar link'}
              </button>
              <QRCodeDisplay url={publicUrl} barbershopName={barbershop.name} />
            </div>
          </div>
          <div className="px-4 py-2.5 rounded-xl text-sm font-mono truncate"
            style={{ backgroundColor: '#0a0a0a', color: GOLD, border: `1px solid ${GOLD}25` }}>
            {publicUrl}
          </div>
        </div>

        {/* ── Analytics ─────────────────────────────────────────────── */}
        <AnalyticsDashboard />

        {/* ── Acciones Rápidas ──────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e1e1e' }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
              <h2 className="text-sm font-semibold text-white">Acceso rápido</h2>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ACTIONS.map(action => (
              <button key={action.path} onClick={() => router.push(action.path)}
                className="flex items-center gap-3 p-4 rounded-xl text-left group transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}50`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}25` }}>
                  {action.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate group-hover:text-[#C9A84C] transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{action.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Info de la barbería ───────────────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
            <h2 className="text-sm font-semibold text-white">Información de la barbería</h2>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nombre',    value: barbershop.name },
              { label: 'Teléfono', value: barbershop.phone },
              { label: 'Dirección', value: barbershop.address, full: true },
              ...(barbershop.description ? [{ label: 'Descripción', value: barbershop.description, full: true }] : []),
            ].map(item => (
              <div key={item.label} className={item.full ? 'sm:col-span-2' : ''}>
                <dt className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {item.label}
                </dt>
                <dd className="text-sm text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

      </div>
    </div>
  );
}
