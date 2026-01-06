export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { requireGroupAdmin, requireGroupMembership } from "@/lib/group";

const memberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
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

  const members = await prisma.membership.findMany({
    where: { groupId, deletedAt: null },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
    }))
  );
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
  const access = await requireGroupAdmin(auth.userId!, groupId);
  if (access.response || !access.membership) {
    return access.response!;
  }

  const payload = await request.json().catch(() => null);
  const parsed = memberSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) {
    return NextResponse.json(
      { error: "El usuario no existe. Usa una invitacion por link." },
      { status: 404 }
    );
  }

  const membership = await prisma.membership.upsert({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
    create: {
      userId: user.id,
      groupId,
      role: parsed.data.role ?? "MEMBER",
    },
    update: {
      role: parsed.data.role ?? "MEMBER",
      deletedAt: null,
    },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: membership.role,
  });
}
