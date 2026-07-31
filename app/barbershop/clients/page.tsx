'use client';

import { useEffect, useState, useMemo } from 'react';

const GOLD = '#C9A84C';

interface ClientAppointment {
  id:        string;
  date:      string;
  attended:  boolean | null;
  status:    string;
  service:   { name: string; price: number };
  barber:    { name: string };
  guestName: string | null;
}

interface Client {
  key:         string;
  clientId:    string | null;
  guestName:   string | null;
  guestPhone:  string | null;
  name:        string;
  email:       string | null;
  image:       string | null;
  birthday:    string | null;
  phone:       string | null;
  visits:      number;
  lastVisit:   string;
  firstVisit:  string;
  totalSpent:  number;
  appointments: ClientAppointment[];
}

type Filter = 'all' | 'loyal' | 'lapsed' | 'birthday' | 'today';

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: 'all',      label: 'Todos',      icon: '👥' },
  { key: 'today',    label: 'Hoy',        icon: '📅' },
  { key: 'loyal',    label: 'Frecuentes', icon: '⭐' },
  { key: 'lapsed',   label: 'Sin volver', icon: '😴' },
  { key: 'birthday', label: 'Cumpleaños', icon: '🎂' },
];

function formatPrice(p: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p);
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysSince(str: string) {
  return Math.floor((Date.now() - new Date(str).getTime()) / 86400000);
}

export default function ClientsPage() {
  const [clients, setClients]       = useState<Client[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<Filter>('all');
  const [search, setSearch]         = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'attended' | 'noshow'>('all');

  useEffect(() => { loadClients(); }, [filter]);

  async function loadClients() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/barbershop/clients?filter=${filter}`);
      const data = await res.json();
      if (res.ok) setClients(data.clients);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  }, [clients, search]);

  // Para la vista de hoy: filtrar citas de hoy con asistencia
  const todayApts = useMemo(() => {
    if (filter !== 'today') return [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return filtered.flatMap(c =>
      c.appointments
        .filter(a => a.date.startsWith(todayStr))
        .map(a => ({ ...a, client: c }))
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filtered, filter]);

  const filteredTodayApts = useMemo(() => {
    if (attendanceFilter === 'attended')  return todayApts.filter(a => a.attended === true);
    if (attendanceFilter === 'noshow')    return todayApts.filter(a => a.attended === false);
    return todayApts;
  }, [todayApts, attendanceFilter]);

  const todayIncome   = todayApts.filter(a => a.attended === true).reduce((s, a) => s + a.service.price, 0);
  const todayNoShows  = todayApts.filter(a => a.attended === false).length;
  const todayPending  = todayApts.filter(a => a.attended === null).length;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: GOLD }} />
          <h1 className="text-lg font-bold text-white">Gestión de clientes</h1>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setSearch(''); }}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition"
              style={filter === f.key
                ? { backgroundColor: GOLD, color: '#000' }
                : { backgroundColor: '#111111', color: 'rgba(255,255,255,0.5)', border: '1px solid #1e1e1e' }}>
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Buscador (solo en "Todos") */}
        {filter !== 'today' && (
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }} />
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
          </div>
        ) : filter === 'today' ? (
          /* ── Vista de hoy: lista de asistencia ──────────────────── */
          <div className="space-y-4">

            {/* Resumen del día */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Asistieron', value: todayApts.filter(a => a.attended === true).length, color: '#86efac', bg: 'rgba(34,197,94,0.08)' },
                { label: 'No asistieron', value: todayNoShows, color: '#fca5a5', bg: 'rgba(239,68,68,0.08)' },
                { label: 'Sin registrar', value: todayPending, color: GOLD, bg: `${GOLD}10` },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: stat.bg, border: `1px solid ${stat.color}22` }}>
                  <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {todayIncome > 0 && (
              <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: `1px solid ${GOLD}30` }}>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: GOLD }} />
                  <span className="text-sm font-semibold text-white">Ingresos del día (asistidos)</span>
                </div>
                <span className="text-base font-black" style={{ color: GOLD }}>{formatPrice(todayIncome)}</span>
              </div>
            )}

            {/* Filtro asistencia */}
            <div className="flex gap-2">
              {[
                { key: 'all' as const,       label: 'Todos' },
                { key: 'attended' as const,  label: '✓ Asistieron' },
                { key: 'noshow' as const,    label: '✗ No asistieron' },
              ].map(f => (
                <button key={f.key} onClick={() => setAttendanceFilter(f.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                  style={attendanceFilter === f.key
                    ? { backgroundColor: GOLD, color: '#000' }
                    : { backgroundColor: '#111111', color: 'rgba(255,255,255,0.45)', border: '1px solid #1e1e1e' }}>
                  {f.label}
                </button>
              ))}
            </div>

            {filteredTodayApts.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
                <p className="text-3xl mb-2">📭</p>
                <p style={{ color: 'rgba(255,255,255,0.4)' }} className="text-sm">Sin citas registradas para hoy</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTodayApts.map(apt => {
                  const hora = new Date(apt.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
                  return (
                    <div key={apt.id} className="rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: '#111111', border: '1px solid #1e1e1e',
                        borderLeft: `3px solid ${apt.attended === true ? '#86efac' : apt.attended === false ? '#fca5a5' : GOLD}`,
                      }}>
                      <div className="p-4 flex items-center gap-3">
                        <div className="text-center w-12 flex-shrink-0">
                          <p className="font-bold text-sm" style={{ color: GOLD }}>{hora}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{apt.client.name}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {apt.service.name} · {apt.barber.name}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold" style={{ color: apt.attended === true ? '#86efac' : apt.attended === false ? '#fca5a5' : 'rgba(255,255,255,0.4)' }}>
                            {apt.attended === true ? '✓ Asistió' : apt.attended === false ? '✗ No asistió' : 'Sin registrar'}
                          </p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatPrice(apt.service.price)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── Vista de clientes ────────────────────────────────── */
          <>
            {/* Contador */}
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
              {filter === 'loyal'    && ' frecuentes (3+ visitas)'}
              {filter === 'lapsed'   && ' sin visita en 60+ días'}
              {filter === 'birthday' && ' con cumpleaños hoy'}
            </p>

            {filtered.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
                <p className="text-4xl mb-3">
                  {filter === 'birthday' ? '🎂' : filter === 'lapsed' ? '😴' : filter === 'loyal' ? '⭐' : '👥'}
                </p>
                <p className="text-white font-semibold mb-1">
                  {filter === 'birthday' ? 'Nadie cumple años hoy'
                    : filter === 'lapsed' ? 'Sin clientes inactivos'
                    : filter === 'loyal' ? 'Sin clientes frecuentes aún'
                    : 'Sin clientes registrados'}
                </p>
                {filter === 'loyal' && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Los clientes con 3 o más visitas aparecerán aquí</p>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map(c => {
                  const days = daysSince(c.lastVisit);
                  return (
                    <button key={c.key} onClick={() => setSelectedClient(c)}
                      className="w-full rounded-xl p-4 text-left transition hover:opacity-80"
                      style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 font-bold text-sm"
                          style={{ backgroundColor: `${GOLD}18`, color: GOLD }}>
                          {c.image ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" /> : c.name[0].toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white text-sm truncate">{c.name}</p>
                            {filter === 'birthday' && <span className="text-sm">🎂</span>}
                          </div>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {c.email || c.phone || (c.guestPhone ? `📞 ${c.guestPhone}` : 'Sin contacto')}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-white">{c.visits} visita{c.visits !== 1 ? 's' : ''}</p>
                          <p className="text-[11px]" style={{ color: days > 60 ? '#fca5a5' : 'rgba(255,255,255,0.35)' }}>
                            {days === 0 ? 'Hoy' : `hace ${days}d`}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal detalle cliente ─────────────────────────────────── */}
      {selectedClient && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 px-4 pb-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedClient(null); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
            style={{ backgroundColor: '#111111', border: '1px solid #2a2a2a' }}>

            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1e1e1e' }}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
                <h2 className="font-bold text-white text-sm">Perfil del cliente</h2>
              </div>
              <button onClick={() => setSelectedClient(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-lg hover:opacity-60 transition"
                style={{ color: 'rgba(255,255,255,0.4)', backgroundColor: '#1a1a1a' }}>×</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Info básica */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 text-2xl font-black"
                  style={{ backgroundColor: `${GOLD}18`, color: GOLD }}>
                  {selectedClient.image
                    ? <img src={selectedClient.image} alt={selectedClient.name} className="w-full h-full object-cover" />
                    : selectedClient.name[0].toUpperCase()
                  }
                </div>
                <div>
                  <p className="font-bold text-white">{selectedClient.name}</p>
                  {selectedClient.email && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{selectedClient.email}</p>}
                  {selectedClient.phone && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>📞 {selectedClient.phone}</p>}
                </div>
              </div>

              {/* Stats del cliente */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Visitas', value: selectedClient.visits },
                  { label: 'Gasto total', value: formatPrice(selectedClient.totalSpent) },
                  { label: 'Última visita', value: daysSince(selectedClient.lastVisit) === 0 ? 'Hoy' : `${daysSince(selectedClient.lastVisit)}d` },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center"
                    style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                    <p className="text-sm font-bold text-white">{s.value}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Historial últimas 5 citas */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3 rounded-full" style={{ backgroundColor: GOLD }} />
                  <p className="text-xs font-semibold text-white">Últimas citas</p>
                </div>
                <div className="space-y-2">
                  {selectedClient.appointments.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center gap-2 text-xs py-2 px-3 rounded-xl"
                      style={{ backgroundColor: '#1a1a1a' }}>
                      <div className="flex-1">
                        <p className="text-white font-medium">{a.service.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)' }}>{formatDate(a.date)}</p>
                      </div>
                      <div className="text-right">
                        <p style={{ color: a.attended === true ? '#86efac' : a.attended === false ? '#fca5a5' : 'rgba(255,255,255,0.35)' }}>
                          {a.attended === true ? '✓' : a.attended === false ? '✗' : '—'}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)' }}>{formatPrice(a.service.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
