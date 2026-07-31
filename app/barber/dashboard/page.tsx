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
  id:         string;
  date:       string;
  status:     string;
  attended:   boolean | null;
  guestName:  string | null;
  guestPhone: string | null;
  clientId:   string | null;
  service:    { name: string; duration: number; price: number };
  client:     { name: string | null; email: string | null; image: string | null } | null;
}

interface ClientNote {
  id:     string;
  rating: number;
  note:   string | null;
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

const GOLD = '#C9A84C';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  CONFIRMED: { label: 'Confirmada', bg: 'rgba(34,197,94,0.1)',  color: '#86efac', border: 'rgba(34,197,94,0.3)'  },
  PENDING:   { label: 'Pendiente',  bg: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: 'rgba(201,168,76,0.3)' },
  COMPLETED: { label: 'Completada', bg: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
  CANCELLED: { label: 'Cancelada',  bg: 'rgba(239,68,68,0.1)',  color: '#fca5a5', border: 'rgba(239,68,68,0.3)'  },
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
  const [detailApt, setDetailApt]           = useState<Appointment | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAttendance, setUpdatingAttendance] = useState<string | null>(null);

  // Client notes
  const [clientNote, setClientNote]   = useState<ClientNote | null>(null);
  const [noteRating, setNoteRating]   = useState(5);
  const [noteText, setNoteText]       = useState('');
  const [savingNote, setSavingNote]   = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);

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

  async function updateAppointmentStatus(id: string, status: string) {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/barber/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        setDetailApt(prev => prev?.id === id ? { ...prev, status } : prev);
      }
    } catch { /* silencioso */ }
    finally { setUpdatingStatus(false); }
  }

  async function updateAttendance(id: string, attended: boolean | null) {
    setUpdatingAttendance(id);
    try {
      const res = await fetch(`/api/barber/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended }),
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, attended } : a));
        setDetailApt(prev => prev?.id === id ? { ...prev, attended } : prev);
      }
    } catch { /* silencioso */ }
    finally { setUpdatingAttendance(null); }
  }

  async function openDetail(apt: Appointment) {
    setDetailApt(apt);
    setShowNoteEditor(false);
    setClientNote(null);
    setNoteRating(5);
    setNoteText('');

    if (apt.clientId) {
      try {
        const res = await fetch(`/api/barbershop/client-notes?clientId=${apt.clientId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.note) {
            setClientNote(data.note);
            setNoteRating(data.note.rating);
            setNoteText(data.note.note || '');
          }
        }
      } catch { /* silencioso */ }
    } else if (apt.guestPhone) {
      try {
        const res = await fetch(`/api/barbershop/client-notes?guestPhone=${encodeURIComponent(apt.guestPhone)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.note) {
            setClientNote(data.note);
            setNoteRating(data.note.rating);
            setNoteText(data.note.note || '');
          }
        }
      } catch { /* silencioso */ }
    }
  }

  async function saveClientNote() {
    if (!detailApt) return;
    setSavingNote(true);
    try {
      const body: Record<string, unknown> = { rating: noteRating, note: noteText };
      if (detailApt.clientId) body.clientId = detailApt.clientId;
      else if (detailApt.guestPhone) body.guestPhone = detailApt.guestPhone;
      else return;

      const res = await fetch('/api/barbershop/client-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setClientNote(data.clientNote);
        setShowNoteEditor(false);
      }
    } catch { /* silencioso */ }
    finally { setSavingNote(false); }
  }

  const STAR_LABELS = ['', 'Difícil', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

  // ─────────────────────────────────────────────
  // ESTADOS DE CARGA / ERROR
  // ─────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
    </div>
  );

  if (error === 'pending_approval') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-white mb-2">Esperando aprobación</h1>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>El dueño de la barbería debe aprobar tu acceso.</p>
        <button onClick={() => signOut({ callbackUrl: '/' })}
          className="text-sm hover:underline transition" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⛔</div>
        <h1 className="text-xl font-bold text-white mb-2">Sin acceso</h1>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>No tienes un perfil de barbero asociado a esta cuenta.</p>
        <button onClick={() => signOut({ callbackUrl: '/' })}
          className="text-sm hover:underline transition" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  if (!profile) return null;

  const accentColor = profile.barbershop.colors?.[0] || GOLD;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0a0a0a' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3.5" style={{ backgroundColor: '#111111', borderBottom: '1px solid #1e1e1e' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
          >
            {profile.photo
              ? <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
              : <span style={{ color: accentColor }}>{profile.name[0]}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{profile.name}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{profile.barbershop.name}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.35)', backgroundColor: '#1a1a1a' }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pt-5">

        {/* ══ TAB INICIO ══ */}
        {tab === 'inicio' && stats && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
              <h2 className="text-base font-bold text-white">Hola, {profile.name.split(' ')[0]}</h2>
            </div>

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
                <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
                  <p className="text-2xl mb-2">{s.icon}</p>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Top servicios */}
            {stats.topServicios.length > 0 && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: GOLD }} />
                  <p className="text-sm font-semibold text-white">Servicios más realizados</p>
                </div>
                <div className="space-y-3">
                  {stats.topServicios.map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{s.nombre}</span>
                      <div className="flex items-center gap-3">
                        {stats.showEarnings && (
                          <span className="text-xs" style={{ color: '#86efac' }}>{formatPrice(s.precio * s.total)}</span>
                        )}
                        <span className="font-bold" style={{ color: GOLD }}>{s.total}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info barbería */}
            <div className="rounded-xl p-4" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: GOLD }} />
                <p className="text-sm font-semibold text-white">Tu barbería</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>📍 {profile.barbershop.address}</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>📞 {profile.barbershop.phone}</p>
                {profile.barbershop.subscription && (
                  <p className="text-sm capitalize" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    💳 Plan {profile.barbershop.subscription.plan.toLowerCase()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB AGENDA ══ */}
        {tab === 'agenda' && (
          <div>
            {/* Nav semana */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => { const d = new Date(monday); d.setDate(d.getDate() - 7); setMonday(d); }}
                className="px-3 py-2 rounded-xl text-sm transition hover:opacity-80"
                style={{ backgroundColor: '#1a1a1a', color: 'rgba(255,255,255,0.6)', border: '1px solid #2a2a2a' }}
              >← Anterior</button>
              <button
                onClick={() => { setMonday(getMondayOfWeek(new Date())); setSelectedDay(todayStr); }}
                className="text-xs font-semibold hover:underline" style={{ color: GOLD }}
              >Hoy</button>
              <button
                onClick={() => { const d = new Date(monday); d.setDate(d.getDate() + 7); setMonday(d); }}
                className="px-3 py-2 rounded-xl text-sm transition hover:opacity-80"
                style={{ backgroundColor: '#1a1a1a', color: 'rgba(255,255,255,0.6)', border: '1px solid #2a2a2a' }}
              >Siguiente →</button>
            </div>

            {/* Días */}
            <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
              {weekDays.map((d, i) => {
                const ds    = toLocalDateStr(d);
                const count = citasDia(ds).length;
                const isSel = ds === selectedDay;
                const isHoy = ds === todayStr;
                return (
                  <button key={ds} onClick={() => setSelectedDay(ds)}
                    className="flex-shrink-0 flex flex-col items-center px-2.5 py-2 rounded-xl transition min-w-[46px]"
                    style={
                      isSel ? { backgroundColor: GOLD, color: '#000' }
                      : isHoy ? { backgroundColor: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}35` }
                      : { color: 'rgba(255,255,255,0.4)', backgroundColor: '#111111', border: '1px solid #1e1e1e' }
                    }
                  >
                    <span className="text-[10px] font-medium">{DAY_NAMES[i === 6 ? 0 : i + 1]}</span>
                    <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                    {count > 0 && (
                      <span className="text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold mt-0.5"
                        style={isSel ? { backgroundColor: '#000', color: GOLD } : { backgroundColor: GOLD, color: '#000' }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Heading */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold capitalize text-white">
                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {citasDia(selectedDay).length} cita{citasDia(selectedDay).length !== 1 ? 's' : ''}
              </span>
            </div>

            {loadingAgenda ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
              </div>
            ) : citasDia(selectedDay).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Sin citas este día</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {citasDia(selectedDay).map(apt => {
                  const hora    = new Date(apt.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
                  const cliente = apt.client?.name || apt.guestName || 'Cliente';
                  const cfg     = STATUS_CONFIG[apt.status];
                  const isToday = selectedDay === todayStr;
                  const isUpdating = updatingAttendance === apt.id;
                  return (
                    <div key={apt.id}
                      className="rounded-xl overflow-hidden"
                      style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
                      <button onClick={() => openDetail(apt)}
                        className="w-full p-4 text-left transition hover:opacity-80">
                        <div className="flex items-start gap-3">
                          <div className="text-center w-12 flex-shrink-0">
                            <p className="font-bold text-sm" style={{ color: GOLD }}>{hora}</p>
                            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{apt.service.duration}min</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{cliente}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{apt.service.name}</p>
                            {apt.guestPhone && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>📞 {apt.guestPhone}</p>}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className="text-[11px] px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: cfg?.bg, color: cfg?.color, border: `1px solid ${cfg?.border}` }}>
                              {cfg?.label}
                            </span>
                            <p className="text-sm font-bold text-white mt-1">{formatPrice(apt.service.price)}</p>
                          </div>
                        </div>
                      </button>

                      {/* Botones de asistencia — solo para citas de hoy */}
                      {isToday && apt.status !== 'CANCELLED' && (
                        <div className="flex gap-px" style={{ borderTop: '1px solid #1e1e1e' }}>
                          <button
                            onClick={() => updateAttendance(apt.id, apt.attended === true ? null : true)}
                            disabled={isUpdating}
                            className="flex-1 py-2.5 text-xs font-semibold transition"
                            style={{
                              backgroundColor: apt.attended === true ? 'rgba(34,197,94,0.15)' : 'transparent',
                              color: apt.attended === true ? '#86efac' : 'rgba(255,255,255,0.35)',
                            }}>
                            {isUpdating ? '…' : '✓ Asistió'}
                          </button>
                          <div style={{ width: 1, backgroundColor: '#1e1e1e' }} />
                          <button
                            onClick={() => updateAttendance(apt.id, apt.attended === false ? null : false)}
                            disabled={isUpdating}
                            className="flex-1 py-2.5 text-xs font-semibold transition"
                            style={{
                              backgroundColor: apt.attended === false ? 'rgba(239,68,68,0.12)' : 'transparent',
                              color: apt.attended === false ? '#fca5a5' : 'rgba(255,255,255,0.35)',
                            }}>
                            {isUpdating ? '…' : '✗ No asistió'}
                          </button>
                        </div>
                      )}

                      {/* Indicador asistencia en días anteriores */}
                      {!isToday && apt.attended !== null && apt.attended !== undefined && (
                        <div className="px-4 py-1.5 text-[11px] font-medium" style={{
                          borderTop: '1px solid #1e1e1e',
                          color: apt.attended ? '#86efac' : '#fca5a5',
                          backgroundColor: apt.attended ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                        }}>
                          {apt.attended ? '✓ Asistió' : '✗ No asistió'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB SERVICIOS ══ */}
        {tab === 'servicios' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
              <h2 className="text-sm font-bold text-white">Servicios de la barbería</h2>
            </div>
            {profile.barbershop.services.map(s => (
              <div key={s.id}
                className="rounded-xl p-4 flex justify-between items-center"
                style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
                <div>
                  <p className="font-semibold text-white text-sm">{s.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.duration} min</p>
                </div>
                <p className="font-bold text-sm" style={{ color: GOLD }}>{formatPrice(s.price)}</p>
              </div>
            ))}
          </div>
        )}

        {/* ══ TAB HORARIO ══ */}
        {tab === 'horario' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
              <h2 className="text-sm font-bold text-white">Mi horario</h2>
            </div>

            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 0].map(dow => {
                const sch = profile.schedules.find(s => s.dayOfWeek === dow);
                const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                return (
                  <div key={dow}
                    className={`rounded-xl px-4 py-3 flex justify-between items-center ${!sch?.isWorking ? 'opacity-40' : ''}`}
                    style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
                    <p className="text-sm font-medium text-white">{dayNames[dow]}</p>
                    {sch?.isWorking
                      ? <p className="text-sm font-semibold" style={{ color: GOLD }}>{sch.startTime} – {sch.endTime}</p>
                      : <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No trabaja</p>
                    }
                  </div>
                );
              })}
            </div>

            {profile.breaks.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white mb-2">Descansos</p>
                <div className="space-y-2">
                  {profile.breaks.map(b => (
                    <div key={b.id}
                      className="rounded-xl px-4 py-3 flex justify-between items-center"
                      style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
                      <p className="text-sm text-white">{b.label}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
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

      {/* ── Bottom Nav ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-2 z-20"
        style={{ backgroundColor: '#111111', borderTop: '1px solid #1e1e1e' }}>
        <div className="max-w-2xl mx-auto flex justify-around">
          {([
            { key: 'inicio',    icon: '⊞', label: 'Inicio'    },
            { key: 'agenda',    icon: '📅', label: 'Agenda'    },
            { key: 'servicios', icon: '✂️', label: 'Servicios' },
            { key: 'horario',   icon: '🕐', label: 'Horario'   },
          ] as const).map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition"
              style={{ color: tab === item.key ? GOLD : 'rgba(255,255,255,0.35)' }}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Modal detalle cita ───────────────────────────────────────── */}
      {detailApt && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 px-4 pb-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) setDetailApt(null); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#111111', border: '1px solid #2a2a2a' }}>

            {/* Header */}
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1e1e1e' }}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
                <h2 className="font-bold text-white text-sm">Detalle de cita</h2>
              </div>
              <button onClick={() => setDetailApt(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-lg transition hover:opacity-60"
                style={{ color: 'rgba(255,255,255,0.4)', backgroundColor: '#1a1a1a' }}>×</button>
            </div>

            {/* Info cita */}
            <div className="p-5 space-y-3">
              {[
                ['Cliente',  detailApt.client?.name || detailApt.guestName || '—'],
                ['Contacto', detailApt.client?.email || detailApt.guestPhone || '—'],
                ['Servicio', detailApt.service.name],
                ['Hora',     new Date(detailApt.date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })],
                ['Precio',   formatPrice(detailApt.service.price)],
                ...(detailApt.attended !== null && detailApt.attended !== undefined
                  ? [['Asistencia', detailApt.attended ? '✓ Asistió' : '✗ No asistió']]
                  : []
                ),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                  <span className="text-white font-medium" style={
                    label === 'Asistencia'
                      ? { color: detailApt.attended ? '#86efac' : '#fca5a5' }
                      : {}
                  }>{value}</span>
                </div>
              ))}
            </div>

            {/* Sección notas del cliente */}
            {(detailApt.clientId || detailApt.guestPhone) && (
              <div className="mx-5 mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#1a1a1a' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 rounded-full" style={{ backgroundColor: GOLD }} />
                    <p className="text-xs font-semibold text-white">Observaciones del cliente</p>
                  </div>
                  <button onClick={() => setShowNoteEditor(!showNoteEditor)}
                    className="text-[11px] px-2.5 py-1 rounded-lg transition hover:opacity-80"
                    style={{ backgroundColor: `${GOLD}20`, color: GOLD }}>
                    {showNoteEditor ? 'Cancelar' : clientNote ? 'Editar' : '+ Agregar'}
                  </button>
                </div>

                {!showNoteEditor && clientNote && (
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className="text-base" style={{ color: s <= clientNote.rating ? GOLD : 'rgba(255,255,255,0.15)' }}>★</span>
                      ))}
                      <span className="text-xs ml-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {STAR_LABELS[clientNote.rating]}
                      </span>
                    </div>
                    {clientNote.note && (
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{clientNote.note}</p>
                    )}
                  </div>
                )}

                {!showNoteEditor && !clientNote && (
                  <div className="px-4 py-3">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Sin observaciones para este cliente.</p>
                  </div>
                )}

                {showNoteEditor && (
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Calificación del cliente</p>
                      <div className="flex items-center gap-2">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setNoteRating(s)}
                            className="text-2xl transition hover:scale-110"
                            style={{ color: s <= noteRating ? GOLD : 'rgba(255,255,255,0.15)' }}>★</button>
                        ))}
                        <span className="text-xs ml-1" style={{ color: GOLD }}>{STAR_LABELS[noteRating]}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Observaciones</p>
                      <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        rows={3}
                        placeholder="Puntual, buen cliente, solicita servicio X..."
                        className="w-full rounded-xl px-3 py-2.5 text-xs text-white resize-none outline-none"
                        style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
                      />
                    </div>
                    <button onClick={saveClientNote} disabled={savingNote}
                      className="w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 transition hover:opacity-80"
                      style={{ backgroundColor: GOLD, color: '#000' }}>
                      {savingNote ? 'Guardando...' : 'Guardar observaciones'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Acciones de estado */}
            <div className="p-5 pt-0 space-y-2">
              {detailApt.status !== 'COMPLETED' && detailApt.status !== 'CANCELLED' && (
                <button
                  onClick={() => updateAppointmentStatus(detailApt.id, 'COMPLETED')}
                  disabled={updatingStatus}
                  className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition hover:opacity-80"
                  style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)' }}>
                  {updatingStatus ? 'Actualizando...' : '✓ Marcar como completada'}
                </button>
              )}
              {detailApt.status !== 'CANCELLED' && detailApt.status !== 'COMPLETED' && (
                <button
                  onClick={() => updateAppointmentStatus(detailApt.id, 'CANCELLED')}
                  disabled={updatingStatus}
                  className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition hover:opacity-80"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}>
                  {updatingStatus ? 'Actualizando...' : '✗ Cancelar cita'}
                </button>
              )}
              <button onClick={() => setDetailApt(null)}
                className="w-full py-3 rounded-xl text-sm font-medium transition hover:opacity-80"
                style={{ backgroundColor: '#1a1a1a', color: 'rgba(255,255,255,0.5)', border: '1px solid #2a2a2a' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}