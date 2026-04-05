// proxy.ts — Next.js 16 (antes middleware.ts)
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Obtener token JWT
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Si no hay sesión → redirigir al login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (token as { role?: string }).role;

  // Barberos no pueden entrar al panel del dueño
  if (pathname.startsWith('/barbershop') && role === 'BARBER') {
    return NextResponse.redirect(new URL('/barber/dashboard', req.url));
  }

  // Solo BARBER puede entrar al panel de barbero
  if (pathname.startsWith('/barber') && role !== 'BARBER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/barbershop', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/barbershop/:path*',
    '/barber/:path*',
  ],
};