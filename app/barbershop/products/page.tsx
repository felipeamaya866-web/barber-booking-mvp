'use client';

import { useEffect, useState } from 'react';

const GOLD = '#C9A84C';

interface Product {
  id:          string;
  name:        string;
  description: string | null;
  price:       number;
  image:       string | null;
  isAvailable: boolean;
}

type FormState = { name: string; description: string; price: string; image: string; isAvailable: boolean };

const emptyForm: FormState = { name: '', description: '', price: '', image: '', isAvailable: true };

function formatPrice(p: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p);
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 600;
      let w = img.width, h = img.height;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error al procesar imagen')); };
    img.src = url;
  });
}

export default function ProductsPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [error, setError]           = useState('');

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res  = await fetch('/api/barbershop/products');
      const data = await res.json();
      if (res.ok) setProducts(data.products);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), image: p.image || '', isAvailable: p.isAvailable });
    setError('');
    setShowModal(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setForm(f => ({ ...f, image: base64 }));
    } catch { setError('Error al procesar la imagen'); }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) { setError('Nombre y precio son requeridos'); return; }
    setSaving(true);
    setError('');
    try {
      const url    = editingId ? `/api/barbershop/products/${editingId}` : '/api/barbershop/products';
      const method = editingId ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar'); return; }

      if (editingId) {
        setProducts(prev => prev.map(p => p.id === editingId ? data.product : p));
      } else {
        setProducts(prev => [data.product, ...prev]);
      }
      setShowModal(false);
    } catch { setError('Error de conexión'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/barbershop/products/${id}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch { /* silencioso */ }
    finally { setDeleting(null); }
  }

  async function toggleAvailability(p: Product) {
    try {
      const res  = await fetch(`/api/barbershop/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !p.isAvailable }),
      });
      const data = await res.json();
      if (res.ok) setProducts(prev => prev.map(x => x.id === p.id ? data.product : x));
    } catch { /* silencioso */ }
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: GOLD }} />
            <h1 className="text-lg font-bold text-white">Productos</h1>
          </div>
          <button onClick={openCreate}
            className="px-4 py-2 rounded-xl text-sm font-bold transition hover:opacity-80"
            style={{ backgroundColor: GOLD, color: '#000' }}>
            + Agregar producto
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
            <p className="text-4xl mb-3">🛍️</p>
            <p className="text-white font-semibold mb-1">Sin productos aún</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Agrega los productos que vendes en tu barbería</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => (
              <div key={p.id} className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>

                {/* Imagen */}
                <div className="relative h-40 flex items-center justify-center"
                  style={{ backgroundColor: '#1a1a1a' }}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl opacity-30">🧴</span>
                  )}
                  {/* Badge disponibilidad */}
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        backgroundColor: p.isAvailable ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: p.isAvailable ? '#86efac' : '#fca5a5',
                        border: `1px solid ${p.isAvailable ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}>
                      {p.isAvailable ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-white text-sm">{p.name}</h3>
                  {p.description && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{p.description}</p>
                  )}
                  <p className="text-base font-bold mt-2" style={{ color: GOLD }}>{formatPrice(p.price)}</p>
                </div>

                {/* Acciones */}
                <div className="flex gap-px" style={{ borderTop: '1px solid #1e1e1e' }}>
                  <button onClick={() => openEdit(p)}
                    className="flex-1 py-2.5 text-xs font-medium transition hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.5)', backgroundColor: 'transparent' }}>
                    Editar
                  </button>
                  <div style={{ width: 1, backgroundColor: '#1e1e1e' }} />
                  <button onClick={() => toggleAvailability(p)}
                    className="flex-1 py-2.5 text-xs font-medium transition hover:opacity-80"
                    style={{ color: p.isAvailable ? '#fca5a5' : '#86efac' }}>
                    {p.isAvailable ? 'Desactivar' : 'Activar'}
                  </button>
                  <div style={{ width: 1, backgroundColor: '#1e1e1e' }} />
                  <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                    className="flex-1 py-2.5 text-xs font-medium transition hover:opacity-80"
                    style={{ color: '#fca5a5' }}>
                    {deleting === p.id ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal crear/editar ─────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 px-4 pb-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#111111', border: '1px solid #2a2a2a' }}>

            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1e1e1e' }}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
                <h2 className="font-bold text-white text-sm">{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
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

              {/* Imagen */}
              <div>
                <label className="block text-[11px] font-medium mb-2 uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Imagen del producto</label>
                {form.image ? (
                  <div className="relative">
                    <img src={form.image} alt="" className="w-full h-36 object-cover rounded-xl" />
                    <button onClick={() => setForm(f => ({ ...f, image: '' }))}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}>×</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 rounded-xl cursor-pointer transition hover:opacity-80"
                    style={{ backgroundColor: '#1a1a1a', border: '2px dashed #2a2a2a' }}>
                    <span className="text-2xl mb-1">📷</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Subir imagen</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Pomada para cabello..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }} />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Descripción del producto..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }} />
              </div>

              {/* Precio */}
              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Precio (COP) *</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="25000"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }} />
              </div>

              {/* Disponibilidad */}
              <div className="flex items-center justify-between py-2 rounded-xl px-4"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                <span className="text-sm text-white">Disponible para la venta</span>
                <button onClick={() => setForm(f => ({ ...f, isAvailable: !f.isAvailable }))}
                  className="w-11 h-6 rounded-full relative transition-colors"
                  style={{ backgroundColor: form.isAvailable ? GOLD : '#333' }}>
                  <div className="absolute top-0.5 w-5 h-5 rounded-full transition-all bg-white"
                    style={{ left: form.isAvailable ? 'calc(100% - 22px)' : '2px' }} />
                </button>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition hover:opacity-80"
                  style={{ backgroundColor: '#1a1a1a', color: 'rgba(255,255,255,0.5)', border: '1px solid #2a2a2a' }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 transition hover:opacity-80"
                  style={{ backgroundColor: GOLD, color: '#000' }}>
                  {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
