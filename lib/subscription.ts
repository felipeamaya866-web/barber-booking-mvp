// lib/subscription.ts
// Utilidad central para verificar y auto-expirar suscripciones

import { prisma } from './prisma';

export type SubStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';

export interface SubInfo {
  id: string;
  status: SubStatus;
  plan: string;
  trialEndsAt: Date | null;
  endDate: Date | null;
  maxBarbers: number;
  maxPhotos: number;
}

// Verifica si la suscripción venció y la expira automáticamente en la BD
export async function checkAndExpire(barbershopId: string): Promise<SubInfo | null> {
  const sub = await prisma.subscription.findUnique({
    where: { barbershopId },
  });
  if (!sub) return null;

  const now = new Date();
  let status = sub.status as SubStatus;

  if (status === 'TRIAL' && sub.trialEndsAt && sub.trialEndsAt < now) {
    await prisma.subscription.update({
      where: { barbershopId },
      data:  { status: 'EXPIRED' },
    });
    status = 'EXPIRED';
  }

  if (status === 'ACTIVE' && sub.endDate && sub.endDate < now) {
    await prisma.subscription.update({
      where: { barbershopId },
      data:  { status: 'EXPIRED' },
    });
    status = 'EXPIRED';
  }

  return {
    id:          sub.id,
    status,
    plan:        sub.plan,
    trialEndsAt: sub.trialEndsAt,
    endDate:     sub.endDate,
    maxBarbers:  sub.maxBarbers,
    maxPhotos:   sub.maxPhotos,
  };
}

export function isActive(status: SubStatus): boolean {
  return status === 'ACTIVE' || status === 'TRIAL';
}

// Días restantes (positivo = quedan días, negativo = ya venció)
export function daysRemaining(sub: SubInfo): number | null {
  const ref = sub.status === 'TRIAL' ? sub.trialEndsAt : sub.endDate;
  if (!ref) return null;
  return Math.ceil((ref.getTime() - Date.now()) / 86_400_000);
}
