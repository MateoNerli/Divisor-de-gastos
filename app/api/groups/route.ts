export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

const groupSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const groups = await prisma.group.findMany({
    where: {
      deletedAt: null,
      memberships: {
        some: {
          userId: auth.userId!,
          deletedAt: null,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const summaries = await Promise.all(
    groups.map(async (group) => {
      const [memberCount, eventCount] = await Promise.all([
        prisma.membership.count({
          where: { groupId: group.id, deletedAt: null },
        }),
        prisma.event.count({
          where: { groupId: group.id, deletedAt: null },
        }),
      ]);
      return {
        id: group.id,
        name: group.name,
        memberCount,
        eventCount,
      };
    })
  );

  return NextResponse.json(summaries);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const payload = await request.json().catch(() => null);
  const parsed = groupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      createdById: auth.userId!,
      memberships: {
        create: {
          userId: auth.userId!,
          role: "ADMIN",
        },
      },
    },
  });

  return NextResponse.json({
    id: group.id,
    name: group.name,
    memberCount: 1,
    eventCount: 0,
  });
}
