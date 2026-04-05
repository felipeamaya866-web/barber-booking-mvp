// proxy.ts — Next.js 16
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Sin sesión → dejar pasar (las páginas manejan su propio auth)
  if (!token) return NextResponse.next();

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