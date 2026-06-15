// lib/plans.ts — configuración de planes compartida entre frontend y backend

import crypto from 'crypto';

export const PLAN_CONFIG = {
  LITE:  { nombre: 'Lite',  precio: 2990000, maxBarbers: 1,   maxPhotos: 10 },
  PRIME: { nombre: 'Prime', precio: 4990000, maxBarbers: 3,   maxPhotos: 20 },
  ELITE: { nombre: 'Elite', precio: 7990000, maxBarbers: 999, maxPhotos: 40 },
} as const;

export type PlanKey = keyof typeof PLAN_CONFIG;

export const WOMPI_BASE = process.env.WOMPI_ENV === 'prod'
  ? 'https://production.wompi.co/v1'
  : 'https://sandbox.wompi.co/v1';

export function generarFirma(reference: string, monto: number, moneda: string): string {
  const secret = process.env.WOMPI_INTEGRITY_KEY!;
  const cadena = `${reference}${monto}${moneda}${secret}`;
  return crypto.createHash('sha256').update(cadena).digest('hex');
}
