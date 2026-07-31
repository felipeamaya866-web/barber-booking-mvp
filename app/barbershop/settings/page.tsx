// app/barbershop/settings/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface BarbershopSettings {
  id: string;
  name: string;
  slug: string;
  description: string;
  bio: string;
  address: string;
  phone: string;
  primaryColor: string;
  secondaryColor: string;
  photos: string[];
  logoUrl: string;
  plan: string;
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
  subscriptionEndDate?: string | null;
  lat?: number | null;
  lng?: number | null;
  minBookingNoticeHours?: number;
  minCancelNoticeHours?:  number;
  maxAdvanceBookingDays?: number;
}

type Tab = 'info' | 'bio' | 'gallery' | 'colors' | 'booking';

const DEFAULT_COLORS = {
  primaryColor: '#111827',
  secondaryColor: '#F59E0B',
};

const PRESET_COLORS = [
  { label: 'Clásico Negro',  primary: '#111827', secondary: '#F59E0B' },
  { label: 'Azul Oscuro',    primary: '#1E3A5F', secondary: '#60A5FA' },
  { label: 'Verde Bosque',   primary: '#14532D', secondary: '#4ADE80' },
  { label: 'Burdeos',        primary: '#7F1D1D', secondary: '#FCA5A5' },
  { label: 'Morado',         primary: '#4C1D95', secondary: '#C4B5FD' },
  { label: 'Gris Plata',     primary: '#1F2937', secondary: '#9CA3AF' },
];

const VIA_TYPES = [
  'Calle', 'Carrera', 'Avenida', 'Av. Calle', 'Av. Carrera',
  'Diagonal', 'Transversal', 'Circular', 'Vía',
];

const CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué',
  'Pasto', 'Manizales', 'Neiva', 'Villavicencio', 'Armenia',
  'Valledupar', 'Montería', 'Sincelejo', 'Popayán', 'Floridablanca',
  'Soacha', 'Bello', 'Soledad', 'Itagüí', 'Palmira',
];

interface AddressParts {
  viaType: string;
  viaNum: string;
  cruce: string;
  puerta: string;
  complemento: string;
  ciudad: string;
}

function parseAddress(address: string): AddressParts {
  const d: AddressParts = { viaType: 'Calle', viaNum: '', cruce: '', puerta: '', complemento: '', ciudad: '' };
  if (!address?.trim()) return d;
  const lastComma = address.lastIndexOf(',');
  const ciudad = lastComma >= 0 ? address.substring(lastComma + 1).trim() : '';
  const withoutCity = lastComma >= 0 ? address.substring(0, lastComma).trim() : address;
  const types = ['Av. Calle','Av. Carrera','Avenida Calle','Avenida Carrera','Avenida','Transversal','Diagonal','Circular','Carrera','Calle','Vía'];
  let viaType = 'Calle'; let rest = withoutCity;
  for (const t of types) {
    if (withoutCity.toLowerCase().startsWith(t.toLowerCase())) {
      viaType = t; rest = withoutCity.substring(t.length).trim(); break;
    }
  }
  const hashIdx = rest.indexOf('#');
  const viaNum   = (hashIdx >= 0 ? rest.substring(0, hashIdx) : rest).trim();
  const afterHash = hashIdx >= 0 ? rest.substring(hashIdx + 1) : '';
  const dashIdx  = afterHash.indexOf('-');
  const cruce    = (dashIdx >= 0 ? afterHash.substring(0, dashIdx) : afterHash).trim();
  const puerta   = dashIdx >= 0 ? afterHash.substring(dashIdx + 1).trim() : '';
  return { viaType, viaNum, cruce, puerta, complemento: '', ciudad };
}

function buildAddress(p: AddressParts): string {
  if (!p.viaNum.trim()) return p.ciudad.trim();
  let addr = `${p.viaType} ${p.viaNum.trim()}`;
  if (p.cruce.trim() || p.puerta.trim()) addr += ` #${p.cruce.trim()}-${p.puerta.trim()}`;
  if (p.complemento.trim()) addr += `, ${p.complemento.trim()}`;
  if (p.ciudad.trim()) addr += `, ${p.ciudad.trim()}`;
  return addr;
}

// ─────────────────────────────────────────────
// HELPER: archivo a base64
// ─────────────────────────────────────────────
// HELPER: geocodificar dirección desde el browser (Nominatim, sin API key)
// Maneja el formato colombiano "Calle X #Y-Z" con fallbacks progresivos
async function nominatimQuery(q: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=co`,
    { headers: { 'User-Agent': 'BarberBooking/1.0' } }
  );
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function geocodeFromBrowser(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address?.trim()) return null;
  try {
    const full = `${address.trim()}, Colombia`;
    // Intento 1: dirección completa
    const r1 = await nominatimQuery(full);
    if (r1) return r1;

    // Intento 2: quitar el número de puerta (#xxx-xx) — típico colombiano
    // "Calle 150B #117-40" → "Calle 150B, Colombia"
    const streetOnly = address.replace(/#\S+/g, '').replace(/\s+/g, ' ').trim();
    if (streetOnly !== address.trim()) {
      const r2 = await nominatimQuery(`${streetOnly}, Colombia`);
      if (r2) return r2;
    }

    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────
// COMPONENT PRINCIPAL
// ─────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab]           = useState<Tab>('info');
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo]   = useState(false);
  const [successMsg, setSuccessMsg]         = useState('');
  const [errorMsg, setErrorMsg]             = useState('');

  const [settings, setSettings] = useState<BarbershopSettings>({
    id: '', name: '', slug: '', description: '', bio: '',
    address: '', phone: '',
    primaryColor:   DEFAULT_COLORS.primaryColor,
    secondaryColor: DEFAULT_COLORS.secondaryColor,
    photos: [], logoUrl: '', plan: 'LITE',
  });

  useEffect(() => { fetchSettings(); }, []);

  // ── Fetch ──────────────────────────────────
  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await fetch('/api/barbershop/settings');
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return; }
        throw new Error('Error al cargar configuración');
      }
      const data = await res.json();
      setSettings({
        ...data.barbershop,
        primaryColor:   data.barbershop.primaryColor   || DEFAULT_COLORS.primaryColor,
        secondaryColor: data.barbershop.secondaryColor || DEFAULT_COLORS.secondaryColor,
        photos:         data.barbershop.photos         || [],
        description:    data.barbershop.description    || '',
        bio:            data.barbershop.bio            || '',
        logoUrl:        data.barbershop.logoUrl        || '',
      });
    } catch {
      setErrorMsg('No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  }

  // ── Guardar parcial ────────────────────────
  async function handleSave(fieldsToSave: Partial<BarbershopSettings>) {
    try {
      setSaving(true);
      setSuccessMsg('');
      setErrorMsg('');
      const res = await fetch('/api/barbershop/settings', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(fieldsToSave),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Error al guardar'); return; }
      setSettings(prev => ({ ...prev, ...data.barbershop }));
      setSuccessMsg('¡Guardado correctamente!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setErrorMsg('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  // ✅ Subir logo con base64
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrorMsg('Solo se permiten imágenes'); return; }
    if (file.size > 2 * 1024 * 1024)    { setErrorMsg('El logo no puede superar 2MB'); return; }

    try {
      setUploadingLogo(true);
      setErrorMsg('');
      const base64 = await fileToBase64(file);
      setSettings(prev => ({ ...prev, logoUrl: base64 }));
      await handleSave({ logoUrl: base64 });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al subir el logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  // ✅ Subir fotos galería con base64
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrorMsg('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024)    { setErrorMsg('La imagen no puede superar 5MB'); return; }
    if (settings.photos.length >= 40)   { setErrorMsg('Máximo de fotos alcanzado'); return; }

    try {
      setUploadingPhoto(true);
      setErrorMsg('');
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/barbershop/photos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ photo: base64 }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Error al subir la foto'); return; }
      setSettings(prev => ({ ...prev, photos: data.photos }));
      setSuccessMsg('Foto agregada');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeletePhoto(indexToDelete: number) {
    try {
      const res = await fetch('/api/barbershop/photos', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ index: indexToDelete }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Error al eliminar la foto'); return; }
      setSettings(prev => ({ ...prev, photos: data.photos }));
    } catch {
      setErrorMsg('Error de conexión');
    }
  }

  const GOLD = '#C9A84C';

  // ── Loading ────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'info',    label: 'Información', icon: '🏪' },
    { id: 'bio',     label: 'Contenido',   icon: '📝' },
    { id: 'gallery', label: 'Galería',     icon: '📸' },
    { id: 'colors',  label: 'Colores',     icon: '🎨' },
    { id: 'booking', label: 'Reservas',    icon: '⏱️' },
  ];

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0a0a0a' }}>

      {/* Mensajes */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Heading */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: GOLD }} />
          <h1 className="text-lg font-bold text-white">Configuración</h1>
          <span className="ml-auto text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', color: 'rgba(255,255,255,0.5)' }}>
            Plan {settings.plan}
          </span>
        </div>
        {/* Banner suscripción vencida */}
        {(settings.subscriptionStatus === 'EXPIRED' || settings.subscriptionStatus === 'CANCELLED') && (
          <div className="px-4 py-3 rounded-xl text-sm mb-4 flex items-center justify-between gap-3"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
            <span>⚠️ Tu suscripción ha vencido. Algunas funciones están bloqueadas.</span>
            <a href="/barbershop/plans"
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition"
              style={{ backgroundColor: GOLD, color: '#000' }}>
              Renovar plan
            </a>
          </div>
        )}
        {successMsg && (
          <div className="px-4 py-3 rounded-xl text-sm mb-4"
            style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#86efac' }}>
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="px-4 py-3 rounded-xl text-sm mb-4"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 min-w-max flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={activeTab === tab.id
                ? { backgroundColor: GOLD, color: '#000' }
                : { color: 'rgba(255,255,255,0.4)' }}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'info' && (
          <InfoTab
            settings={settings}
            setSettings={setSettings}
            logoInputRef={logoInputRef}
            uploadingLogo={uploadingLogo}
            onLogoUpload={handleLogoUpload}
            onSave={handleSave}
            saving={saving}
          />
        )}

        {activeTab === 'bio' && (
          <BioTab
            settings={settings}
            setSettings={setSettings}
            onSave={() => handleSave({ description: settings.description, bio: settings.bio })}
            saving={saving}
          />
        )}

        {activeTab === 'gallery' && (
          <GalleryTab
            settings={settings}
            fileInputRef={fileInputRef}
            uploadingPhoto={uploadingPhoto}
            onUpload={handlePhotoUpload}
            onDelete={handleDeletePhoto}
          />
        )}

        {activeTab === 'colors' && (
          <ColorsTab
            settings={settings}
            setSettings={setSettings}
            onSave={() => handleSave({ primaryColor: settings.primaryColor, secondaryColor: settings.secondaryColor })}
            saving={saving}
          />
        )}

        {activeTab === 'booking' && (
          <BookingPolicyTab
            settings={settings}
            setSettings={setSettings}
            onSave={() => handleSave({
              minBookingNoticeHours: settings.minBookingNoticeHours,
              minCancelNoticeHours:  settings.minCancelNoticeHours,
              maxAdvanceBookingDays: settings.maxAdvanceBookingDays,
            })}
            saving={saving}
          />
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════
// SUB-COMPONENTES
// ═════════════════════════════════════════════

function InfoTab({
  settings, setSettings, logoInputRef, uploadingLogo, onLogoUpload, onSave, saving,
}: {
  settings: BarbershopSettings;
  setSettings: React.Dispatch<React.SetStateAction<BarbershopSettings>>;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  uploadingLogo: boolean;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: (fields: Partial<BarbershopSettings>) => void;
  saving: boolean;
}) {
  const [parts, setParts] = useState<AddressParts>(() => parseAddress(settings.address));
  const [geocoding, setGeocoding] = useState(false);

  const selectClass = 'w-full rounded-lg px-3 py-3 text-white text-sm focus:outline-none transition-colors' +
    ' bg-[#1a1a1a] border border-[#2a2a2a] focus:border-[#C9A84C]';
  const inputClass  = 'w-full rounded-lg px-3 py-3 text-white placeholder-[rgba(255,255,255,0.25)] text-sm focus:outline-none transition-colors' +
    ' bg-[#1a1a1a] border border-[#2a2a2a] focus:border-[#C9A84C]';

  const set = (key: keyof AddressParts) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setParts((prev: AddressParts) => ({ ...prev, [key]: e.target.value }));

  const builtAddress = buildAddress(parts);

  async function handleSaveInfo() {
    setGeocoding(true);
    const fields: Partial<BarbershopSettings> & { lat?: number; lng?: number } = {
      name:    settings.name,
      phone:   settings.phone,
      address: builtAddress,
    };
    if (parts.ciudad && parts.viaNum) {
      // Geocodificar con calle + ciudad (sin número de puerta, más preciso en Nominatim)
      const geocodeQuery = `${parts.viaType} ${parts.viaNum}, ${parts.ciudad}, Colombia`;
      const coords = await geocodeFromBrowser(geocodeQuery);
      if (coords) { fields.lat = coords.lat; fields.lng = coords.lng; }
    }
    setGeocoding(false);
    onSave(fields);
  }

  return (
    <div className="space-y-5">
      {/* ── Logo ─────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Logo de la barbería</label>
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full border-2 border-gray-700 overflow-hidden flex items-center justify-center bg-gray-800 flex-shrink-0 cursor-pointer hover:border-yellow-400 transition-colors"
            onClick={() => logoInputRef.current?.click()}
          >
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-2xl">💈</div>
                <p className="text-gray-500 text-xs mt-1">Sin logo</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {uploadingLogo
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Subiendo...</>
                : <>📤 {settings.logoUrl ? 'Cambiar logo' : 'Subir logo'}</>
              }
            </button>
            {settings.logoUrl && (
              <button
                onClick={() => setSettings(prev => ({ ...prev, logoUrl: '' }))}
                className="text-xs text-red-400 hover:text-red-300 transition-colors text-left px-1"
              >
                🗑️ Eliminar logo
              </button>
            )}
            <p className="text-xs text-gray-500">JPG, PNG · máx. 2MB</p>
          </div>
        </div>
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
      </div>

      <div className="border-t" style={{ borderColor: '#1e1e1e' }} />

      {/* ── Nombre ───────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-white mb-1.5">Nombre de la barbería</label>
        <input
          type="text" value={settings.name}
          onChange={e => setSettings(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ej: Barbería El Clásico"
          className={inputClass}
        />
      </div>

      {/* ── Dirección estructurada ───────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Dirección</label>
        <div className="space-y-2">

          {/* Fila 1: tipo de vía + número */}
          <div className="flex gap-2">
            <div className="w-40 shrink-0">
              <label className="block text-xs text-gray-500 mb-1">Tipo de vía</label>
              <select value={parts.viaType} onChange={set('viaType')} className={selectClass}>
                {VIA_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Número de vía</label>
              <input value={parts.viaNum} onChange={set('viaNum')} placeholder="150B" className={inputClass} />
            </div>
          </div>

          {/* Fila 2: cruce y puerta */}
          <div className="flex gap-2 items-end">
            <span className="text-gray-400 text-lg pb-3">#</span>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Cruce</label>
              <input value={parts.cruce} onChange={set('cruce')} placeholder="117" className={inputClass} />
            </div>
            <span className="text-gray-400 text-lg pb-3">—</span>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Puerta</label>
              <input value={parts.puerta} onChange={set('puerta')} placeholder="40" className={inputClass} />
            </div>
          </div>

          {/* Fila 3: complemento */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Complemento <span className="text-gray-600">(opcional)</span></label>
            <input value={parts.complemento} onChange={set('complemento')} placeholder="Ej: Local 3, Apto 201, Torre B" className={inputClass} />
          </div>

          {/* Fila 4: ciudad */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ciudad</label>
            <select value={parts.ciudad} onChange={set('ciudad')} className={selectClass}>
              <option value="">Selecciona una ciudad</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Preview de la dirección construida */}
        {builtAddress && (
          <div className="mt-3 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">Vista previa:</span>
            <span className="text-xs text-white font-mono">{builtAddress}</span>
            {settings.lat && settings.lng && (
              <span className="ml-auto text-xs text-green-400 shrink-0">📍 Ubicada</span>
            )}
          </div>
        )}
      </div>

      {/* ── Teléfono ─────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Teléfono / WhatsApp</label>
        <input
          type="tel" value={settings.phone}
          onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="Ej: +57 300 000 0000"
          className={inputClass}
        />
      </div>

      {/* ── Slug ─────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">URL de tu landing page</label>
        <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <span className="text-gray-500 pl-4 pr-1 text-sm whitespace-nowrap">barberbooking.com/b/</span>
          <span className="text-yellow-400 font-mono text-sm py-3 pr-4">{settings.slug}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">El slug no se puede cambiar después del setup.</p>
      </div>

      <SaveButton
        onSave={handleSaveInfo}
        saving={saving || geocoding}
        label={geocoding ? 'Obteniendo ubicación...' : 'Guardar cambios'}
      />
    </div>
  );
}

function BioTab({ settings, setSettings, onSave, saving }: {
  settings: BarbershopSettings;
  setSettings: React.Dispatch<React.SetStateAction<BarbershopSettings>>;
  onSave: () => void;
  saving: boolean;
}) {
  const maxDesc = 120;
  const maxBio  = 600;
  const inputCls = 'w-full rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-colors bg-[#1a1a1a] border border-[#2a2a2a] focus:border-[#C9A84C] placeholder-[rgba(255,255,255,0.25)]';

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-1">Subtítulo del hero</label>
        <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Aparece debajo del nombre en la parte superior.</p>
        <input
          type="text" value={settings.description}
          onChange={e => setSettings(prev => ({ ...prev, description: e.target.value.slice(0, maxDesc) }))}
          placeholder="Ej: La barbería más elegante de la ciudad"
          className={inputCls}
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{maxDesc - settings.description.length} restantes</span>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: '#1e1e1e' }} />

      <div>
        <label className="block text-sm font-medium text-white mb-1">Sobre Nosotros</label>
        <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Sección completa debajo del hero. Si está vacío, no aparece.</p>
        <textarea
          value={settings.bio}
          onChange={e => setSettings(prev => ({ ...prev, bio: e.target.value.slice(0, maxBio) }))}
          rows={6}
          placeholder="Somos una barbería con más de 10 años de experiencia..."
          className={`${inputCls} resize-none`}
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Si está vacío, la sección no aparece.</p>
          <span className="text-xs" style={{ color: (maxBio - settings.bio.length) < 80 ? '#C9A84C' : 'rgba(255,255,255,0.3)' }}>
            {maxBio - settings.bio.length} restantes
          </span>
        </div>
      </div>

      {(settings.description || settings.bio) && (
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>Vista previa</p>
          {settings.description && (
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Subtítulo:</p>
              <p className="text-white text-sm italic">"{settings.description}"</p>
            </div>
          )}
          {settings.bio && (
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Sobre Nosotros:</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.7)' }}>{settings.bio}</p>
            </div>
          )}
        </div>
      )}

      <SaveButton onSave={onSave} saving={saving} label="Guardar contenido" />
    </div>
  );
}

function GalleryTab({ settings, fileInputRef, uploadingPhoto, onUpload, onDelete }: {
  settings: BarbershopSettings;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadingPhoto: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (index: number) => void;
}) {
  const maxPhotos = 40;
  const canUpload = settings.photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-300">Fotos de la galería</p>
          <p className="text-xs text-gray-500 mt-0.5">{settings.photos.length} de {maxPhotos} · Máx. 5MB por foto</p>
        </div>
        {canUpload && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-50"
          >
            {uploadingPhoto
              ? <><span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />Subiendo...</>
              : <>+ Agregar foto</>
            }
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />

      {settings.photos.length === 0 ? (
        <div
          onClick={() => canUpload && fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center cursor-pointer hover:border-yellow-400/50 transition-colors group"
        >
          <div className="text-4xl mb-3">📸</div>
          <p className="text-gray-400 text-sm group-hover:text-white transition-colors">No hay fotos. Haz clic para subir.</p>
          <p className="text-gray-600 text-xs mt-1">JPG, PNG o WebP · máx. 5MB</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {settings.photos.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-800">
              <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => onDelete(index)}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                >
                  🗑️ Eliminar
                </button>
              </div>
              <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">{index + 1}</span>
            </div>
          ))}
          {canUpload && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-700 hover:border-yellow-400/60 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-300 disabled:opacity-50"
            >
              <span className="text-2xl">+</span>
              <span className="text-xs">Agregar</span>
            </button>
          )}
        </div>
      )}
      {!canUpload && <p className="text-xs text-yellow-400/80 text-center">✨ Galería completa</p>}
    </div>
  );
}

function ColorsTab({ settings, setSettings, onSave, saving }: {
  settings: BarbershopSettings;
  setSettings: React.Dispatch<React.SetStateAction<BarbershopSettings>>;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Combinaciones predefinidas</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESET_COLORS.map(preset => {
            const isActive = settings.primaryColor === preset.primary && settings.secondaryColor === preset.secondary;
            return (
              <button
                key={preset.label}
                onClick={() => setSettings(prev => ({ ...prev, primaryColor: preset.primary, secondaryColor: preset.secondary }))}
                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                  isActive ? 'border-yellow-400 bg-gray-800' : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="flex gap-1 shrink-0">
                  <span className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: preset.primary }} />
                  <span className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: preset.secondary }} />
                </div>
                <span className="text-xs text-gray-300 text-left">{preset.label}</span>
                {isActive && <span className="ml-auto text-yellow-400 text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Colores personalizados</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Color primario (fondo hero)</label>
            <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3">
              <input
                type="color" value={settings.primaryColor}
                onChange={e => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-sm font-mono text-gray-300">{settings.primaryColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Color secundario (botones)</label>
            <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3">
              <input
                type="color" value={settings.secondaryColor}
                onChange={e => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-sm font-mono text-gray-300">{settings.secondaryColor}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Vista previa del hero</p>
        <div className="rounded-xl overflow-hidden shadow-lg">
          <div className="py-10 px-6 text-center relative" style={{ backgroundColor: settings.primaryColor }}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative">
              <p className="font-bold text-white text-xl mb-1">{settings.name || 'Tu Barbería'}</p>
              {settings.description && <p className="text-white/80 text-sm mb-4">{settings.description}</p>}
              <span
                className="inline-block text-sm font-bold px-5 py-2 rounded-full"
                style={{ backgroundColor: settings.secondaryColor, color: settings.primaryColor }}
              >
                🗓️ Reservar Cita
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          El color primario es el fondo · El secundario es el botón
        </p>
      </div>

      <SaveButton onSave={onSave} saving={saving} label="Guardar colores" />
    </div>
  );
}

function SaveButton({ onSave, saving, label = 'Guardar cambios' }: {
  onSave: () => void;
  saving: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onSave}
      disabled={saving}
      className="w-full py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2 hover:opacity-90 transition-opacity"
      style={{ backgroundColor: '#C9A84C', color: '#000' }}
    >
      {saving
        ? <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Guardando...</>
        : label
      }
    </button>
  );
}

// ═════════════════════════════════════════════
// TAB: POLÍTICA DE RESERVAS
// ═════════════════════════════════════════════
const GOLD = '#C9A84C';

function BookingPolicyTab({ settings, setSettings, onSave, saving }: {
  settings:    BarbershopSettings;
  setSettings: React.Dispatch<React.SetStateAction<BarbershopSettings>>;
  onSave:      () => void;
  saving:      boolean;
}) {
  const minBook   = settings.minBookingNoticeHours ?? 0;
  const minCancel = settings.minCancelNoticeHours  ?? 0;
  const maxDays   = settings.maxAdvanceBookingDays ?? 0;

  const inputClass = 'w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none bg-[#1a1a1a] border border-[#2a2a2a] focus:border-[#C9A84C] transition-colors';

  const BOOK_OPTIONS   = [0, 1, 2, 3, 4, 6, 8, 12, 24, 48];
  const CANCEL_OPTIONS = [0, 1, 2, 3, 4, 6, 8, 12, 24, 48, 72];
  const MAX_DAYS_OPTIONS = [0, 7, 14, 30, 60, 90, 180];

  function label(h: number, type: 'booking' | 'cancel') {
    if (h === 0) return type === 'booking' ? 'Sin límite (reserva inmediata)' : 'Sin límite (cancelación libre)';
    if (h < 24)  return `${h} hora${h !== 1 ? 's' : ''} de anticipación`;
    const d = h / 24;
    return `${d} día${d !== 1 ? 's' : ''} (${h}h) de anticipación`;
  }

  return (
    <div className="space-y-6 py-4">

      {/* Anticipación mínima para RESERVAR */}
      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
          <h3 className="text-sm font-semibold text-white">Anticipación mínima para reservar</h3>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Cuánto tiempo antes de la cita puede un cliente hacer una reserva. Con 0 puede reservar para el mismo momento.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BOOK_OPTIONS.map(h => (
            <button key={h} onClick={() => setSettings(s => ({ ...s, minBookingNoticeHours: h }))}
              className="px-3 py-2.5 rounded-xl text-xs font-medium transition text-left"
              style={minBook === h
                ? { backgroundColor: GOLD, color: '#000' }
                : { backgroundColor: '#1a1a1a', color: 'rgba(255,255,255,0.55)', border: '1px solid #2a2a2a' }}>
              {h === 0 ? 'Sin límite' : h < 24 ? `${h}h` : `${h/24}d`}
            </button>
          ))}
        </div>

        <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: `${GOLD}12`, border: `1px solid ${GOLD}30` }}>
          <span style={{ color: GOLD }}>Configuración actual: </span>
          <span className="text-white font-medium">{label(minBook, 'booking')}</span>
        </div>

        {/* Input manual */}
        <div>
          <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
            O ingresa un valor personalizado (en horas)
          </label>
          <input type="number" min={0} max={168} value={minBook}
            onChange={e => setSettings(s => ({ ...s, minBookingNoticeHours: Math.max(0, parseInt(e.target.value) || 0) }))}
            className={inputClass} placeholder="0" />
        </div>
      </div>

      {/* Anticipación mínima para CANCELAR */}
      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
          <h3 className="text-sm font-semibold text-white">Anticipación mínima para cancelar</h3>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Cuánto tiempo antes de la cita puede el cliente cancelar. Con 0 puede cancelar hasta el último momento.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CANCEL_OPTIONS.map(h => (
            <button key={h} onClick={() => setSettings(s => ({ ...s, minCancelNoticeHours: h }))}
              className="px-3 py-2.5 rounded-xl text-xs font-medium transition text-left"
              style={minCancel === h
                ? { backgroundColor: GOLD, color: '#000' }
                : { backgroundColor: '#1a1a1a', color: 'rgba(255,255,255,0.55)', border: '1px solid #2a2a2a' }}>
              {h === 0 ? 'Sin límite' : h < 24 ? `${h}h` : `${h/24}d`}
            </button>
          ))}
        </div>

        <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: `${GOLD}12`, border: `1px solid ${GOLD}30` }}>
          <span style={{ color: GOLD }}>Configuración actual: </span>
          <span className="text-white font-medium">{label(minCancel, 'cancel')}</span>
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
            O ingresa un valor personalizado (en horas)
          </label>
          <input type="number" min={0} max={168} value={minCancel}
            onChange={e => setSettings(s => ({ ...s, minCancelNoticeHours: Math.max(0, parseInt(e.target.value) || 0) }))}
            className={inputClass} placeholder="0" />
        </div>
      </div>

      {/* Anticipación máxima para RESERVAR */}
      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
          <h3 className="text-sm font-semibold text-white">Máximo días en el futuro para reservar</h3>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Qué tan lejos en el tiempo puede un cliente reservar una cita.
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {MAX_DAYS_OPTIONS.map(d => (
            <button key={d} onClick={() => setSettings(s => ({ ...s, maxAdvanceBookingDays: d }))}
              className="px-3 py-2.5 rounded-xl text-xs font-medium transition"
              style={maxDays === d
                ? { backgroundColor: GOLD, color: '#000' }
                : { backgroundColor: '#1a1a1a', color: 'rgba(255,255,255,0.55)', border: '1px solid #2a2a2a' }}>
              {d === 0 ? 'Sin límite' : d < 30 ? `${d}d` : d === 30 ? '1 mes' : d === 60 ? '2 meses' : d === 90 ? '3 meses' : '6 meses'}
            </button>
          ))}
        </div>

        <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: `${GOLD}12`, border: `1px solid ${GOLD}30` }}>
          <span style={{ color: GOLD }}>Configuración actual: </span>
          <span className="text-white font-medium">
            {maxDays === 0 ? 'Sin límite (cliente puede reservar a cualquier fecha futura)' : `Hasta ${maxDays} día${maxDays !== 1 ? 's' : ''} en el futuro`}
          </span>
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
            O ingresa un valor personalizado (en días, 0 = sin límite)
          </label>
          <input type="number" min={0} max={365} value={maxDays}
            onChange={e => setSettings(s => ({ ...s, maxAdvanceBookingDays: Math.max(0, parseInt(e.target.value) || 0) }))}
            className={inputClass} placeholder="0" />
          {maxDays > 0 && maxDays < 7 && (
            <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>
              ⚠️ Con {maxDays} día{maxDays !== 1 ? 's' : ''} los clientes solo podrán reservar para {maxDays === 1 ? 'hoy o mañana' : `los próximos ${maxDays} días`}. Usa 0 para sin límite.
            </p>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
          <h3 className="text-sm font-semibold text-white">Resumen de política</h3>
        </div>
        {[
          { icon: '📅', text: minBook === 0 ? 'Clientes pueden reservar hasta el mismo momento' : `Reservas con mín. ${minBook < 24 ? minBook + 'h' : (minBook/24) + 'd'} de anticipación` },
          { icon: '❌', text: minCancel === 0 ? 'Clientes pueden cancelar hasta el último momento' : `Cancelaciones con mín. ${minCancel < 24 ? minCancel + 'h' : (minCancel/24) + 'd'} de anticipación` },
          { icon: '🗓️', text: maxDays === 0 ? 'Sin límite de anticipación máxima para reservar' : `Reservas disponibles hasta ${maxDays} día${maxDays !== 1 ? 's' : ''} en el futuro` },
        ].map(r => (
          <div key={r.text} className="flex items-start gap-2.5 text-sm">
            <span>{r.icon}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{r.text}</span>
          </div>
        ))}
      </div>

      <button onClick={onSave} disabled={saving}
        className="w-full py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2"
        style={{ backgroundColor: GOLD, color: '#000' }}>
        {saving
          ? <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Guardando...</>
          : 'Guardar política de reservas'
        }
      </button>
    </div>
  );
}