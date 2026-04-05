 // app/barbershop/create/page.tsx
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
    if (status === 'authenticated') checkExistingBarbershop();
  }, [status]);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) console.error('Error de autenticación:', error);
  }, [searchParams]);

  const checkExistingBarbershop = async () => {
    try {
      const res  = await fetch('/api/barbershop');
      const data = await res.json();
      if (data.barbershop) router.push('/barbershop');
    } catch (error) {
      console.error('Error verificando barbería:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4" />
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Bienvenido a BarberBooking</h1>
            <p className="text-gray-400">Inicia sesión para crear tu barbería y comenzar a recibir clientes</p>
          </div>
          <SignInButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-xl flex items-center justify-center text-lg">✂️</div>
          <span style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 700, color: '#F5F0E8' }}>
            Barber<span style={{ color: '#C9A84C' }}>Booking</span>
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Crea tu Barbería</h1>
            <p className="text-gray-400">Completa la información para comenzar a gestionar tu negocio</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400" />
      </div>
    }>
      <CreateBarbershopContent />
    </Suspense>
  );
}