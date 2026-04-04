// app/barbershop/barbers/components/ScheduleEditor.tsx
'use client';

import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface ScheduleDay {
  dayOfWeek: number;
  startTime: string;
  endTime:   string;
  isWorking: boolean;
}

interface BarberBreak {
  id:        string;
  label:     string;
  dayOfWeek: number; // -1 = todos los días
  startTime: string;
  endTime:   string;
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const DAY_OPTIONS = [
  { value: -1, label: 'Todos los días' },
  ...DAYS,
];

const DEFAULT_SCHEDULE: ScheduleDay[] = DAYS.map(d => ({
  dayOfWeek: d.value,
  startTime: '08:00',
  endTime:   '18:00',
  isWorking: d.value >= 1 && d.value <= 6,
}));

const HOUR_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  HOUR_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 23) HOUR_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

const BREAK_LABELS = ['Almuerzo', 'Desayuno', 'Pausa activa', 'Merienda', 'Descanso', 'Otro'];

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────
interface Props {
  barberId:   string;
  barberName: string;
  onClose:    () => void;
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function ScheduleEditor({ barberId, barberName, onClose }: Props) {
  const [tab, setTab] = useState<'horario' | 'descansos'>('horario');

  // ── Horario ────────────────────────────────
  const [schedule, setSchedule]   = useState<ScheduleDay[]>(DEFAULT_SCHEDULE);
  const [fetching, setFetching]   = useState(true);
  const [saving, setSaving]       = useState(false);
  const [scheduleOk, setScheduleOk] = useState(false);
  const [scheduleErr, setScheduleErr] = useState('');

  // ── Descansos ──────────────────────────────
  const [breaks, setBreaks]         = useState<BarberBreak[]>([]);
  const [breakForm, setBreakForm]   = useState({ label: 'Almuerzo', dayOfWeek: -1, startTime: '12:00', endTime: '13:00' });
  const [addingBreak, setAddingBreak] = useState(false);
  const [breakErr, setBreakErr]     = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, [barberId]);

  async function fetchAll() {
    setFetching(true);
    try {
      const [schedRes, breakRes] = await Promise.all([
        fetch(`/api/barbershop/barbers/${barberId}/schedule`),
        fetch(`/api/barbershop/barbers/${barberId}/breaks`),
      ]);
      const schedData  = await schedRes.json();
      const breaksData = await breakRes.json();

      if (schedRes.ok && schedData.schedules?.length > 0) {
        const merged = DEFAULT_SCHEDULE.map(def => {
          const saved = schedData.schedules.find((s: ScheduleDay) => s.dayOfWeek === def.dayOfWeek);
          return saved ? { ...def, ...saved } : def;
        });
        setSchedule(merged);
      }
      if (breakRes.ok) setBreaks(breaksData.breaks || []);
    } catch { /* usar defaults */ }
    finally { setFetching(false); }
  }

  // ── Guardar horario ────────────────────────
  function updateDay(dayOfWeek: number, field: keyof ScheduleDay, value: string | boolean) {
    setSchedule(prev => prev.map(d => d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d));
  }

  async function handleSaveSchedule() {
    try {
      setSaving(true);
      setScheduleErr('');
      const res  = await fetch(`/api/barbershop/barbers/${barberId}/schedule`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ schedules: schedule }),
      });
      const data = await res.json();
      if (!res.ok) { setScheduleErr(data.error || 'Error al guardar'); return; }
      setScheduleOk(true);
      setTimeout(() => setScheduleOk(false), 2500);
    } catch { setScheduleErr('Error de conexión'); }
    finally { setSaving(false); }
  }

  // ── Agregar descanso ───────────────────────
  async function handleAddBreak() {
    setBreakErr('');
    if (breakForm.startTime >= breakForm.endTime) {
      setBreakErr('La hora de inicio debe ser antes de la hora de fin'); return;
    }
    try {
      setAddingBreak(true);
      const res  = await fetch(`/api/barbershop/barbers/${barberId}/breaks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify(breakForm),
      });
      const data = await res.json();
      if (!res.ok) { setBreakErr(data.error || 'Error al agregar'); return; }
      setBreaks(prev => [...prev, data.break]);
      setBreakForm({ label: 'Almuerzo', dayOfWeek: -1, startTime: '12:00', endTime: '13:00' });
    } catch { setBreakErr('Error de conexión'); }
    finally { setAddingBreak(false); }
  }

  // ── Eliminar descanso ──────────────────────
  async function handleDeleteBreak(breakId: string) {
    try {
      setDeletingId(breakId);
      const res = await fetch(`/api/barbershop/barbers/${barberId}/breaks?breakId=${breakId}`, { method: 'DELETE' });
      if (!res.ok) return;
      setBreaks(prev => prev.filter(b => b.id !== breakId));
    } catch { /* silencioso */ }
    finally { setDeletingId(null); }
  }

  const getDayLabel = (val: number) => DAY_OPTIONS.find(d => d.value === val)?.label || '';

  const scheduleSorted = [...schedule].sort((a, b) => {
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
  });

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg my-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white">⏰ Disponibilidad</h2>
            <p className="text-sm text-gray-400 mt-0.5">{barberName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['horario', 'descansos'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'horario' ? '🗓️ Horario' : '☕ Descansos'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5">
          {fetching ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ══ TAB HORARIO ══ */}
              {tab === 'horario' && (
                <div className="space-y-3">
                  {scheduleSorted.map(day => {
                    const dayLabel = DAYS.find(d => d.value === day.dayOfWeek)?.label || '';
                    return (
                      <div
                        key={day.dayOfWeek}
                        className={`rounded-xl p-3 border transition-all ${
                          day.isWorking ? 'bg-gray-800 border-gray-700' : 'bg-gray-800/40 border-gray-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateDay(day.dayOfWeek, 'isWorking', !day.isWorking)}
                            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${day.isWorking ? 'bg-yellow-400' : 'bg-gray-600'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${day.isWorking ? 'left-5' : 'left-0.5'}`} />
                          </button>
                          <span className={`w-20 text-sm font-medium flex-shrink-0 ${day.isWorking ? 'text-white' : 'text-gray-500'}`}>
                            {dayLabel}
                          </span>
                          {day.isWorking ? (
                            <div className="flex items-center gap-2 flex-1">
                              <select value={day.startTime} onChange={e => updateDay(day.dayOfWeek, 'startTime', e.target.value)}
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm focus:border-yellow-400 focus:outline-none">
                                {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                              <span className="text-gray-400 text-sm flex-shrink-0">a</span>
                              <select value={day.endTime} onChange={e => updateDay(day.dayOfWeek, 'endTime', e.target.value)}
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm focus:border-yellow-400 focus:outline-none">
                                {HOUR_OPTIONS.filter(h => h > day.startTime).map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">No trabaja</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {scheduleErr && (
                    <div className="bg-red-900/40 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm">❌ {scheduleErr}</div>
                  )}
                  {scheduleOk && (
                    <div className="bg-green-900/40 border border-green-700 text-green-300 px-3 py-2 rounded-lg text-sm">✅ Horario guardado</div>
                  )}
                </div>
              )}

              {/* ══ TAB DESCANSOS ══ */}
              {tab === 'descansos' && (
                <div className="space-y-4">

                  {/* Formulario agregar descanso */}
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-white">➕ Agregar descanso</p>

                    {/* Label */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                      <div className="flex flex-wrap gap-2">
                        {BREAK_LABELS.map(l => (
                          <button
                            key={l}
                            onClick={() => setBreakForm(p => ({ ...p, label: l }))}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              breakForm.label === l
                                ? 'bg-yellow-400 text-gray-900'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Día */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Día</label>
                      <select
                        value={breakForm.dayOfWeek}
                        onChange={e => setBreakForm(p => ({ ...p, dayOfWeek: parseInt(e.target.value) }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-400 focus:outline-none"
                      >
                        {DAY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>

                    {/* Horas */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">Desde</label>
                        <select
                          value={breakForm.startTime}
                          onChange={e => setBreakForm(p => ({ ...p, startTime: e.target.value }))}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-400 focus:outline-none"
                        >
                          {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <span className="text-gray-400 text-sm mt-4">a</span>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">Hasta</label>
                        <select
                          value={breakForm.endTime}
                          onChange={e => setBreakForm(p => ({ ...p, endTime: e.target.value }))}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-400 focus:outline-none"
                        >
                          {HOUR_OPTIONS.filter(h => h > breakForm.startTime).map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>

                    {breakErr && (
                      <div className="bg-red-900/40 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-xs">❌ {breakErr}</div>
                    )}

                    <button
                      onClick={handleAddBreak}
                      disabled={addingBreak}
                      className="w-full bg-yellow-400 text-gray-900 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {addingBreak
                        ? <><span className="w-3 h-3 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />Agregando...</>
                        : '+ Agregar descanso'
                      }
                    </button>
                  </div>

                  {/* Lista de descansos */}
                  {breaks.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <p className="text-3xl mb-2">☕</p>
                      <p className="text-sm">No hay descansos configurados</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Descansos configurados</p>
                      {breaks.map(b => (
                        <div key={b.id} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                          <div>
                            <p className="text-white text-sm font-medium">{b.label}</p>
                            <p className="text-gray-400 text-xs mt-0.5">
                              {getDayLabel(b.dayOfWeek)} · {b.startTime} – {b.endTime}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteBreak(b.id)}
                            disabled={deletingId === b.id}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded transition disabled:opacity-40"
                          >
                            {deletingId === b.id ? '...' : '🗑️'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 bg-gray-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-600 transition">
            {tab === 'descansos' ? 'Cerrar' : 'Cancelar'}
          </button>
          {tab === 'horario' && (
            <button
              onClick={handleSaveSchedule}
              disabled={saving || fetching}
              className="flex-1 bg-yellow-400 text-gray-900 py-3 rounded-xl text-sm font-bold hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />Guardando...</>
                : 'Guardar horario'
              }
            </button>
          )}
        </div>

      </div>
    </div>
  );
}