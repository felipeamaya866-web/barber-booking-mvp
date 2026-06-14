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
}

function SearchResults() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initialQ     = searchParams.get('q') ?? '';

  const [query,   setQuery]   = useState(initialQ);
  const [input,   setInput]   = useState(initialQ);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(false);
    fetch(`/api/public/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => { setResults(data.results ?? []); setSearched(true); })
      .catch(() => { setResults([]); setSearched(true); })
      .finally(() => setLoading(false));
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    router.replace(`/buscar?q=${encodeURIComponent(q)}`);
    setQuery(q);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors p-1 rounded text-lg">←</Link>
          <div>
            <h1 className="text-lg font-bold text-white">Buscar barbería</h1>
            {searched && (
              <p className="text-xs text-gray-400">
                {results.length > 0
                  ? `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}"`
                  : `Sin resultados para "${query}"`}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Buscador */}
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

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Sin resultados */}
        {!loading && searched && results.length === 0 && (
          <div className="text-center py-14">
            <div className="text-5xl mb-4">✂️</div>
            <p className="text-white font-semibold text-lg mb-1">No encontramos ninguna barbería</p>
            <p className="text-gray-400 text-sm">Intenta con otro nombre o revisa la ortografía.</p>
          </div>
        )}

        {/* Resultados */}
        {!loading && results.length > 0 && (
          <div className="space-y-3">
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
                  {r.serviceCount > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">✂️ {r.serviceCount} servicio{r.serviceCount !== 1 ? 's' : ''}</p>
                  )}
                </div>

                <span className="text-gray-500 group-hover:text-yellow-400 transition-colors text-lg">→</span>
              </Link>
            ))}
          </div>
        )}

        {/* Estado inicial */}
        {!loading && !searched && !query && (
          <div className="text-center py-14">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400 text-sm">Escribe al menos 2 caracteres para buscar.</p>
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
