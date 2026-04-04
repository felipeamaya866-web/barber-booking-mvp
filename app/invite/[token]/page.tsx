// app/invite/[token]/page.tsx
// Página pública donde el barbero acepta la invitación y se registra

'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface InviteInfo {
  barberName:    string;
  barbershopName: string;
  barbershopLogo: string | null;
  expiresAt:     string;
  email:         string | null;
  alreadyUsed:   boolean;
  expired:       boolean;
}

export default function InvitePage({ params }: { params: { token: string } | Promise<{ token: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [token, setToken]         = useState('');
  const [info, setInfo]           = useState<InviteInfo | null>(null);
  const [loading, setLoading]     = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  useEffect(() => {
    async function init() {
      const { token: t } = await Promise.resolve(params);
      setToken(t);
      await fetchInviteInfo(t);
    }
    init();
  }, []);

  async function fetchInviteInfo(t: string) {
    try {
      const res  = await fetch(`/api/invite/${t}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invitación no válida'); return; }
      setInfo(data);
    } catch { setError('Error al cargar la invitación'); }
    finally { setLoading(false); }
  }

  async function handleAccept() {
    if (!session?.user?.id) {
      // Guardar token en sessionStorage y redirigir a login
      sessionStorage.setItem('pendingInviteToken', token);
      signIn('google', { callbackUrl: `/invite/${token}` });
      return;
    }
    try {
      setAccepting(true);
      setError('');
      const res  = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al aceptar'); return; }
      setSuccess(true);
      setTimeout(() => router.push('/barber/dashboard'), 2500);
    } catch { setError('Error de conexión'); }
    finally { setAccepting(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error && !info) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⛔</div>
        <h1 className="text-xl font-bold text-white mb-2">Invitación no válida</h1>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    </div>
  );

  if (info?.alreadyUsed) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-white mb-2">Esta invitación ya fue usada</h1>
        <p className="text-gray-400 text-sm">Si ya tienes cuenta, inicia sesión.</p>
        <button onClick={() => signIn('google', { callbackUrl: '/barber/dashboard' })}
          className="mt-4 bg-yellow-400 text-gray-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-300 transition">
          Iniciar sesión
        </button>
      </div>
    </div>
  );

  if (info?.expired) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⏰</div>
        <h1 className="text-xl font-bold text-white mb-2">Invitación expirada</h1>
        <p className="text-gray-400 text-sm">Pídele al dueño de la barbería que genere un nuevo link.</p>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-xl font-bold text-white mb-2">¡Solicitud enviada!</h1>
        <p className="text-gray-400 text-sm">El dueño de la barbería debe aprobar tu acceso. Te avisaremos cuando esté listo.</p>
        <div className="mt-4 w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-8 text-center">

        {/* Logo / inicial */}
        <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-900">
          {info?.barbershopLogo
            ? <img src={info.barbershopLogo} alt="" className="w-full h-full object-cover rounded-full" />
            : '✂️'
          }
        </div>

        <h1 className="text-xl font-bold text-white mb-1">Fuiste invitado</h1>
        <p className="text-gray-400 text-sm mb-1">
          <span className="text-yellow-400 font-semibold">{info?.barbershopName}</span> te invita a unirte como:
        </p>
        <p className="text-white font-bold text-lg mb-6">✂️ {info?.barberName}</p>

        {session?.user ? (
          <div className="mb-6">
            <p className="text-gray-400 text-sm">Aceptarás con tu cuenta:</p>
            <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3 mt-2">
              {session.user.image && (
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
              )}
              <div className="text-left">
                <p className="text-white text-sm font-medium">{session.user.name}</p>
                <p className="text-gray-400 text-xs">{session.user.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm mb-6">
            Necesitas iniciar sesión con Google para aceptar la invitación.
          </p>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm mb-4">
            ❌ {error}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full bg-yellow-400 text-gray-900 py-3 rounded-xl font-bold text-sm hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {accepting
            ? <><span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />Procesando...</>
            : session?.user ? '✅ Aceptar invitación' : '🔑 Iniciar sesión con Google'
          }
        </button>

        <p className="text-gray-600 text-xs mt-4">
          Este link expira el {info?.expiresAt ? new Date(info.expiresAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—'}
        </p>
      </div>
    </div>
  );
}