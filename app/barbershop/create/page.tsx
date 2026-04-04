// app/barbershop/create/page.tsx
// Página para crear una nueva barbería

'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import Form from './Form';
import SignInButton from './SignInButton';

function CreateBarbershopContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Si está autenticado, verificar si ya tiene barbería
    if (status === 'authenticated') {
      checkExistingBarbershop();
    }
  }, [status]);

  // Si viene del callback de Google, no hacer nada especial
  // NextAuth ya manejó la autenticación
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      console.error('Error de autenticación:', error);
    }
  }, [searchParams]);

  const checkExistingBarbershop = async () => {
    try {
      const res = await fetch('/api/barbershop');
      const data = await res.json();

      // Si ya tiene barbería, redirigir al dashboard
      if (data.barbershop) {
        router.push('/barbershop');
      }
    } catch (error) {
      console.error('Error verificando barbería:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenido a Barber Booking
            </h1>
            <p className="text-gray-600">
              Inicia sesión para crear tu barbería y comenzar a recibir clientes
            </p>
          </div>
          <SignInButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Crea tu Barbería
            </h1>
            <p className="text-gray-600">
              Completa la información para comenzar a gestionar tu negocio
            </p>
          </div>
          <Form />
        </div>
      </div>
    </div>
  );
}

export default function CreateBarbershopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <CreateBarbershopContent />
    </Suspense>
  );
}