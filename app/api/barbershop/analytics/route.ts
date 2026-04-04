// app/api/barbershop/analytics/route.ts
// GET - Obtener estadísticas de la barbería

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
        barbershop: {
          include: {
            services: true,
            reviews: true,
            subscription: true,
          },
        },
      },
    });

    if (!user || !user.barbershop) {
      return NextResponse.json(
        { error: 'No tienes una barbería' },
        { status: 404 }
      );
    }

    const barbershop = user.barbershop;

    // Calcular estadísticas
    const totalViews = barbershop.viewCount;
    const totalServices = barbershop.services.length;
    const totalReviews = barbershop.reviews.length;
    
    // Calcular rating promedio
    const avgRating = barbershop.reviews.length > 0
      ? barbershop.reviews.reduce((acc, review) => acc + review.rating, 0) / barbershop.reviews.length
      : 0;

    // Servicios ordenados por precio (top 3)
    const topServices = barbershop.services
      .sort((a, b) => b.price - a.price)
      .slice(0, 3)
      .map(service => ({
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration,
      }));

    // Información del plan
    const planInfo = barbershop.subscription ? {
      plan: barbershop.subscription.plan,
      status: barbershop.subscription.status,
      maxPhotos: barbershop.subscription.maxPhotos,
      maxBarbers: barbershop.subscription.maxBarbers,
      currentPhotos: barbershop.photos.length,
      trialEndsAt: barbershop.subscription.trialEndsAt,
    } : null;

    // Reviews recientes (últimas 5)
    const recentReviews = barbershop.reviews
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      }));

    const analytics = {
      overview: {
        totalViews,
        totalServices,
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
      },
      topServices,
      planInfo,
      recentReviews,
      barbershopInfo: {
        slug: barbershop.slug,
        colors: barbershop.colors,
        theme: barbershop.theme,
        photosCount: barbershop.photos.length,
      },
    };

    console.log('📊 Analytics generados para:', barbershop.name);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('❌ Error al obtener analytics:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}