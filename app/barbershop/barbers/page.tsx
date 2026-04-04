// app/barbershop/barbers/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ScheduleEditor = dynamic(() => import('./components/ScheduleEditor'), { ssr: false });

interface Barber {
  id:           string;
  name:         string;
  phone:        string | null;
  email:        string | null;
  photo:        string | null;
  bio:          string | null;
  isActive:     boolean;
  inviteStatus: 'PENDING_INVITE' | 'INVITED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  showEarnings: boolean;
  user:         { name: string | null; email: string | null; image: string | null } | null;
}

const INVITE_STATUS_CONFIG = {
  PENDING_INVITE:    { label: 'Sin invitar',     color: 'bg-gray-800 text-gray-400 border-gray-700' },
  INVITED:           { label: 'Invitación enviada', color: 'bg-blue-900/40 text-blue-300 border-blue-800' },
  PENDING_APPROVAL:  { label: '⏳ Pendiente aprobación', color: 'bg-yellow-900/40 text-yellow-300 border-yellow-800' },
  APPROVED:          { label: '✅ Aprobado',     color: 'bg-green-900/40 text-green-300 border-green-800' },
  REJECTED:          { label: '❌ Rechazado',    color: 'bg-red-900/40 text-red-300 border-red-800' },
};

const EMPTY_FORM = { name: '', phone: '', email: '', bio: '' };

export default function BarbersPage() {
  const router = useRouter();
  const [barbers, setBarbers]       = useState<Barber[]>([]);
  const [loading, setLoading]       = useState(true);
  const [errorMsg, setErrorMsg]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving]         = useState(false);

  const [showModal, setShowModal]         = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [scheduleBarber, setScheduleBarber] = useState<Barber | null>(null);

  // Invite modal
  const [inviteBarber, setInviteBarber]   = useState<Barber | null>(null);
  const [inviteUrl, setInviteUrl]         = useState('');
  const [inviteExpiry, setInviteExpiry]   = useState('');
  const [generatingInvite, setGenerating] = useState(false);
  const [copied, setCopied]               = useState(false);

  useEffect(() => { fetchBarbers(); }, []);

  async function fetchBarbers() {
    try {
      setLoading(true);
      const res = await fetch('/api/barbershop/barbers');
      if (!res.ok) { if (res.status === 401) router.push('/login'); return; }
      const data = await res.json();
      setBarbers(data.barbers);
    } catch { setErrorMsg('No se pudo cargar el equipo'); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!form.name.trim()) { setErrorMsg('El nombre es obligatorio'); return; }
    try {
      setSaving(true);
      setErrorMsg('');
      const url    = editingBarber ? `/api/barbershop/barbers/${editingBarber.id}` : '/api/barbershop/barbers';
      const method = editingBarber ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Error al guardar'); return; }
      await fetchBarbers();
      setShowModal(false); setEditingBarber(null); setForm(EMPTY_FORM);
      setSuccessMsg(editingBarber ? 'Barbero actualizado ✅' : 'Barbero agregado ✅');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch { setErrorMsg('Error de conexión'); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(barber: Barber) {
    await fetch(`/api/barbershop/barbers/${barber.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !barber.isActive }),
    });
    fetchBarbers();
  }

  async function handleToggleEarnings(barber: Barber) {
    await fetch(`/api/barbershop/barbers/${barber.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showEarnings: !barber.showEarnings }),
    });
    fetchBarbers();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/barbershop/barbers/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    fetchBarbers();
    setSuccessMsg('Barbero eliminado ✅');
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  async function handleApprove(barber: Barber, action: 'approve' | 'reject') {
    const res  = await fetch(`/api/barbershop/barbers/${barber.id}/approve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      fetchBarbers();
      setSuccessMsg(action === 'approve' ? `✅ ${barber.name} aprobado` : `❌ ${barber.name} rechazado`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  }

  async function handleGenerateInvite(barber: Barber) {
    try {
      setGenerating(true);
      setInviteBarber(barber);
      setInviteUrl('');
      const res  = await fetch(`/api/barbershop/barbers/${barber.id}/invite`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: barber.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteUrl(data.inviteUrl);
        setInviteExpiry(new Date(data.expiresAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }));
        fetchBarbers();
      }
    } catch { /* silencioso */ }
    finally { setGenerating(false); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/barbershop" className="text-gray-400 hover:text-white p-1">←</Link>
          <div>
            <h1 className="text-lg font-bold">✂️ Mi Equipo</h1>
            <p className="text-xs text-gray-400">Gestiona y da acceso a tus barberos</p>
          </div>
          <button onClick={() => { setEditingBarber(null); setForm(EMPTY_FORM); setErrorMsg(''); setShowModal(true); }}
            className="ml-auto bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition">
            + Agregar
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {successMsg && <div className="bg-green-900/40 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm mb-4">{successMsg}</div>}
        {errorMsg && !showModal && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">❌ {errorMsg}</div>}

        {barbers.length === 0 ? (
          <div onClick={() => { setEditingBarber(null); setForm(EMPTY_FORM); setShowModal(true); }}
            className="border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center cursor-pointer hover:border-yellow-400/50 transition group">
            <div className="text-5xl mb-4">✂️</div>
            <p className="text-gray-400 group-hover:text-white transition font-medium">No hay barberos aún</p>
          </div>
        ) : (
          <div className="space-y-4">
            {barbers.map(barber => {
              const statusCfg = INVITE_STATUS_CONFIG[barber.inviteStatus];
              const isPendingApproval = barber.inviteStatus === 'PENDING_APPROVAL';
              return (
                <div key={barber.id} className={`bg-gray-900 border rounded-xl p-4 transition-all ${barber.isActive ? 'border-gray-800' : 'border-gray-800 opacity-60'}`}>

                  {/* Info principal */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-xl font-bold overflow-hidden">
                      {barber.user?.image
                        ? <img src={barber.user.image} alt="" className="w-full h-full object-cover" />
                        : barber.photo
                          ? <img src={barber.photo} alt="" className="w-full h-full object-cover" />
                          : barber.name[0].toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white">{barber.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusCfg.color}`}>{statusCfg.label}</span>
                        {!barber.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">Inactivo</span>}
                      </div>
                      {barber.user && (
                        <p className="text-xs text-gray-400 mt-0.5">👤 {barber.user.name || barber.user.email}</p>
                      )}
                      {barber.phone && <p className="text-sm text-gray-400">📞 {barber.phone}</p>}
                      {barber.email && <p className="text-sm text-gray-400 truncate">✉️ {barber.email}</p>}
                    </div>
                  </div>

                  {/* Botones de aprobación si está pendiente */}
                  {isPendingApproval && (
                    <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-3 mb-3">
                      <p className="text-yellow-300 text-sm font-medium mb-2">⏳ {barber.name} quiere unirse — ¿Aprobar acceso?</p>
                      {barber.user && (
                        <p className="text-xs text-gray-400 mb-2">Cuenta: {barber.user.email}</p>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(barber, 'approve')}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition">
                          ✅ Aprobar
                        </button>
                        <button onClick={() => handleApprove(barber, 'reject')}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition">
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Toggle mostrar ingresos (solo si aprobado) */}
                  {barber.inviteStatus === 'APPROVED' && (
                    <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 mb-3">
                      <span className="text-xs text-gray-300">💰 Mostrar sus ingresos en su panel</span>
                      <button onClick={() => handleToggleEarnings(barber)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${barber.showEarnings ? 'bg-yellow-400' : 'bg-gray-600'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${barber.showEarnings ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setEditingBarber(barber); setForm({ name: barber.name, phone: barber.phone || '', email: barber.email || '', bio: barber.bio || '' }); setErrorMsg(''); setShowModal(true); }}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition">✏️ Editar</button>

                    <button onClick={() => setScheduleBarber(barber)}
                      className="text-xs bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-400 px-3 py-1.5 rounded-lg transition border border-yellow-900/50">🗓️ Horario</button>

                    {/* Botón invitar — siempre disponible si no está aprobado aún */}
                    {barber.inviteStatus !== 'APPROVED' && (
                      <button onClick={() => handleGenerateInvite(barber)}
                        disabled={generatingInvite && inviteBarber?.id === barber.id}
                        className="text-xs bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 px-3 py-1.5 rounded-lg transition border border-blue-900/50 disabled:opacity-50">
                        {generatingInvite && inviteBarber?.id === barber.id ? '...' : '🔗 Invitar'}
                      </button>
                    )}

                    <button onClick={() => handleToggleActive(barber)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition">
                      {barber.isActive ? '⏸ Desactivar' : '▶ Activar'}
                    </button>

                    <button onClick={() => setDeleteConfirm(barber.id)}
                      className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1.5 rounded-lg transition border border-red-900/50">🗑️ Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal Crear/Editar ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editingBarber ? '✏️ Editar barbero' : '✂️ Nuevo barbero'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            {errorMsg && <div className="bg-red-900/40 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm mb-4">❌ {errorMsg}</div>}
            <div className="space-y-4">
              {[
                { label: 'Nombre *', key: 'name', type: 'text', placeholder: 'Ej: Carlos Rodríguez' },
                { label: 'Teléfono', key: 'phone', type: 'tel', placeholder: '+57 300 000 0000' },
                { label: 'Email',    key: 'email', type: 'email', placeholder: 'carlos@barberia.com' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Descripción</label>
                <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
                  placeholder="Especialista en cortes clásicos..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-600 transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-yellow-400 text-gray-900 py-3 rounded-xl text-sm font-bold hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />Guardando...</> : editingBarber ? 'Guardar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Eliminar ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-white mb-2">¿Eliminar barbero?</h2>
            <p className="text-gray-400 text-sm mb-6">También se eliminará su acceso al sistema.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-700 text-white py-3 rounded-xl text-sm hover:bg-gray-600 transition">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Link de Invitación ── */}
      {inviteBarber && inviteUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">🔗 Link de invitación</h2>
              <button onClick={() => { setInviteBarber(null); setInviteUrl(''); }} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Comparte este link con <span className="text-white font-medium">{inviteBarber.name}</span> para que pueda registrarse y acceder a su panel.
            </p>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 mb-3 break-all text-xs text-gray-300">
              {inviteUrl}
            </div>
            <button onClick={handleCopy}
              className="w-full bg-yellow-400 text-gray-900 py-3 rounded-xl text-sm font-bold hover:bg-yellow-300 transition mb-3">
              {copied ? '✅ ¡Copiado!' : '📋 Copiar link'}
            </button>
            <p className="text-center text-xs text-gray-500">Expira el {inviteExpiry}</p>
          </div>
        </div>
      )}

      {/* ── Editor de horarios ── */}
      {scheduleBarber && (
        <ScheduleEditor barberId={scheduleBarber.id} barberName={scheduleBarber.name} onClose={() => setScheduleBarber(null)} />
      )}
    </div>
  );
}