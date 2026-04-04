import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Buscar el usuario con su barbería
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        barbershop: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Si no tiene barbería, retorna null
    if (!user.barbershop) {
      return NextResponse.json({ barbershop: null });
    }

    return NextResponse.json({
      barbershop: user.barbershop,
    });
  } catch (error) {
    console.error('Error al obtener barbería:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
