// app/barbershop/setup/StepGallery.tsx
'use client';

import { useState } from 'react';

interface Props {
  data: { photos: string[] };
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepGallery({ data, onUpdate, onNext, onBack }: Props) {
  const [photos, setPhotos]     = useState<string[]>(data.photos);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const minPhotos = 3;
  const maxPhotos = 40;

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    const remaining = maxPhotos - photos.length;
    if (fileArray.length > remaining) { alert(`Solo puedes subir ${remaining} fotos más`); return; }

    setUploading(true);
    try {
      const uploaded = await Promise.all(fileArray.map(async file => {
        if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} supera los 5MB`);
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} no es una imagen`);
        const randomId = Math.random().toString(36).substring(7);
        await new Promise(r => setTimeout(r, 500));
        return `https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop&sig=${randomId}`;
      }));
      setPhotos([...photos, ...uploaded]);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al subir fotos');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const removePhoto = (index: number) => setPhotos(photos.filter((_, i) => i !== index));

  const handleNext = () => {
    if (photos.length < minPhotos) { alert(`Debes subir al menos ${minPhotos} fotos`); return; }
    onUpdate({ photos });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">📸 Galería de Fotos</h2>
        <p className="text-gray-400">Muestra tu trabajo con fotos de calidad (mínimo {minPhotos}, máximo {maxPhotos})</p>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-xl">
        <div>
          <p className="text-sm text-gray-400">Fotos subidas</p>
          <p className="text-2xl font-bold text-white">{photos.length} / {maxPhotos}</p>
        </div>
        {photos.length >= minPhotos && (
          <div className="bg-green-900/40 text-green-400 border border-green-800 px-3 py-1 rounded-full text-sm font-medium">
            ✓ Mínimo alcanzado
          </div>
        )}
      </div>

      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <>
          <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
              dragActive ? 'border-yellow-400 bg-yellow-400/5' : 'border-gray-700 hover:border-gray-600'
            }`}>
            <input type="file" multiple accept="image/*" onChange={e => handleFileSelect(e.target.files)}
              className="hidden" id="photo-upload" disabled={uploading} />
            <label htmlFor="photo-upload" className="cursor-pointer">
              <svg className="mx-auto h-12 w-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-300 mb-1">{uploading ? 'Subiendo...' : 'Click para subir o arrastra las fotos'}</p>
              <p className="text-xs text-gray-500">PNG, JPG, WebP hasta 5MB por foto</p>
            </label>
          </div>

          {photos.length === 0 && (
            <button onClick={() => setPhotos([
              'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop',
              'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop',
              'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=400&fit=crop',
            ])}
              className="w-full py-3 px-4 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition">
              ✨ Usar fotos de ejemplo (para testing)
            </button>
          )}
        </>
      )}

      {/* Gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group aspect-square bg-gray-800 rounded-lg overflow-hidden">
              <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center">
                <button onClick={() => removePhoto(index)}
                  className="opacity-0 group-hover:opacity-100 bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition">
                  Eliminar
                </button>
              </div>
              <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">{index + 1}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-4">
        <h3 className="font-semibold text-yellow-300 mb-2">📷 Tips para fotos perfectas:</h3>
        <ul className="text-sm text-yellow-200/70 space-y-1 list-disc list-inside">
          <li>Usa buena iluminación natural o artificial</li>
          <li>Muestra cortes recientes y de diferentes estilos</li>
          <li>Incluye fotos del local y ambiente</li>
          <li>Evita fotos borrosas o de baja calidad</li>
        </ul>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg font-medium hover:bg-gray-700 border border-gray-700 transition">
          ← Atrás
        </button>
        <button onClick={handleNext} disabled={photos.length < minPhotos || uploading}
          className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg font-bold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition">
          {uploading ? 'Subiendo...' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}