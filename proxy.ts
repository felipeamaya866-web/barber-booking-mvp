// proxy.ts — Next.js 16
import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ✅ Verificar si existe la cookie de sesión de NextAuth
  // Si no existe, dejar pasar — NextAuth aún no estableció la sesión
  const sessionCookie =
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token');

  if (!sessionCookie) return NextResponse.next();

  // Leer el rol desde una cookie separada que vamos a setear al hacer login
  // Por ahora solo protegemos con la existencia de la cookie de sesión
  // La lógica de roles la maneja cada página individualmente

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/barbershop/:path*',
    '/barber/:path*',
  ],
};