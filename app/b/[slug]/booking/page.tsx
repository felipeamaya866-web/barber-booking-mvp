// app/b/[slug]/booking/page.tsx
// Flujo de reserva paso a paso para clientes

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface Service {
  id:          string;
  name:        string;
  description: string | null;
  price:       number;
  duration:    number;
}

interface Barber {
  id:      string;
  name:    string;
  photo:   string | null;
  bio:     string | null;
}

interface Barbershop {
  id:          string;
  name:        string;
  slug:        string;
  address:     string;
  phone:       string;
  colors:      string[];
  services:    Service[];
  barbers:     Barber[];
}

interface TimeSlot {
  datetime: string;
  label:    string;
}

type Step = 1 | 2 | 3 | 4 | 5;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function formatPrice(price: number) {
  return new Intl.NumberFormat('es-CO', {
    style:                 'currency',
    currency:              'COP',
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
}

function getNextDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // ✅ Usar fecha local en lugar de UTC
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
  }
  return days;
}

// ─────────────────────────────────────────────
// COMPONENT PRINCIPAL
// ─────────────────────────────────────────────
export default function BookingPage() {
  const params  = useParams();
  const router  = useRouter();
  const slug    = params.slug as string;
  const { data: session } = useSession();

  const [step, setStep]               = useState<Step>(1);
  const [barbershop, setBarbershop]   = useState<Barbershop | null>(null);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  // Selecciones del usuario
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber]   = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate]       = useState('');
  const [selectedSlot, setSelectedSlot]       = useState<TimeSlot | null>(null);
  const [slots, setSlots]                     = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots]       = useState(false);

  // Datos del invitado
  const [guestName, setGuestName]   = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Resultado final
  const [appointmentResult, setAppointmentResult] = useState<Record<string, unknown> | null>(null);

  const days = getNextDays(14); // próximos 14 días

  // ── Cargar barbería ────────────────────────
  useEffect(() => {
    fetchBarbershop();
  }, [slug]);

  async function fetchBarbershop() {
    try {
      const res  = await fetch(`/api/public/barbershop/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBarbershop(data.barbershop);
    } catch {
      setError('No se pudo cargar la barbería');
    } finally {
      setLoading(false);
    }
  }

  // ── Cargar slots disponibles ───────────────
  useEffect(() => {
    if (!selectedBarber || !selectedDate || !selectedService) return;
    fetchSlots();
  }, [selectedBarber, selectedDate, selectedService]);

  async function fetchSlots() {
    try {
      setLoadingSlots(true);
      setSelectedSlot(null);
      const res  = await fetch(
        `/api/public/availability?barberId=${selectedBarber!.id}&date=${selectedDate}&duration=${selectedService!.duration}`
      );
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  // ── Confirmar cita ─────────────────────────
  async function handleConfirm() {
    if (!selectedService || !selectedBarber || !selectedSlot || !barbershop) return;

    // Validar datos de invitado si no está logueado
    if (!session?.user) {
      if (!guestName.trim()) { setError('Por favor ingresa tu nombre'); return; }
      if (!guestPhone.trim()) { setError('Por favor ingresa tu teléfono'); return; }
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await fetch('/api/public/booking', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          barbershopSlug: slug,
          serviceId:      selectedService.id,
          barberId:       selectedBarber.id,
          datetime:       selectedSlot.datetime,
          guestName:      session?.user ? undefined : guestName,
          guestPhone:     session?.user ? undefined : guestPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al agendar'); return; }

      setAppointmentResult(data.appointment);
      setStep(5);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  const primaryColor   = barbershop?.colors[0] || '#111827';
  const secondaryColor = barbershop?.colors[1] || '#F59E0B';

  // ── Loading ────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error && !barbershop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href={`/b/${slug}`} className="text-blue-600 hover:underline">← Volver</Link>
        </div>
      </div>
    );
  }

  if (!barbershop) return null;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="py-6 px-4 text-white" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-lg mx-auto">
          <Link href={`/b/${slug}`} className="text-white/70 hover:text-white text-sm flex items-center gap-1 mb-3">
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold">{barbershop.name}</h1>
          <p className="text-white/70 text-sm mt-1">Reservar una cita</p>

          {/* Progress bar */}
          {step < 5 && (
            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4].map(s => (
                <div
                  key={s}
                  className="flex-1 h-1 rounded-full transition-all"
                  style={{
                    backgroundColor: s <= step
                      ? secondaryColor
                      : 'rgba(255,255,255,0.3)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Error global */}
        {error && step < 5 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            ❌ {error}
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* PASO 1 — ELEGIR SERVICIO              */}
        {/* ══════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">¿Qué servicio deseas?</h2>
            <p className="text-gray-500 text-sm mb-5">Paso 1 de 4</p>

            {barbershop.services.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-4xl mb-3">💈</p>
                <p>Esta barbería aún no tiene servicios registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {barbershop.services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => { setSelectedService(service); setStep(2); }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedService?.id === service.id
                        ? 'border-current bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    style={selectedService?.id === service.id ? { borderColor: primaryColor } : {}}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{service.name}</p>
                        {service.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                        )}
                        <p className="text-sm text-gray-400 mt-1">⏱️ {service.duration} min</p>
                      </div>
                      <span className="font-bold text-lg ml-4 flex-shrink-0" style={{ color: primaryColor }}>
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* PASO 2 — ELEGIR BARBERO               */}
        {/* ══════════════════════════════════════ */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">¿Con quién quieres tu cita?</h2>
            <p className="text-gray-500 text-sm mb-5">Paso 2 de 4 · {selectedService?.name}</p>

            {barbershop.barbers.filter(b => (b as Barber & { isActive?: boolean }).isActive !== false).length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-4xl mb-3">✂️</p>
                <p>No hay barberos disponibles en este momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {barbershop.barbers.map(barber => (
                  <button
                    key={barber.id}
                    onClick={() => { setSelectedBarber(barber); setStep(3); }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 bg-white ${
                      selectedBarber?.id === barber.id
                        ? 'border-current'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={selectedBarber?.id === barber.id ? { borderColor: primaryColor } : {}}
                  >
                    <div
                      className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-bold text-white overflow-hidden"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {barber.photo
                        ? <img src={barber.photo} alt={barber.name} className="w-full h-full object-cover" />
                        : barber.name[0].toUpperCase()
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{barber.name}</p>
                      {barber.bio && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{barber.bio}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => setStep(1)} className="mt-4 text-gray-400 hover:text-gray-600 text-sm">
              ← Cambiar servicio
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* PASO 3 — ELEGIR FECHA Y HORA          */}
        {/* ══════════════════════════════════════ */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">¿Cuándo quieres tu cita?</h2>
            <p className="text-gray-500 text-sm mb-5">Paso 3 de 4 · {selectedBarber?.name}</p>

            {/* Selector de fecha */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Elige una fecha:</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map(day => {
                  const date    = new Date(day + 'T00:00:00');
                  const isToday = day === days[0];
                  const dayName = date.toLocaleDateString('es-CO', { weekday: 'short' });
                  const dayNum  = date.getDate();
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`flex-shrink-0 w-14 py-2 rounded-xl text-center transition-all border-2 ${
                        selectedDate === day
                          ? 'text-white border-transparent'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                      style={selectedDate === day ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                    >
                      <p className="text-xs capitalize">{isToday ? 'Hoy' : dayName}</p>
                      <p className="text-lg font-bold">{dayNum}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots de hora */}
            {selectedDate && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Horas disponibles — {formatDate(selectedDate)}:
                </p>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-gray-400 py-4">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Cargando horarios...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-2xl mb-2">😕</p>
                    <p className="text-sm">No hay horarios disponibles este día</p>
                    <p className="text-xs mt-1">Prueba con otra fecha</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button
                        key={slot.datetime}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                          selectedSlot?.datetime === slot.datetime
                            ? 'text-white border-transparent'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                        style={selectedSlot?.datetime === slot.datetime
                          ? { backgroundColor: primaryColor, borderColor: primaryColor }
                          : {}
                        }
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(2)} className="text-gray-400 hover:text-gray-600 text-sm">
                ← Atrás
              </button>
              <button
                onClick={() => { if (selectedDate && selectedSlot) setStep(4); }}
                disabled={!selectedDate || !selectedSlot}
                className="ml-auto px-6 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* PASO 4 — DATOS DEL CLIENTE            */}
        {/* ══════════════════════════════════════ */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">¿Quién agenda la cita?</h2>
            <p className="text-gray-500 text-sm mb-5">Paso 4 de 4 · Último paso</p>

            {/* Resumen de la cita */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Resumen de tu cita</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Servicio</span>
                <span className="font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Barbero</span>
                <span className="font-medium">{selectedBarber?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium capitalize">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hora</span>
                <span className="font-medium">{selectedSlot?.label}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-gray-500 text-sm">Total</span>
                <span className="font-bold" style={{ color: primaryColor }}>
                  {formatPrice(selectedService?.price || 0)}
                </span>
              </div>
            </div>

            {/* Si está logueado */}
            {session?.user ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                {session.user.image && (
                  <img src={session.user.image} alt="" className="w-10 h-10 rounded-full" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{session.user.name}</p>
                  <p className="text-sm text-gray-500">{session.user.email}</p>
                </div>
                <span className="ml-auto text-green-600 text-xs font-medium">✓ Conectado</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Opción 1: Continuar como invitado */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nombre completo <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      placeholder="Ej: Carlos Rodríguez"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Teléfono / WhatsApp <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      placeholder="Ej: +57 300 000 0000"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Separador */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400">o</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                {/* Opción 2: Login con Google */}
                <button
                  onClick={() => signIn('google')}
                  className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 bg-white rounded-xl py-3 text-gray-700 font-medium hover:border-gray-300 transition"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </button>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(3)} className="text-gray-400 hover:text-gray-600 text-sm">
                ← Atrás
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="ml-auto px-6 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-all flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Agendando...</>
                  : '✅ Confirmar cita'
                }
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* PASO 5 — CONFIRMACIÓN ✅              */}
        {/* ══════════════════════════════════════ */}
        {step === 5 && appointmentResult && (
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cita confirmada!</h2>
            <p className="text-gray-500 mb-6">Te esperamos en {barbershop.name}</p>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-left space-y-3 mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Detalles de tu cita</p>
              {[
                ['✂️ Servicio',  (appointmentResult.service as Record<string,string>)?.name],
                ['👤 Barbero',   (appointmentResult.barber as Record<string,string>)?.name],
                ['📅 Fecha',     formatDate(new Date(appointmentResult.date as string).toISOString().split('T')[0])],
                ['🕐 Hora',      new Date(appointmentResult.date as string).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })],
                ['📍 Dirección', (appointmentResult.barbershop as Record<string,string>)?.address],
                ['📞 Teléfono',  (appointmentResult.barbershop as Record<string,string>)?.phone],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900 text-right ml-4">{value}</span>
                </div>
              ))}
            </div>

            <Link
              href={`/b/${slug}`}
              className="inline-block w-full py-3 rounded-xl text-white font-bold text-sm text-center"
              style={{ backgroundColor: primaryColor }}
            >
              Volver a la barbería
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}