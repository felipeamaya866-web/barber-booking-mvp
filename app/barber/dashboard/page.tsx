// app/barber/dashboard/page.tsx
// Panel personal del barbero (rol BARBER, no dueño)

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface BarberProfile {
  id:           string;
  name:         string;
  photo:        string | null;
  showEarnings: boolean;
  barbershop: {
    name:     string;
    logo:     string | null;
    colors:   string[];
    phone:    string;
    address:  string;
    services: { id: string; name: string; price: number; duration: number }[];
    subscription: { plan: string; status: string } | null;
  };
  schedules: { dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }[];
  breaks:    { id: string; label: string; dayOfWeek: number; startTime: string; endTime: string }[];
}

interface Stats {
  citasMes:     number;
  citasSemana:  number;
  totalCitas:   number;
  topServicios: { nombre: string; precio: number; total: number }[];
  showEarnings: boolean;
  ingresosMes:  number | null;
  ingresosTotal: number | null;
}

interface Appointment {
  id:        string;
  date:      string;
  status:    string;
  guestName: string | null;
  guestPhone: string | null;
  service:   { name: string; duration: number; price: number };
  client:    { name: string | null; email: string | null } | null;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function toLocalDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getMondayOfWeek(date: Date) {
  const d   = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p);
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: 'Confirmada', color: 'bg-blue-900/40 text-blue-300 border-blue-800' },
  PENDING:   { label: 'Pendiente',  color: 'bg-yellow-900/40 text-yellow-300 border-yellow-800' },
  COMPLETED: { label: 'Completada', color: 'bg-green-900/40 text-green-300 border-green-800' },
  CANCELLED: { label: 'Cancelada',  color: 'bg-red-900/40 text-red-300 border-red-800' },
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
type TabKey = 'inicio' | 'agenda' | 'servicios' | 'horario';

export default function BarberDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab]           = useState<TabKey>('inicio');
  const [profile, setProfile]   = useState<BarberProfile | null>(null);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Agenda
  const [monday, setMonday]             = useState(() => getMondayOfWeek(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDay, setSelectedDay]   = useState(toLocalDateStr(new Date()));
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [detailApt, setDetailApt]       = useState<Appointment | null>(null);

  const weekDays = getWeekDays(monday);
  const todayStr = toLocalDateStr(new Date());

  // ── Cargar perfil + stats ─────────────────
  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status !== 'authenticated')  return;
    fetchProfile();
  }, [status]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        fetch('/api/barber/me'),
        fetch('/api/barber/stats'),
      ]);

      if (profileRes.status === 403) {
        const d = await profileRes.json();
        if (d.inviteStatus === 'PENDING_APPROVAL') {
          setError('pending_approval'); return;
        }
        setError('no_access'); return;
      }
      if (!profileRes.ok) { setError('not_found'); return; }

      const profileData = await profileRes.json();
      const statsData   = statsRes.ok ? await statsRes.json() : null;

      setProfile(profileData.barber);
      setStats(statsData);
    } catch { setError('error'); }
    finally { setLoading(false); }
  }

  // ── Cargar agenda ─────────────────────────
  const fetchAgenda = useCallback(async () => {
    if (!profile) return;
    setLoadingAgenda(true);
    try {
      const from = toLocalDateStr(weekDays[0]);
      const to   = toLocalDateStr(weekDays[6]);
      const res  = await fetch(`/api/barber/agenda?from=${from}&to=${to}`);
      const data = await res.json();
      if (res.ok) setAppointments(data.appointments);
    } catch { /* silencioso */ }
    finally { setLoadingAgenda(false); }
  }, [monday, profile]);

  useEffect(() => {
    if (tab === 'agenda') fetchAgenda();
  }, [tab, fetchAgenda]);

  const citasDia = (ds: string) => appointments.filter(a => a.date.startsWith(ds));

  // ─────────────────────────────────────────────
  // ESTADOS DE CARGA / ERROR
  // ─────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error === 'pending_approval') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-white mb-2">Esperando aprobación</h1>
        <p className="text-gray-400 text-sm">El dueño de la barbería debe aprobar tu acceso. Vuelve a intentarlo en unos minutos.</p>
        <button onClick={() => { signOut({ callbackUrl: '/' }); }} className="mt-6 text-gray-400 text-sm hover:text-white transition">Cerrar sesión</button>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⛔</div>
        <h1 className="text-xl font-bold text-white mb-2">Sin acceso</h1>
        <p className="text-gray-400 text-sm">No tienes un perfil de barbero asociado a esta cuenta.</p>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="mt-6 text-gray-400 text-sm hover:text-white">Cerrar sesión</button>
      </div>
    </div>
  );

  if (!profile) return null;

  const accentColor = profile.barbershop.colors?.[0] || '#FACC15';

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center font-bold text-lg flex-shrink-0" style={{ backgroundColor: accentColor + '33' }}>
            {profile.photo
              ? <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
              : <span style={{ color: accentColor }}>{profile.name[0]}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{profile.name}</p>
            <p className="text-xs text-gray-400 truncate">✂️ {profile.barbershop.name}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="text-gray-400 hover:text-white text-xs transition">Salir</button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* ══ TAB INICIO ══ */}
        {tab === 'inicio' && stats && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">¡Hola, {profile.name.split(' ')[0]}! 👋</h2>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Citas esta semana', value: stats.citasSemana, icon: '📅' },
                { label: 'Citas este mes',    value: stats.citasMes,    icon: '📆' },
                { label: 'Citas completadas', value: stats.totalCitas,  icon: '✅' },
                ...(stats.showEarnings && stats.ingresosMes !== null
                  ? [{ label: 'Ingresos del mes', value: formatPrice(stats.ingresosMes), icon: '💰' }]
                  : []
                ),
              ].map(s => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Top servicios */}
            {stats.topServicios.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-3">🏆 Tus servicios más realizados</p>
                <div className="space-y-2">
                  {stats.topServicios.map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">{s.nombre}</span>
                      <div className="flex items-center gap-3">
                        {stats.showEarnings && <span className="text-green-400 text-xs">{formatPrice(s.precio * s.total)}</span>}
                        <span className="text-yellow-400 font-bold">{s.total}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info barbería */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-white mb-2">🏪 Tu barbería</p>
              <p className="text-gray-400 text-sm">📍 {profile.barbershop.address}</p>
              <p className="text-gray-400 text-sm">📞 {profile.barbershop.phone}</p>
              {profile.barbershop.subscription && (
                <p className="text-gray-400 text-sm capitalize">
                  💳 Plan {profile.barbershop.subscription.plan.toLowerCase()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB AGENDA ══ */}
        {tab === 'agenda' && (
          <div>
            {/* Nav semana */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { const d = new Date(monday); d.setDate(d.getDate() - 7); setMonday(d); }}
                className="p-2 rounded-lg hover:bg-gray-800 transition text-gray-400 hover:text-white text-sm">← Anterior</button>
              <button onClick={() => { setMonday(getMondayOfWeek(new Date())); setSelectedDay(todayStr); }}
                className="text-yellow-400 text-xs hover:underline">Hoy</button>
              <button onClick={() => { const d = new Date(monday); d.setDate(d.getDate() + 7); setMonday(d); }}
                className="p-2 rounded-lg hover:bg-gray-800 transition text-gray-400 hover:text-white text-sm">Siguiente →</button>
            </div>

            {/* Días */}
            <div className="flex gap-1 mb-6 overflow-x-auto">
              {weekDays.map((d, i) => {
                const ds    = toLocalDateStr(d);
                const count = citasDia(ds).length;
                const isSel = ds === selectedDay;
                const isHoy = ds === todayStr;
                return (
                  <button key={ds} onClick={() => setSelectedDay(ds)}
                    className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition min-w-[48px] ${
                      isSel ? 'bg-yellow-400 text-gray-900' : isHoy ? 'bg-gray-800 text-yellow-400' : 'text-gray-400 hover:bg-gray-800'
                    }`}>
                    <span className="text-xs">{DAY_NAMES[i === 6 ? 0 : i + 1]}</span>
                    <span className="text-lg font-bold">{d.getDate()}</span>
                    {count > 0 && (
                      <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${isSel ? 'bg-gray-900 text-yellow-400' : 'bg-yellow-400 text-gray-900'}`}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Citas del día */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold capitalize">
                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <span className="text-gray-400 text-sm">{citasDia(selectedDay).length} cita{citasDia(selectedDay).length !== 1 ? 's' : ''}</span>
            </div>

            {loadingAgenda ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : citasDia(selectedDay).length === 0 ? (
              <div className="text-center py-12 text-gray-500"><p className="text-3xl mb-2">📭</p><p className="text-sm">Sin citas este día</p></div>
            ) : (
              <div className="space-y-3">
                {citasDia(selectedDay).map(apt => {
                  const hora    = new Date(apt.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
                  const cliente = apt.client?.name || apt.guestName || 'Cliente';
                  const cfg     = STATUS_CONFIG[apt.status];
                  return (
                    <button key={apt.id} onClick={() => setDetailApt(apt)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition text-left">
                      <div className="flex items-start gap-3">
                        <div className="text-center w-12 flex-shrink-0">
                          <p className="text-yellow-400 font-bold text-sm">{hora}</p>
                          <p className="text-gray-500 text-xs">{apt.service.duration}min</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{cliente}</p>
                          <p className="text-sm text-gray-400">{apt.service.name}</p>
                          {apt.guestPhone && <p className="text-xs text-gray-500">📞 {apt.guestPhone}</p>}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg?.color}`}>{cfg?.label}</span>
                          <p className="text-sm font-bold text-white mt-1">{formatPrice(apt.service.price)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB SERVICIOS ══ */}
        {tab === 'servicios' && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Servicios de la barbería</h2>
            <p className="text-sm text-gray-400">Estos son los servicios disponibles para agendar citas.</p>
            {profile.barbershop.services.map(s => (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{s.name}</p>
                  <p className="text-sm text-gray-400">{s.duration} minutos</p>
                </div>
                <p className="text-yellow-400 font-bold">{formatPrice(s.price)}</p>
              </div>
            ))}
          </div>
        )}

        {/* ══ TAB HORARIO ══ */}
        {tab === 'horario' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Mi horario</h2>

            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 0].map(dow => {
                const sch = profile.schedules.find(s => s.dayOfWeek === dow);
                const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                return (
                  <div key={dow} className={`bg-gray-900 border rounded-xl px-4 py-3 flex justify-between items-center ${sch?.isWorking ? 'border-gray-800' : 'border-gray-800 opacity-50'}`}>
                    <p className="text-sm font-medium text-white">{dayNames[dow]}</p>
                    {sch?.isWorking
                      ? <p className="text-sm text-yellow-400">{sch.startTime} – {sch.endTime}</p>
                      : <p className="text-sm text-gray-500">No trabaja</p>
                    }
                  </div>
                );
              })}
            </div>

            {profile.breaks.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white mb-2">☕ Descansos</p>
                <div className="space-y-2">
                  {profile.breaks.map(b => (
                    <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex justify-between items-center">
                      <p className="text-sm text-white">{b.label}</p>
                      <p className="text-sm text-gray-400">
                        {b.dayOfWeek === -1 ? 'Todos los días' : DAY_NAMES[b.dayOfWeek]} · {b.startTime}–{b.endTime}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Bottom Nav ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2">
        <div className="max-w-2xl mx-auto flex justify-around">
          {([
            { key: 'inicio',    icon: '🏠', label: 'Inicio' },
            { key: 'agenda',    icon: '📅', label: 'Agenda' },
            { key: 'servicios', icon: '✂️', label: 'Servicios' },
            { key: 'horario',   icon: '🕐', label: 'Horario' },
          ] as const).map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition ${tab === item.key ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Modal detalle cita ── */}
      {detailApt && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-4 pb-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="font-bold text-white">Detalle de cita</h2>
              <button onClick={() => setDetailApt(null)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            <div className="p-5 space-y-3">
              {[
                ['👤 Cliente',  detailApt.client?.name || detailApt.guestName || '—'],
                ['📞 Teléfono', detailApt.client?.email || detailApt.guestPhone || '—'],
                ['✂️ Servicio', detailApt.service.name],
                ['🕐 Hora',     new Date(detailApt.date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })],
                ['💰 Precio',   formatPrice(detailApt.service.price)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="p-5 pt-0">
              <button onClick={() => setDetailApt(null)} className="w-full bg-gray-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-600 transition">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}