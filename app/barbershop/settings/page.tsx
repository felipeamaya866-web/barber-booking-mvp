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
}

type Tab = 'info' | 'bio' | 'gallery' | 'colors';

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

// ─────────────────────────────────────────────
// COMPONENT PRINCIPAL
// ─────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef    = useRef<HTMLInputElement>(null); // galería
  const logoInputRef    = useRef<HTMLInputElement>(null); // logo

  const [activeTab, setActiveTab]         = useState<Tab>('info');
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMsg, setSuccessMsg]       = useState('');
  const [errorMsg, setErrorMsg]           = useState('');

  const [settings, setSettings] = useState<BarbershopSettings>({
    id: '', name: '', slug: '', description: '', bio: '',
    address: '', phone: '',
    primaryColor: DEFAULT_COLORS.primaryColor,
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldsToSave),
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

  // ── Subir logo ─────────────────────────────
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrorMsg('Solo se permiten imágenes'); return; }
    if (file.size > 2 * 1024 * 1024)    { setErrorMsg('El logo no puede superar 2MB'); return; }

    try {
      setUploadingLogo(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');
      const res = await fetch('/api/barbershop/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir logo');
      setSettings(prev => ({ ...prev, logoUrl: data.url }));
      await handleSave({ logoUrl: data.url });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al subir el logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  // ── Subir fotos galería ────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrorMsg('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024)    { setErrorMsg('La imagen no puede superar 5MB'); return; }
    if (settings.photos.length >= 6)     { setErrorMsg('Máximo 6 fotos permitidas'); return; }

    try {
      setUploadingPhoto(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'gallery');
      const res = await fetch('/api/barbershop/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir foto');
      const updatedPhotos = [...settings.photos, data.url];
      setSettings(prev => ({ ...prev, photos: updatedPhotos }));
      await handleSave({ photos: updatedPhotos });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeletePhoto(indexToDelete: number) {
    const updatedPhotos = settings.photos.filter((_, i) => i !== indexToDelete);
    setSettings(prev => ({ ...prev, photos: updatedPhotos }));
    await handleSave({ photos: updatedPhotos });
  }

  // ── Loading ────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'info',    label: 'Información', icon: '🏪' },
    { id: 'bio',     label: 'Contenido',   icon: '📝' },
    { id: 'gallery', label: 'Galería',     icon: '📸' },
    { id: 'colors',  label: 'Colores',     icon: '🎨' },
  ];

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/barbershop" className="text-gray-400 hover:text-white transition-colors p-1 rounded">←</Link>
          <div>
            <h1 className="text-lg font-bold text-white">⚙️ Configuración</h1>
            <p className="text-xs text-gray-400">{settings.name || 'Mi Barbería'}</p>
          </div>
          <div className="ml-auto">
            <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">Plan {settings.plan}</span>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {successMsg && (
          <div className="bg-green-900/40 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm mb-4">
            ✅ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
            ❌ {errorMsg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-max flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-yellow-400 text-gray-900' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB INFO ── */}
        {activeTab === 'info' && (
          <InfoTab
            settings={settings}
            setSettings={setSettings}
            logoInputRef={logoInputRef}
            uploadingLogo={uploadingLogo}
            onLogoUpload={handleLogoUpload}
            onSave={() => handleSave({ name: settings.name, address: settings.address, phone: settings.phone })}
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

        <div className="h-10" />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════
// SUB-COMPONENTES
// ═════════════════════════════════════════════

// ── INFO TAB (con logo) ───────────────────────
function InfoTab({
  settings, setSettings, logoInputRef, uploadingLogo, onLogoUpload, onSave, saving,
}: {
  settings: BarbershopSettings;
  setSettings: React.Dispatch<React.SetStateAction<BarbershopSettings>>;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  uploadingLogo: boolean;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-5">

      {/* ── LOGO ── */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Logo de la barbería</label>
        <div className="flex items-center gap-4">
          {/* Preview del logo */}
          <div
            className="w-20 h-20 rounded-full border-2 border-gray-700 overflow-hidden flex items-center justify-center bg-gray-800 flex-shrink-0 cursor-pointer hover:border-yellow-400 transition-colors"
            onClick={() => logoInputRef.current?.click()}
          >
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-2xl">💈</div>
                <p className="text-gray-500 text-xs mt-1">Sin logo</p>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {uploadingLogo ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Subiendo...</>
              ) : (
                <>📤 {settings.logoUrl ? 'Cambiar logo' : 'Subir logo'}</>
              )}
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
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onLogoUpload}
        />
      </div>

      <div className="border-t border-gray-800" />

      {/* ── Nombre ── */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre de la barbería</label>
        <input
          type="text"
          value={settings.name}
          onChange={e => setSettings(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ej: Barbería El Clasico"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Dirección</label>
        <input
          type="text"
          value={settings.address}
          onChange={e => setSettings(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Ej: Calle 10 # 5-20, Bogotá"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Teléfono / WhatsApp</label>
        <input
          type="tel"
          value={settings.phone}
          onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="Ej: +57 300 000 0000"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">URL de tu landing page</label>
        <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <span className="text-gray-500 pl-4 pr-1 text-sm whitespace-nowrap">barberbooking.com/b/</span>
          <span className="text-yellow-400 font-mono text-sm py-3 pr-4">{settings.slug}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">El slug no se puede cambiar después del setup.</p>
      </div>

      <SaveButton onSave={onSave} saving={saving} />
    </div>
  );
}

// ── BIO TAB ───────────────────────────────────
function BioTab({ settings, setSettings, onSave, saving }: {
  settings: BarbershopSettings;
  setSettings: React.Dispatch<React.SetStateAction<BarbershopSettings>>;
  onSave: () => void;
  saving: boolean;
}) {
  const maxDesc = 120;
  const maxBio  = 600;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Subtítulo del hero</label>
        <p className="text-xs text-gray-500 mb-2">Aparece debajo del nombre en la parte superior. Ej: <span className="italic">"la mejor"</span></p>
        <input
          type="text"
          value={settings.description}
          onChange={e => setSettings(prev => ({ ...prev, description: e.target.value.slice(0, maxDesc) }))}
          placeholder="Ej: La barbería más elegante de la ciudad"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-gray-500">{maxDesc - settings.description.length} restantes</span>
        </div>
      </div>

      <div className="border-t border-gray-800" />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Sobre Nosotros</label>
        <p className="text-xs text-gray-500 mb-2">Sección completa debajo del hero. Si está vacío, no aparece en la landing.</p>
        <textarea
          value={settings.bio}
          onChange={e => setSettings(prev => ({ ...prev, bio: e.target.value.slice(0, maxBio) }))}
          rows={6}
          placeholder="Somos una barbería con más de 10 años de experiencia..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">Si está vacío, la sección no aparece.</p>
          <span className={`text-xs ${(maxBio - settings.bio.length) < 80 ? 'text-yellow-400' : 'text-gray-500'}`}>
            {maxBio - settings.bio.length} restantes
          </span>
        </div>
      </div>

      {(settings.description || settings.bio) && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Vista previa</p>
          {settings.description && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Subtítulo:</p>
              <p className="text-white text-sm italic">"{settings.description}"</p>
            </div>
          )}
          {settings.bio && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Sobre Nosotros:</p>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{settings.bio}</p>
            </div>
          )}
        </div>
      )}

      <SaveButton onSave={onSave} saving={saving} label="Guardar contenido" />
    </div>
  );
}

// ── GALLERY TAB ───────────────────────────────
function GalleryTab({ settings, fileInputRef, uploadingPhoto, onUpload, onDelete }: {
  settings: BarbershopSettings;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadingPhoto: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (index: number) => void;
}) {
  const maxPhotos = 6;
  const canUpload = settings.photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-300">Fotos de la galería</p>
          <p className="text-xs text-gray-500 mt-0.5">{settings.photos.length} de {maxPhotos} · Máx. 5MB</p>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => onDelete(index)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium">
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
      {!canUpload && <p className="text-xs text-yellow-400/80 text-center">✨ Galería completa — 6/6 fotos</p>}
    </div>
  );
}

// ── COLORS TAB ────────────────────────────────
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
              <input type="color" value={settings.primaryColor} onChange={e => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-sm font-mono text-gray-300">{settings.primaryColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Color secundario (botones)</label>
            <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3">
              <input type="color" value={settings.secondaryColor} onChange={e => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-sm font-mono text-gray-300">{settings.secondaryColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview realista */}
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

// ── BOTÓN GUARDAR ─────────────────────────────
function SaveButton({ onSave, saving, label = 'Guardar cambios' }: {
  onSave: () => void;
  saving: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onSave}
      disabled={saving}
      className="w-full bg-yellow-400 text-gray-900 py-3.5 rounded-xl font-bold text-sm hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
    >
      {saving
        ? <><span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />Guardando...</>
        : label
      }
    </button>
  );
}