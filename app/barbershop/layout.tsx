'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

const GOLD = '#C9A84C';

// Pages that render without the admin sidebar
const NO_SIDEBAR = ['/barbershop/plans', '/barbershop/create', '/barbershop/setup'];

const NAV = [
  { href: '/barbershop',          label: 'Inicio',         icon: Home },
  { href: '/barbershop/agenda',   label: 'Agenda',         icon: Calendar },
  { href: '/barbershop/services', label: 'Servicios',      icon: Scissors },
  { href: '/barbershop/barbers',  label: 'Mi Equipo',      icon: Users },
  { href: '/barbershop/stats',    label: 'Estadísticas',   icon: BarChart },
  { href: '/barbershop/settings', label: 'Configuración',  icon: Settings },
];

interface ShopInfo {
  name: string;
  slug: string;
  plan: string;
  subscriptionStatus: string;
}

export default function BarbershopLayout({ children }: { children: React.ReactNode }) {
  const pathname                    = usePathname();
  const { data: session }           = useSession();
  const [info, setInfo]             = useState<ShopInfo | null>(null);
  const [checked, setChecked]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const noSidebar  = NO_SIDEBAR.some(r => pathname.startsWith(r));
  const isExpired  = info?.subscriptionStatus === 'EXPIRED' || info?.subscriptionStatus === 'CANCELLED';
  const isFreeRoute = NO_SIDEBAR.some(r => pathname.startsWith(r));

  useEffect(() => {
    fetch('/api/barbershop/settings')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.barbershop) {
          setInfo({
            name:               data.barbershop.name,
            slug:               data.barbershop.slug,
            plan:               data.barbershop.plan,
            subscriptionStatus: data.barbershop.subscriptionStatus,
          });
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [pathname]);

  // ── Spinner while fetching ──────────────────────────────────────────────
  if (!checked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
      </div>
    );
  }

  // ── Expired: block access except free routes ────────────────────────────
  if (isExpired && !isFreeRoute) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-6">
            <Lock />
          </div>
          <h1 className="text-xl font-bold mb-3">Suscripción vencida</h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Tu suscripción ha vencido. Renueva tu plan para acceder al panel.
          </p>
          <a href="/barbershop/plans"
            className="block w-full py-3.5 rounded-xl font-bold text-sm text-black mb-3 hover:opacity-90 transition"
            style={{ backgroundColor: GOLD }}>
            Renovar plan
          </a>
          <a href="/" className="text-xs hover:underline" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  // ── No sidebar: setup / create / plans ────────────────────────────────
  if (noSidebar) return <>{children}</>;

  // ── Sidebar layout ────────────────────────────────────────────────────
  const publicPath = info?.slug ? `barberbooking.site/b/${info.slug}` : null;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 z-40 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#111111', borderRight: '1px solid #1e1e1e' }}
      >
        {/* Brand */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #8B6B14 100%)` }}
            >
              <ScissorsBold />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[3px] uppercase mb-0.5" style={{ color: GOLD }}>
                Admin
              </p>
              <p className="text-white font-bold text-sm leading-tight truncate">
                {info?.name || 'Mi Barbería'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const exact  = href === '/barbershop';
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={
                  active
                    ? { backgroundColor: GOLD, color: '#000000' }
                    : { color: 'rgba(255,255,255,0.45)' }
                }
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
              >
                <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                  <Icon active={active} />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom info */}
        <div className="px-4 py-4 space-y-3" style={{ borderTop: '1px solid #1e1e1e' }}>
          {info && (
            <div className="px-3 py-2.5 rounded-xl" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
              <p className="text-[10px] mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Plan activo</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">{info.plan}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-[10px] text-green-400">Activo</p>
                </div>
              </div>
            </div>
          )}

          {publicPath && (
            <div>
              <p className="text-[10px] mb-1 px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Tu página web</p>
              <a
                href={`https://${publicPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-1 text-xs font-medium hover:underline truncate transition"
                style={{ color: GOLD }}
              >
                <span className="truncate">{publicPath}</span>
                <ExternalLink />
              </a>
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = '#1a1a1a'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <LogOut />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header
          className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-20"
          style={{ backgroundColor: '#111111', borderBottom: '1px solid #1e1e1e' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="text-white p-1 rounded-lg hover:bg-white/10 transition">
            <Menu />
          </button>
          <p className="text-sm font-bold text-white">{info?.name || 'Admin'}</p>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #8B6B14 100%)` }}
          >
            <ScissorsBold />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

// ── SVG Icon components ────────────────────────────────────────────────────
function Home({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );
}
function Calendar({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  );
}
function Scissors({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}
function Users({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );
}
function BarChart({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  );
}
function Settings({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}
function ScissorsBold() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}
function Lock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
function ExternalLink() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 flex-shrink-0">
      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
  );
}
function LogOut() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
    </svg>
  );
}
function Menu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="w-5 h-5">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
