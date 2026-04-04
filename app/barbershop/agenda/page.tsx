// app/barbershop/agenda/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface Appointment {
  id:        string;
  date:      string;
  status:    'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes:     string | null;
  guestName:  string | null;
  guestPhone: string | null;
  service: { name: string; duration: number; price: number };
  barber:  { name: string; photo: string | null };
  client:  { name: string | null; email: string | null; image: string | null } | null;
}

interface Barber  { id: string; name: string }
interface Service { id: string; name: string; duration: number }

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function toLocalDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getMondayOfWeek(date: Date) {
  const d   = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
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

const STATUS_CONFIG = {
  CONFIRMED:  { label: 'Confirmada',  color: 'bg-blue-900/40 text-blue-300 border-blue-800' },
  PENDING:    { label: 'Pendiente',   color: 'bg-yellow-900/40 text-yellow-300 border-yellow-800' },
  COMPLETED:  { label: 'Completada', color: 'bg-green-900/40 text-green-300 border-green-800' },
  CANCELLED:  { label: 'Cancelada',  color: 'bg-red-900/40 text-red-300 border-red-800' },
};

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function AgendaPage() {
  const [monday, setMonday]             = useState(() => getMondayOfWeek(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers]           = useState<Barber[]>([]);
  const [services, setServices]         = useState<Service[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filterBarber, setFilterBarber] = useState('');
  const [selectedDay, setSelectedDay]   = useState<string>(toLocalDateStr(new Date()));

  // Modal detalle
  const [detail, setDetail]         = useState<Appointment | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal nueva cita
  const [showNew, setShowNew]   = useState(false);
  const [newForm, setNewForm]   = useState({ serviceId: '', barberId: '', date: toLocalDateStr(new Date()), time: '09:00', guestName: '', guestPhone: '', notes: '' });
  const [newError, setNewError] = useState('');
  const [saving, setSaving]     = useState(false);

  const weekDays = getWeekDays(monday);

  // ── Cargar datos ───────────────────────────
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const from = toLocalDateStr(weekDays[0]);
      const to   = toLocalDateStr(weekDays[6]);
      const url  = `/api/barbershop/appointments?from=${from}&to=${to}${filterBarber ? `&barberId=${filterBarber}` : ''}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (res.ok) setAppointments(data.appointments);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [monday, filterBarber]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    // Cargar barberos y servicios para el modal de nueva cita
    Promise.all([
      fetch('/api/barbershop/barbers').then(r => r.json()),
      fetch('/api/barbershop/services').then(r => r.json()),
    ]).then(([b, s]) => {
      if (b.barbers)  setBarbers(b.barbers);
      if (s.services) setServices(s.services);
    });
  }, []);

  // ── Cambiar estado ─────────────────────────
  async function handleStatusChange(id: string, status: string) {
    try {
      setUpdatingId(id);
      const res  = await fetch(`/api/barbershop/appointments/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? data.appointment : a));
        if (detail?.id === id) setDetail(data.appointment);
      }
    } catch { /* silencioso */ }
    finally { setUpdatingId(null); }
  }

  // ── Crear cita manual ──────────────────────
  async function handleCreateAppointment() {
    setNewError('');
    if (!newForm.serviceId || !newForm.barberId || !newForm.guestName) {
      setNewError('Nombre, servicio y barbero son obligatorios'); return;
    }
    try {
      setSaving(true);
      const datetime = `${newForm.date}T${newForm.time}:00`;
      const res = await fetch('/api/barbershop/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newForm, datetime }),
      });
      const data = await res.json();
      if (!res.ok) { setNewError(data.error || 'Error al crear'); return; }
      setShowNew(false);
      setNewForm({ serviceId: '', barberId: '', date: toLocalDateStr(new Date()), time: '09:00', guestName: '', guestPhone: '', notes: '' });
      await fetchAppointments();
    } catch { setNewError('Error de conexión'); }
    finally { setSaving(false); }
  }

  // ── Agrupar citas por día ──────────────────
  const citasPorDia = (dateStr: string) =>
    appointments.filter(a => a.date.startsWith(dateStr));

  const todayStr = toLocalDateStr(new Date());

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <Link href="/barbershop" className="text-gray-400 hover:text-white">←</Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">📅 Agenda</h1>
          </div>

          {/* Filtro barbero */}
          <select
            value={filterBarber}
            onChange={e => setFilterBarber(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
          >
            <option value="">Todos los barberos</option>
            {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* Botón nueva cita */}
          <button
            onClick={() => setShowNew(true)}
            className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition"
          >
            + Nueva cita
          </button>
        </div>
      </div>

      {/* Navegación semana */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => { const d = new Date(monday); d.setDate(d.getDate() - 7); setMonday(d); }}
            className="p-2 rounded-lg hover:bg-gray-800 transition text-gray-400 hover:text-white"
          >← Anterior</button>

          <div className="text-center">
            <p className="text-sm font-medium text-white">
              {weekDays[0].toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })} –{' '}
              {weekDays[6].toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <button
              onClick={() => { setMonday(getMondayOfWeek(new Date())); setSelectedDay(todayStr); }}
              className="text-xs text-yellow-400 hover:underline mt-0.5"
            >
              Ir a hoy
            </button>
          </div>

          <button
            onClick={() => { const d = new Date(monday); d.setDate(d.getDate() + 7); setMonday(d); }}
            className="p-2 rounded-lg hover:bg-gray-800 transition text-gray-400 hover:text-white"
          >Siguiente →</button>
        </div>
      </div>

      {/* Selector de día (mobile) */}
      <div className="flex overflow-x-auto bg-gray-900 border-b border-gray-800 px-4 gap-1 py-2">
        {weekDays.map((d, i) => {
          const ds      = toLocalDateStr(d);
          const count   = citasPorDia(ds).length;
          const isToday = ds === todayStr;
          const isSel   = ds === selectedDay;
          return (
            <button
              key={ds}
              onClick={() => setSelectedDay(ds)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all min-w-[52px] ${
                isSel ? 'bg-yellow-400 text-gray-900' : isToday ? 'bg-gray-800 text-yellow-400' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <span className="text-xs font-medium">{DAY_NAMES[i]}</span>
              <span className="text-lg font-bold">{d.getDate()}</span>
              {count > 0 && (
                <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${isSel ? 'bg-gray-900 text-yellow-400' : 'bg-yellow-400 text-gray-900'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Citas del día seleccionado */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white capitalize">
            {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <span className="text-sm text-gray-400">
            {citasPorDia(selectedDay).length} cita{citasPorDia(selectedDay).length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : citasPorDia(selectedDay).length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📭</p>
            <p>No hay citas este día</p>
            <button onClick={() => setShowNew(true)} className="mt-3 text-yellow-400 text-sm hover:underline">
              + Agregar cita manualmente
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {citasPorDia(selectedDay).map(apt => {
              const hora    = new Date(apt.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
              const cliente = apt.client?.name || apt.guestName || 'Cliente';
              const cfg     = STATUS_CONFIG[apt.status];
              return (
                <button
                  key={apt.id}
                  onClick={() => setDetail(apt)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition text-left"
                >
                  <div className="flex items-start gap-4">
                    {/* Hora */}
                    <div className="text-center flex-shrink-0 w-14">
                      <p className="text-yellow-400 font-bold text-sm">{hora}</p>
                      <p className="text-gray-500 text-xs">{apt.service.duration}min</p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{cliente}</p>
                      <p className="text-sm text-gray-400">{apt.service.name} · {apt.barber.name}</p>
                      {apt.guestPhone && <p className="text-xs text-gray-500 mt-0.5">📞 {apt.guestPhone}</p>}
                    </div>

                    {/* Estado + precio */}
                    <div className="flex-shrink-0 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <p className="text-sm font-bold text-white mt-1">{formatPrice(apt.service.price)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════ */}
      {/* MODAL DETALLE DE CITA                 */}
      {/* ══════════════════════════════════════ */}
      {detail && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Detalle de cita</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="p-5 space-y-3">
              {[
                ['👤 Cliente',   detail.client?.name || detail.guestName || '—'],
                ['📞 Teléfono',  detail.client?.email || detail.guestPhone || '—'],
                ['✂️ Servicio',  detail.service.name],
                ['👨 Barbero',   detail.barber.name],
                ['🕐 Hora',      new Date(detail.date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })],
                ['💰 Precio',    formatPrice(detail.service.price)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-medium text-right ml-4">{value}</span>
                </div>
              ))}
              {detail.notes && (
                <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300">
                  📝 {detail.notes}
                </div>
              )}
            </div>

            {/* Cambiar estado */}
            <div className="px-5 pb-5">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Cambiar estado</p>
              <div className="grid grid-cols-2 gap-2">
                {(['CONFIRMED', 'COMPLETED', 'CANCELLED', 'PENDING'] as const).map(s => {
                  const cfg     = STATUS_CONFIG[s];
                  const isActive = detail.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => !isActive && handleStatusChange(detail.id, s)}
                      disabled={isActive || updatingId === detail.id}
                      className={`py-2 rounded-xl text-xs font-medium transition border ${
                        isActive ? cfg.color + ' cursor-default' : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                      } disabled:opacity-50`}
                    >
                      {updatingId === detail.id && !isActive ? '...' : cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* MODAL NUEVA CITA MANUAL               */}
      {/* ══════════════════════════════════════ */}
      {showNew && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md my-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">✂️ Nueva cita manual</h2>
              <button onClick={() => { setShowNew(false); setNewError(''); }} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="p-5 space-y-4">
              {[
                { label: 'Nombre del cliente *', key: 'guestName', type: 'text', placeholder: 'Ej: Carlos Rodríguez' },
                { label: 'Teléfono',             key: 'guestPhone', type: 'tel', placeholder: 'Ej: +57 300 000 0000' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    value={(newForm as Record<string, string>)[f.key]}
                    onChange={e => setNewForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Servicio *</label>
                <select value={newForm.serviceId} onChange={e => setNewForm(p => ({ ...p, serviceId: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none">
                  <option value="">Selecciona un servicio</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration}min)</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Barbero *</label>
                <select value={newForm.barberId} onChange={e => setNewForm(p => ({ ...p, barberId: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none">
                  <option value="">Selecciona un barbero</option>
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Fecha *</label>
                  <input type="date" value={newForm.date} onChange={e => setNewForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Hora *</label>
                  <input type="time" value={newForm.time} onChange={e => setNewForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Notas</label>
                <textarea value={newForm.notes} onChange={e => setNewForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="Observaciones opcionales..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none resize-none"
                />
              </div>

              {newError && (
                <div className="bg-red-900/40 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm">❌ {newError}</div>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-800">
              <button onClick={() => { setShowNew(false); setNewError(''); }}
                className="flex-1 bg-gray-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-600 transition">
                Cancelar
              </button>
              <button onClick={handleCreateAppointment} disabled={saving}
                className="flex-1 bg-yellow-400 text-gray-900 py-3 rounded-xl text-sm font-bold hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />Guardando...</> : 'Crear cita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}