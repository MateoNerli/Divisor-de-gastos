export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { requireGroupMembership } from "@/lib/group";

const eventSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  participantIds: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: { groupId: string } }
) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { groupId } = context.params;
  const access = await requireGroupMembership(auth.userId!, groupId);
  if (access.response || !access.membership) {
    return access.response!;
  }

  const events = await prisma.event.findMany({
    where: { groupId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const summaries = await Promise.all(
    events.map(async (event) => {
      const [participantCount, expenseCount] = await Promise.all([
        prisma.eventParticipant.count({ where: { eventId: event.id } }),
        prisma.expense.count({ where: { eventId: event.id, deletedAt: null } }),
      ]);
      return {
        id: event.id,
        name: event.name,
        participantCount,
        expenseCount,
      };
    })
  );

  return NextResponse.json(summaries);
}

export async function POST(
  request: NextRequest,
  context: { params: { groupId: string } }
) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { groupId } = context.params;
  const access = await requireGroupMembership(auth.userId!, groupId);
  if (access.response || !access.membership) {
    return access.response!;
  }

  const payload = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  }

  const members = await prisma.membership.findMany({
    where: { groupId, deletedAt: null },
    select: { userId: true },
  });
  const memberIds = members.map((member) => member.userId);

  const participantIds = Array.from(
    new Set(
      parsed.data.participantIds?.filter((id) => memberIds.includes(id)) ??
        memberIds
    )
  );

  if (participantIds.length === 0) {
    return NextResponse.json(
      { error: "El evento necesita participantes." },
      { status: 400 }
    );
  }

  const event = await prisma.event.create({
    data: {
      groupId,
      name: parsed.data.name,
      description: parsed.data.description,
      participants: {
        create: participantIds.map((userId) => ({ userId })),
      },
    },
  });

  return NextResponse.json({
    id: event.id,
    name: event.name,
    participantCount: participantIds.length,
    expenseCount: 0,
  });
}
