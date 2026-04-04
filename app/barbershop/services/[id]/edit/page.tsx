// app/barbershop/services/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ServiceForm from '../../ServiceForm';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
}

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadService();
    }
  }, [status, router]);

  const loadService = async () => {
    try {
      setLoading(true);
      // Cargar todos los servicios y filtrar el que necesitamos
      const res = await fetch('/api/services');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar servicio');
      }

      const foundService = data.services.find((s: Service) => s.id === params.id);
      
      if (!foundService) {
        throw new Error('Servicio no encontrado');
      }

      setService(foundService);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error || 'Servicio no encontrado'}</p>
          <button
            onClick={() => router.push('/barbershop/services')}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Volver a Servicios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/barbershop/services')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Servicios
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Editar Servicio
          </h1>
          <p className="text-gray-600">
            Actualiza la información del servicio
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <ServiceForm service={service} />
        </div>
      </div>
    </div>
  );
}