// app/api/barbershop/barbers/[id]/invite/route.ts
// POST - Generar link de invitación para un barbero
// GET  - Ver estado de invitación actual

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const EXPIRE_HOURS = 48; // El link expira en 48 horas

async function getBarbershopAndBarber(barberId: string, userId: string) {
  const barbershop = await prisma.barbershop.findUnique({ where: { ownerId: userId } });
  if (!barbershop) return null;
  const barber = await prisma.barber.findFirst({ where: { id: barberId, barbershopId: barbershop.id } });
  return barber ? { barbershop, barber } : null;
}

// ─────────────────────────────────────────────
// POST — Generar nuevo link de invitación
// ─────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const result = await getBarbershopAndBarber(id, session.user.id);
    if (!result) return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });

    const { barber } = result;
    const { email } = await req.json().catch(() => ({}));

    // Invalidar invitaciones previas del barbero
    await prisma.barberInvitation.deleteMany({ where: { barberId: id } });

    // Crear nuevo token
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + EXPIRE_HOURS * 60 * 60 * 1000);

    await prisma.barberInvitation.create({
      data: { token, barberId: id, email: email || barber.email || null, expiresAt },
    });

    // Actualizar estado del barbero a INVITED
    await prisma.barber.update({
      where: { id },
      data:  { inviteStatus: 'INVITED' },
    });

    const baseUrl  = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invite/${token}`;

    return NextResponse.json({ inviteUrl, expiresAt, token });
  } catch (error) {
    console.error('[INVITE POST]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// GET — Ver invitación activa del barbero
// ─────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const result = await getBarbershopAndBarber(id, session.user.id);
    if (!result) return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });

    const invitation = await prisma.barberInvitation.findFirst({
      where:   { barberId: id, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = invitation ? `${baseUrl}/invite/${invitation.token}` : null;

    return NextResponse.json({
      invitation,
      inviteUrl,
      barber: result.barber,
    });
  } catch (error) {
    console.error('[INVITE GET]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}