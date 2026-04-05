// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
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

  // ── Rutas del dueño (/barbershop/*)
  // Los barberos no pueden entrar al panel del dueño
  if (pathname.startsWith('/barbershop') && role === 'BARBER') {
    return NextResponse.redirect(new URL('/barber/dashboard', req.url));
  }

  // ── Rutas del barbero (/barber/*)
  // Solo BARBER puede entrar
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