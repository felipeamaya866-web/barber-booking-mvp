// lib/auth.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    // ✅ Incluir id y role en el token JWT
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id   = user.id;
        token.role = user.role;
      }
      // Refrescar role en cada request (por si cambió)
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.id },
          select: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }
      return token;
    },
    // ✅ Exponer id y role en la sesión del cliente
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id   = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};