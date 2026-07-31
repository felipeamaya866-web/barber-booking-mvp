'use client';

import { useEffect, useState } from 'react';

const GOLD = '#C9A84C';

interface Service {
  id:       string;
  name:     string;
  price:    number;
  duration: number;
}

interface ComboItem {
  id:        string;
  serviceId: string;
  service:   Service;
}

interface Combo {
  id:          string;
  name:        string;
  description: string | null;
  price:       number;
  isActive:    boolean;
  items:       ComboItem[];
}

type FormState = { name: string; description: string; price: string; serviceIds: string[]; isActive: boolean };
const emptyForm: FormState = { name: '', description: '', price: '', serviceIds: [], isActive: true };

function formatPrice(p: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p);
}

export default function CombosPage() {
  const [combos, setCombos]       = useState<Combo[]>([]);
  const [services, setServices]   = useState<Service[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState<FormState>(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [error, setError]         = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [combosRes, servicesRes] = await Promise.all([
        fetch('/api/barbershop/combos'),
        fetch('/api/services'),
      ]);
      const combosData   = await combosRes.json();
      const servicesData = await servicesRes.json();
      if (combosRes.ok)   setCombos(combosData.combos);
      if (servicesRes.ok) setServices(servicesData.services ?? []);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  }

  function openEdit(c: Combo) {
    setEditingId(c.id);
    setForm({ name: c.name, description: c.description || '', price: String(c.price), serviceIds: c.items.map(i => i.serviceId), isActive: c.isActive });
    setError('');
    setShowModal(true);
  }

  function toggleService(id: string) {
    setForm(f => ({
      ...f,
      serviceIds: f.serviceIds.includes(id)
        ? f.serviceIds.filter(s => s !== id)
        : [...f.serviceIds, id],
    }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price || form.serviceIds.length < 2) {
      setError('Nombre, precio y al menos 2 servicios son requeridos'); return;
    }
    setSaving(true); setError('');
    try {
      const url    = editingId ? `/api/barbershop/combos/${editingId}` : '/api/barbershop/combos';
      const method = editingId ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar'); return; }

      if (editingId) {
        setCombos(prev => prev.map(c => c.id === editingId ? data.combo : c));
      } else {
        setCombos(prev => [data.combo, ...prev]);
      }
      setShowModal(false);
    } catch { setError('Error de conexión'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este combo?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/barbershop/combos/${id}`, { method: 'DELETE' });
      setCombos(prev => prev.filter(c => c.id !== id));
    } catch { /* silencioso */ }
    finally { setDeleting(null); }
  }

  async function toggleActive(c: Combo) {
    try {
      const res  = await fetch(`/api/barbershop/combos/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      const data = await res.json();
      if (res.ok) setCombos(prev => prev.map(x => x.id === c.id ? data.combo : x));
    } catch { /* silencioso */ }
  }

  const comboServicesTotal = (combo: Combo) =>
    combo.items.reduce((sum, i) => sum + i.service.price, 0);

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: GOLD }} />
            <h1 className="text-lg font-bold text-white">Combos de servicios</h1>
          </div>
          <button onClick={openCreate}
            className="px-4 py-2 rounded-xl text-sm font-bold transition hover:opacity-80"
            style={{ backgroundColor: GOLD, color: '#000' }}>
            + Crear combo
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
          </div>
        ) : combos.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
            <p className="text-4xl mb-3">📦</p>
            <p className="text-white font-semibold mb-1">Sin combos aún</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Crea paquetes combinando varios servicios con un precio especial
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {combos.map(combo => {
              const total   = comboServicesTotal(combo);
              const savings = total - combo.price;
              return (
                <div key={combo.id} className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-white">{combo.name}</h3>
                        {combo.description && (
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{combo.description}</p>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: combo.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)',
                          color: combo.isActive ? '#86efac' : '#fca5a5',
                          border: `1px solid ${combo.isActive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`,
                        }}>
                        {combo.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Servicios del combo */}
                    <div className="space-y-1.5 mb-4">
                      {combo.items.map(item => (
                        <div key={item.id} className="flex items-center gap-2 text-xs"
                          style={{ color: 'rgba(255,255,255,0.55)' }}>
                          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: GOLD }} />
                          <span className="flex-1">{item.service.name}</span>
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>{item.service.duration}min</span>
                          <span>{formatPrice(item.service.price)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Precio combo */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Precio individual: {formatPrice(total)}</p>
                        {savings > 0 && (
                          <p className="text-xs" style={{ color: '#86efac' }}>Ahorro: {formatPrice(savings)}</p>
                        )}
                      </div>
                      <p className="text-xl font-bold" style={{ color: GOLD }}>{formatPrice(combo.price)}</p>
                    </div>
                  </div>

                  <div className="flex gap-px" style={{ borderTop: '1px solid #1e1e1e' }}>
                    <button onClick={() => openEdit(combo)}
                      className="flex-1 py-2.5 text-xs font-medium hover:opacity-80 transition"
                      style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Editar
                    </button>
                    <div style={{ width: 1, backgroundColor: '#1e1e1e' }} />
                    <button onClick={() => toggleActive(combo)}
                      className="flex-1 py-2.5 text-xs font-medium hover:opacity-80 transition"
                      style={{ color: combo.isActive ? '#fca5a5' : '#86efac' }}>
                      {combo.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <div style={{ width: 1, backgroundColor: '#1e1e1e' }} />
                    <button onClick={() => handleDelete(combo.id)} disabled={deleting === combo.id}
                      className="flex-1 py-2.5 text-xs font-medium hover:opacity-80 transition"
                      style={{ color: '#fca5a5' }}>
                      {deleting === combo.id ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 px-4 pb-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#111111', border: '1px solid #2a2a2a' }}>

            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1e1e1e' }}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
                <h2 className="font-bold text-white text-sm">{editingId ? 'Editar combo' : 'Nuevo combo'}</h2>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-lg hover:opacity-60 transition"
                style={{ color: 'rgba(255,255,255,0.4)', backgroundColor: '#1a1a1a' }}>×</button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="rounded-xl px-4 py-2.5 text-sm"
                  style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Nombre del combo *
                </label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Corte + Barba + Mascarilla"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }} />
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Descripción
                </label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Descripción del combo..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }} />
              </div>

              {/* Selección de servicios */}
              <div>
                <label className="block text-[11px] font-medium mb-2 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Servicios del combo * (mín. 2)
                </label>
                {services.length === 0 ? (
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>No hay servicios creados aún.</p>
                ) : (
                  <div className="space-y-2">
                    {services.map(s => {
                      const selected = form.serviceIds.includes(s.id);
                      return (
                        <button key={s.id} onClick={() => toggleService(s.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition hover:opacity-80"
                          style={{
                            backgroundColor: selected ? `${GOLD}15` : '#1a1a1a',
                            border: `1px solid ${selected ? GOLD + '50' : '#2a2a2a'}`,
                          }}>
                          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px]"
                            style={{ backgroundColor: selected ? GOLD : '#333', color: '#000' }}>
                            {selected ? '✓' : ''}
                          </div>
                          <span className="flex-1 text-sm text-white">{s.name}</span>
                          <span className="text-xs font-semibold" style={{ color: selected ? GOLD : 'rgba(255,255,255,0.4)' }}>
                            {formatPrice(s.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Precio */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Precio del combo (COP) *
                  </label>
                  {form.serviceIds.length > 0 && (() => {
                    const sum = form.serviceIds.reduce((acc, id) => {
                      const svc = services.find(s => s.id === id);
                      return acc + (svc?.price ?? 0);
                    }, 0);
                    return (
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Individual: {formatPrice(sum)}
                      </span>
                    );
                  })()}
                </div>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="80000"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }} />
              </div>

              {/* Activo */}
              <div className="flex items-center justify-between py-2 px-4 rounded-xl"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                <span className="text-sm text-white">Combo activo</span>
                <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className="w-11 h-6 rounded-full relative transition-colors"
                  style={{ backgroundColor: form.isActive ? GOLD : '#333' }}>
                  <div className="absolute top-0.5 w-5 h-5 rounded-full transition-all bg-white"
                    style={{ left: form.isActive ? 'calc(100% - 22px)' : '2px' }} />
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium hover:opacity-80 transition"
                  style={{ backgroundColor: '#1a1a1a', color: 'rgba(255,255,255,0.5)', border: '1px solid #2a2a2a' }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 hover:opacity-80 transition"
                  style={{ backgroundColor: GOLD, color: '#000' }}>
                  {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear combo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
