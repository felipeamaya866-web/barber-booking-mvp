// app/api/payments/acceptance-tokens/route.ts
// GET — Obtiene los tokens de aceptación frescos de Wompi (expiran en ~30 min)
// El frontend los necesita para el formulario de registro de tarjeta

import { NextResponse } from 'next/server';
import { WOMPI_BASE } from '@/lib/plans';

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!;
    const res = await fetch(`${WOMPI_BASE}/merchants/${publicKey}`);

    if (!res.ok) {
      console.error('[ACCEPTANCE-TOKENS] Error Wompi:', res.status);
      return NextResponse.json({ error: 'No se pudo conectar con Wompi' }, { status: 502 });
    }

    const data = await res.json();

    return NextResponse.json({
      acceptanceToken:  data.data.presigned_acceptance.acceptance_token,
      acceptPersonalAuth: data.data.presigned_personal_data_auth.acceptance_token,
      termsUrl:         data.data.presigned_acceptance.permalink,
      personalDataUrl:  data.data.presigned_personal_data_auth.permalink,
    });
  } catch (error) {
    console.error('[ACCEPTANCE-TOKENS]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
