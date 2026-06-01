// app/barbershop/stats/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface StatsData {
  ingresosMes:      number;
  ingresosPrev:     number;
  variacionIngresos: number | null;
  totalCitas:       number;
  totalCitasPrev:   number;
  variacionCitas:   number | null;
  cancelaciones:    number;
  tasaCancelacion:  number;
  visitasPagina:    number;
  graficaDias:      { fecha: string; citas: number }[];
  rankingBarberos:  { nombre: string; foto: string | null; citas: number }[];
  rankingServicios: { nombre: string; citas: number; ingresos: number }[];
  rangeStart:       string;
  rangeEnd:         string;
}

type ModeType = 'month' | 'prevMonth' | 'range';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function formatPrice(p: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p);
}

function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function VariacionBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-500">sin datos previos</span>;
  const positive = value >= 0;
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${positive ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
      {positive ? '↑' : '↓'} {Math.abs(value)}% vs período anterior
    </span>
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function StatsPage() {
  const [data, setData]       = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [mode, setMode]       = useState<ModeType>('month');

  const now       = new Date();
  const [fromDate, setFromDate] = useState(toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [toDate,   setToDate]   = useState(toLocalDateStr(now));

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let url = '/api/barbershop/stats?mode=month';
      if (mode === 'prevMonth') {
        const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevE = new Date(now.getFullYear(), now.getMonth(), 0);
        url = `/api/barbershop/stats?mode=range&from=${toLocalDateStr(prev)}&to=${toLocalDateStr(prevE)}`;
      } else if (mode === 'range') {
        url = `/api/barbershop/stats?mode=range&from=${fromDate}&to=${toDate}`;
      }
      const res  = await fetch(url);
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Error'); return; }
      setData(json);
    } catch { setError('Error de conexión'); }
    finally { setLoading(false); }
  }, [mode, fromDate, toDate]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const maxCitas = data ? Math.max(...data.graficaDias.map(d => d.citas), 1) : 1;

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/barbershop" className="text-gray-400 hover:text-white">←</Link>
          <div>
            <h1 className="text-lg font-bold">📊 Estadísticas</h1>
            <p className="text-xs text-gray-400">Métricas de tu barbería</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* ── Filtros ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-white">🗓️ Período</p>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'month',     label: 'Este mes' },
              { key: 'prevMonth', label: 'Mes anterior' },
              { key: 'range',     label: 'Rango libre' },
            ] as const).map(opt => (
              <button key={opt.key} onClick={() => setMode(opt.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${mode === opt.key ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          {mode === 'range' && (
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Desde</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Hasta</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-400 focus:outline-none" />
              </div>
              <button onClick={fetchStats}
                className="mt-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition">
                Aplicar
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-xl text-sm">❌ {error}</div>
        ) : data && (
          <>
            {/* ── KPIs principales ── */}
            <div className="grid grid-cols-2 gap-3">

              {/* Ingresos */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">💰 Ingresos del período</p>
                <p className="text-2xl font-bold text-yellow-400">{formatPrice(data.ingresosMes)}</p>
                <div className="mt-1"><VariacionBadge value={data.variacionIngresos} /></div>
              </div>

              {/* Citas */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">📅 Citas realizadas</p>
                <p className="text-2xl font-bold text-white">{data.totalCitas}</p>
                <div className="mt-1"><VariacionBadge value={data.variacionCitas} /></div>
              </div>

              {/* Cancelaciones */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">❌ Cancelaciones</p>
                <p className="text-2xl font-bold text-white">{data.cancelaciones}</p>
                <p className="text-xs text-gray-500 mt-1">Tasa: {data.tasaCancelacion}%</p>
              </div>

              {/* Visitas */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">👁️ Visitas totales</p>
                <p className="text-2xl font-bold text-white">{data.visitasPagina.toLocaleString('es-CO')}</p>
                <p className="text-xs text-gray-500 mt-1">A tu página pública</p>
              </div>
            </div>

            {/* ── Gráfica de citas por día ── */}
            {data.graficaDias.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-4">📈 Citas por día</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.graficaDias} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="fecha" tick={{ fill: '#9CA3AF', fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                      labelStyle={{ color: '#F9FAFB', fontSize: 12 }}
                      itemStyle={{ color: '#FACC15' }}
                      formatter={(v: number) => [v + ' cita' + (v !== 1 ? 's' : ''), '']}
                    />
                    <Bar dataKey="citas" radius={[4, 4, 0, 0]}>
                      {data.graficaDias.map((entry, i) => (
                        <Cell key={i} fill={entry.citas === maxCitas ? '#FACC15' : '#374151'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Top barberos ── */}
            {data.rankingBarberos.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-3">🏆 Barberos más solicitados</p>
                <div className="space-y-3">
                  {data.rankingBarberos.map((b, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-5 flex-shrink-0">#{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden text-sm font-bold">
                        {b.foto
                          ? <img src={b.foto} alt={b.nombre} className="w-full h-full object-cover" />
                          : b.nombre[0]
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{b.nombre}</p>
                        {/* Barra proporcional */}
                        <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all"
                            style={{ width: `${(b.citas / (data.rankingBarberos[0]?.citas || 1)) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-yellow-400 font-bold text-sm flex-shrink-0">{b.citas} citas</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Top servicios ── */}
            {data.rankingServicios.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-3">✂️ Servicios más vendidos</p>
                <div className="space-y-3">
                  {data.rankingServicios.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-5 flex-shrink-0">#{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-white font-medium">{s.nombre}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-green-400 text-xs">{formatPrice(s.ingresos)}</span>
                            <span className="text-yellow-400 font-bold text-sm">{s.citas}x</span>
                          </div>
                        </div>
                        <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all"
                            style={{ width: `${(s.citas / (data.rankingServicios[0]?.citas || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Estado vacío si no hay datos ── */}
            {data.totalCitas === 0 && data.graficaDias.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-3">📭</p>
                <p>No hay citas en este período</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}