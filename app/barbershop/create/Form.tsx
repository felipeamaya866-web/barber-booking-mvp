// app/barbershop/create/Form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Form() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', description: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/barbershop/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear barbería');
      router.push('/barbershop/setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>Nombre de la Barbería *</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange}
          required className={inputClass} placeholder="Ej: Barbería El Estilo" />
      </div>

      <div>
        <label htmlFor="address" className={labelClass}>Dirección *</label>
        <input type="text" id="address" name="address" value={formData.address} onChange={handleChange}
          required className={inputClass} placeholder="Calle 123 #45-67, Bogotá" />
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>Teléfono *</label>
        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange}
          required className={inputClass} placeholder="+57 300 123 4567" />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Descripción (Opcional)</label>
        <textarea id="description" name="description" value={formData.description} onChange={handleChange}
          rows={4} className={inputClass + " resize-none"} placeholder="Cuéntanos sobre tu barbería..." />
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-yellow-400 text-gray-900 py-3 px-4 rounded-lg font-bold hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {loading ? (
          <><span className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />Creando...</>
        ) : 'Crear Barbería'}
      </button>
    </form>
  );
}