'use client';

import { useEffect, useState } from 'react';

const GOLD = '#C9A84C';

interface Promotion {
  id:           string;
  title:        string;
  description:  string | null;
  discount:     number;
  discountType: string;
  validFrom:    string;
  validUntil:   string;
  isActive:     boolean;
}

type FormState = {
  title: string; description: string; discount: string;
  discountType: string; validFrom: string; validUntil: string; isActive: boolean;
};
const emptyForm: FormState = {
  title: '', description: '', discount: '', discountType: 'PERCENT',
  validFrom: '', validUntil: '', isActive: true,
};

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isExpired(str: string) {
  return new Date(str) < new Date();
}

function isOngoing(validFrom: string, validUntil: string) {
  const now = new Date();
  return new Date(validFrom) <= now && now <= new Date(validUntil);
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [error, setError]           = useState('');

  useEffect(() => { loadPromotions(); }, []);

  async function loadPromotions() {
    setLoading(true);
    try {
      const res  = await fetch('/api/barbershop/promotions');
      const data = await res.json();
      if (res.ok) setPromotions(data.promotions);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }

  function dateToInput(str: string) {
    return str ? str.substring(0, 10) : '';
  }

  function openCreate() {
    setEditingId(null);
    const today = new Date().toISOString().substring(0, 10);
    const next  = new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10);
    setForm({ ...emptyForm, validFrom: today, validUntil: next });
    setError('');
    setShowModal(true);
  }

  function openEdit(p: Promotion) {
    setEditingId(p.id);
    setForm({
      title: p.title, description: p.description || '', discount: String(p.discount),
      discountType: p.discountType, validFrom: dateToInput(p.validFrom),
      validUntil: dateToInput(p.validUntil), isActive: p.isActive,
    });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.discount || !form.validFrom || !form.validUntil) {
      setError('Título, descuento y fechas son requeridos'); return;
    }
    setSaving(true); setError('');
    try {
      const url    = editingId ? `/api/barbershop/promotions/${editingId}` : '/api/barbershop/promotions';
      const method = editingId ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, discount: parseFloat(form.discount) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar'); return; }

      if (editingId) {
        setPromotions(prev => prev.map(p => p.id === editingId ? data.promotion : p));
      } else {
        setPromotions(prev => [data.promotion, ...prev]);
      }
      setShowModal(false);
    } catch { setError('Error de conexión'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta promoción?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/barbershop/promotions/${id}`, { method: 'DELETE' });
      setPromotions(prev => prev.filter(p => p.id !== id));
    } catch { /* silencioso */ }
    finally { setDeleting(null); }
  }

  async function toggleActive(p: Promotion) {
    try {
      const res  = await fetch(`/api/barbershop/promotions/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      const data = await res.json();
      if (res.ok) setPromotions(prev => prev.map(x => x.id === p.id ? data.promotion : x));
    } catch { /* silencioso */ }
  }

  const now = new Date();

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: GOLD }} />
            <h1 className="text-lg font-bold text-white">Promociones</h1>
          </div>
          <button onClick={openCreate}
            className="px-4 py-2 rounded-xl text-sm font-bold transition hover:opacity-80"
            style={{ backgroundColor: GOLD, color: '#000' }}>
            + Nueva promoción
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
            <p className="text-4xl mb-3">🏷️</p>
            <p className="text-white font-semibold mb-1">Sin promociones aún</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Crea descuentos y ofertas especiales por tiempo limitado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {promotions.map(promo => {
              const ongoing  = isOngoing(promo.validFrom, promo.validUntil);
              const expired  = isExpired(promo.validUntil);
              const upcoming = new Date(promo.validFrom) > now;

              let statusLabel = 'Inactiva';
              let statusBg    = 'rgba(255,255,255,0.06)';
              let statusColor = 'rgba(255,255,255,0.4)';
              let statusBorder = 'rgba(255,255,255,0.1)';

              if (!promo.isActive)    { statusLabel = 'Inactiva'; }
              else if (expired)       { statusLabel = 'Expirada'; statusBg = 'rgba(239,68,68,0.1)'; statusColor = '#fca5a5'; statusBorder = 'rgba(239,68,68,0.25)'; }
              else if (upcoming)      { statusLabel = 'Próxima';  statusBg = 'rgba(201,168,76,0.1)'; statusColor = GOLD; statusBorder = 'rgba(201,168,76,0.3)'; }
              else if (ongoing)       { statusLabel = 'Activa';   statusBg = 'rgba(34,197,94,0.1)'; statusColor = '#86efac'; statusBorder = 'rgba(34,197,94,0.3)'; }

              return (
                <div key={promo.id} className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white">{promo.title}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: statusBg, color: statusColor, border: `1px solid ${statusBorder}` }}>
                            {statusLabel}
                          </span>
                        </div>
                        {promo.description && (
                          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{promo.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-black" style={{ color: GOLD }}>
                          {promo.discountType === 'PERCENT' ? `${promo.discount}%` : `$${promo.discount.toLocaleString('es-CO')}`}
                        </p>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {promo.discountType === 'PERCENT' ? 'de descuento' : 'de descuento'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <span>📅</span>
                      <span>{formatDate(promo.validFrom)} — {formatDate(promo.validUntil)}</span>
                    </div>
                  </div>

                  <div className="flex gap-px" style={{ borderTop: '1px solid #1e1e1e' }}>
                    <button onClick={() => openEdit(promo)}
                      className="flex-1 py-2.5 text-xs font-medium hover:opacity-80 transition"
                      style={{ color: 'rgba(255,255,255,0.5)' }}>Editar</button>
                    <div style={{ width: 1, backgroundColor: '#1e1e1e' }} />
                    <button onClick={() => toggleActive(promo)}
                      className="flex-1 py-2.5 text-xs font-medium hover:opacity-80 transition"
                      style={{ color: promo.isActive ? '#fca5a5' : '#86efac' }}>
                      {promo.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <div style={{ width: 1, backgroundColor: '#1e1e1e' }} />
                    <button onClick={() => handleDelete(promo.id)} disabled={deleting === promo.id}
                      className="flex-1 py-2.5 text-xs font-medium hover:opacity-80 transition"
                      style={{ color: '#fca5a5' }}>
                      {deleting === promo.id ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 px-4 pb-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#111111', border: '1px solid #2a2a2a' }}>

            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1e1e1e' }}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
                <h2 className="font-bold text-white text-sm">{editingId ? 'Editar promoción' : 'Nueva promoción'}</h2>
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
                  Título *
                </label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ej: 2×1 en cortes este fin de semana"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }} />
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Descripción
                </label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Detalles de la promoción..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }} />
              </div>

              {/* Tipo y valor del descuento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Tipo
                  </label>
                  <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                    <option value="PERCENT">Porcentaje (%)</option>
                    <option value="FIXED">Monto fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {form.discountType === 'PERCENT' ? 'Porcentaje' : 'Monto (COP)'}  *
                  </label>
                  <input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                    placeholder={form.discountType === 'PERCENT' ? '20' : '10000'}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }} />
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Válida desde *
                  </label>
                  <input type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Válida hasta *
                  </label>
                  <input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', colorScheme: 'dark' }} />
                </div>
              </div>

              {/* Activa */}
              <div className="flex items-center justify-between py-2 px-4 rounded-xl"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                <span className="text-sm text-white">Promoción activa</span>
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
                  {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear promoción'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
