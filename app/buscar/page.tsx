'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Result {
  name: string;
  slug: string;
  description: string;
  address: string;
  logoUrl: string;
  primaryColor: string;
  serviceCount: number;
  distanceKm?: number;
}

type SearchMode = 'text' | 'nearby';

function SearchResults() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initialQ     = searchParams.get('q') ?? '';

  const [input,      setInput]      = useState(initialQ);
  const [query,      setQuery]      = useState(initialQ);
  const [mode,       setMode]       = useState<SearchMode>('text');
  const [results,    setResults]    = useState<Result[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [searched,   setSearched]   = useState(false);
  const [geoError,   setGeoError]   = useState('');

  // Búsqueda por texto
  useEffect(() => {
    if (mode !== 'text') return;
    if (!query || query.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(false);
    fetch(`/api/public/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => { setResults(data.results ?? []); setSearched(true); })
      .catch(() => { setResults([]); setSearched(true); })
      .finally(() => setLoading(false));
  }, [query, mode]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setMode('text');
    setGeoError('');
    router.replace(`/buscar?q=${encodeURIComponent(q)}`);
    setQuery(q);
  }

  function handleNearby() {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setMode('nearby');
        setInput('');
        setSearched(false);
        setLoading(true);
        try {
          const res  = await fetch(`/api/public/search/nearby?lat=${lat}&lng=${lng}&radius=15`);
          const data = await res.json();
          setResults(data.results ?? []);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
          setSearched(true);
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) setGeoError('Permiso de ubicación denegado.');
        else setGeoError('No se pudo obtener tu ubicación.');
      },
      { timeout: 8000 }
    );
  }

  const nearbyCount = mode === 'nearby' && searched ? results.length : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors p-1 rounded text-lg">←</Link>
          <div>
            <h1 className="text-lg font-bold text-white">Buscar barbería</h1>
            {searched && mode === 'text' && (
              <p className="text-xs text-gray-400">
                {results.length > 0
                  ? `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}"`
                  : `Sin resultados para "${query}"`}
              </p>
            )}
            {searched && mode === 'nearby' && (
              <p className="text-xs text-gray-400">
                {nearbyCount! > 0
                  ? `${nearbyCount} barbería${nearbyCount !== 1 ? 's' : ''} activa${nearbyCount !== 1 ? 's' : ''} cerca de ti`
                  : 'No hay barberías activas cerca de ti'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Buscador por texto */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Nombre o slug de la barbería..."
            autoFocus
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="bg-yellow-400 text-gray-900 px-5 py-3 rounded-xl font-bold text-sm hover:bg-yellow-300 transition-colors"
          >
            Buscar
          </button>
        </form>

        {/* Botón ubicación */}
        <button
          onClick={handleNearby}
          disabled={geoLoading}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
            mode === 'nearby' && searched
              ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400'
              : 'border-gray-700 text-gray-400 hover:border-yellow-400/50 hover:text-white'
          } disabled:opacity-50`}
        >
          {geoLoading ? (
            <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Obteniendo ubicación...</>
          ) : (
            <>📍 Barberías cerca de mí <span className="text-xs text-gray-500 ml-1">(radio 15 km · solo suscritas)</span></>
          )}
        </button>

        {geoError && (
          <p className="text-red-400 text-sm text-center">{geoError}</p>
        )}

        {/* Loading resultados */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Sin resultados */}
        {!loading && searched && results.length === 0 && (
          <div className="text-center py-14">
            <div className="text-5xl mb-4">{mode === 'nearby' ? '📍' : '✂️'}</div>
            <p className="text-white font-semibold text-lg mb-1">
              {mode === 'nearby'
                ? 'No hay barberías suscritas cerca de ti'
                : 'No encontramos ninguna barbería'}
            </p>
            <p className="text-gray-400 text-sm">
              {mode === 'nearby'
                ? 'Prueba ampliar el radio o busca por nombre.'
                : 'Intenta con otro nombre o revisa la ortografía.'}
            </p>
          </div>
        )}

        {/* Resultados */}
        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {mode === 'nearby' && (
              <p className="text-xs text-gray-500 uppercase tracking-wide">Ordenadas por distancia</p>
            )}
            {results.map(r => (
              <Link
                key={r.slug}
                href={`/b/${r.slug}`}
                className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-yellow-400/50 rounded-xl p-4 transition-all group"
              >
                {/* Logo / avatar */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-gray-700 group-hover:border-yellow-400/40 transition-colors"
                  style={{ backgroundColor: r.primaryColor }}
                >
                  {r.logoUrl ? (
                    <img src={r.logoUrl} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">💈</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white group-hover:text-yellow-400 transition-colors truncate">{r.name}</p>
                  {r.description && (
                    <p className="text-sm text-gray-400 truncate">{r.description}</p>
                  )}
                  {r.address && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">📍 {r.address}</p>
                  )}
                  <div className="flex items-center gap-3 mt-0.5">
                    {r.serviceCount > 0 && (
                      <p className="text-xs text-gray-500">✂️ {r.serviceCount} servicio{r.serviceCount !== 1 ? 's' : ''}</p>
                    )}
                    {r.distanceKm !== undefined && (
                      <p className="text-xs text-yellow-400/80 font-medium">
                        {r.distanceKm < 1
                          ? `${Math.round(r.distanceKm * 1000)} m`
                          : `${r.distanceKm.toFixed(1)} km`}
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-gray-500 group-hover:text-yellow-400 transition-colors text-lg">→</span>
              </Link>
            ))}
          </div>
        )}

        {/* Estado inicial */}
        {!loading && !searched && (
          <div className="text-center py-14">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400 text-sm">Escribe un nombre o usa tu ubicación.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
