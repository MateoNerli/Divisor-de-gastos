export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { requireGroupAdmin, requireGroupMembership } from "@/lib/group";

const eventUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
});

export async function GET(
  request: NextRequest,
  context: { params: { eventId: string } }
) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { eventId } = context.params;
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!event) {
    return NextResponse.json(
      { error: "Evento no encontrado." },
      { status: 404 }
    );
  }

  const access = await requireGroupMembership(auth.userId!, event.groupId);
  if (access.response || !access.membership) {
    return access.response!;
  }

  return NextResponse.json({
    id: event.id,
    name: event.name,
    description: event.description,
    groupId: event.groupId,
    participants: event.participants.map((participant) => ({
      id: participant.user.id,
      name: participant.user.name,
      email: participant.user.email,
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: { eventId: string } }
) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { eventId } = context.params;
  const existing = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Evento no encontrado." },
      { status: 404 }
    );
  }

  const access = await requireGroupMembership(auth.userId!, existing.groupId);
  if (access.response || !access.membership) {
    return access.response!;
  }

  const payload = await request.json().catch(() => null);
  const parsed = eventUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      name: parsed.data.name ?? undefined,
      description:
        parsed.data.description === undefined
          ? undefined
          : parsed.data.description,
    },
  });

  return NextResponse.json({
    id: event.id,
    name: event.name,
    description: event.description,
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: { eventId: string } }
) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { eventId } = context.params;
  const existing = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Evento no encontrado." },
      { status: 404 }
    );
  }

  const access = await requireGroupAdmin(auth.userId!, existing.groupId);
  if (access.response || !access.membership) {
    return access.response!;
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
