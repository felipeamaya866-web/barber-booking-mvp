// app/api/barbershop/upload/route.ts
// POST: Subir imagen a Supabase Storage

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'photo' o 'logo'

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo no debe superar 5MB' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Solo se permiten imágenes JPG, PNG o WebP' },
        { status: 400 }
      );
    }

    // Convertir a base64 para enviar a Supabase
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Generar nombre único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const fileName = `${session.user.email}-${type}-${timestamp}-${randomStr}.${extension}`;

    // Aquí usarías Supabase Storage
    // Por ahora, simulamos que guardamos en Supabase
    // En producción, necesitarás configurar Supabase Storage

    // URL simulada (reemplazar con URL real de Supabase)
    const imageUrl = `https://placeholder-supabase-url.com/${fileName}`;

    console.log('📸 Imagen subida:', { fileName, size: file.size, type });

    // TODO: Implementar subida real a Supabase Storage
    // const { data, error } = await supabase.storage
    //   .from('barbershop-images')
    //   .upload(fileName, buffer, {
    //     contentType: file.type,
    //     upsert: false
    //   });

    return NextResponse.json({
      success: true,
      url: imageUrl,
      fileName,
    });
  } catch (error) {
    console.error('❌ Error al subir imagen:', error);
    return NextResponse.json(
      { error: 'Error al subir imagen' },
      { status: 500 }
    );
  }
}