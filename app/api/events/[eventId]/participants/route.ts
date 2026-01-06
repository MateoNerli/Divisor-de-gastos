export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { requireGroupAdmin, requireGroupMembership } from "@/lib/group";

const participantsSchema = z.object({
  participantIds: z.array(z.string()).min(1),
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

  const participants = await prisma.eventParticipant.findMany({
    where: { eventId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(
    participants.map((participant) => ({
      id: participant.user.id,
      name: participant.user.name,
      email: participant.user.email,
    }))
  );
}

export async function PUT(
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
  });
  if (!event) {
    return NextResponse.json(
      { error: "Evento no encontrado." },
      { status: 404 }
    );
  }

  const access = await requireGroupAdmin(auth.userId!, event.groupId);
  if (access.response || !access.membership) {
    return access.response!;
  }

  const payload = await request.json().catch(() => null);
  const parsed = participantsSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  }

  const members = await prisma.membership.findMany({
    where: { groupId: event.groupId, deletedAt: null },
    select: { userId: true },
  });
  const memberIds = new Set(members.map((member) => member.userId));
  const validIds = Array.from(
    new Set(parsed.data.participantIds.filter((id) => memberIds.has(id)))
  );

  if (validIds.length === 0) {
    return NextResponse.json(
      { error: "Participantes invalidos." },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.eventParticipant.deleteMany({ where: { eventId } }),
    prisma.eventParticipant.createMany({
      data: validIds.map((userId) => ({ eventId, userId })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
