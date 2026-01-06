import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { requireGroupAdmin, requireGroupMembership } from "@/lib/group";

const groupUpdateSchema = z.object({
  name: z.string().min(1).max(120),
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

  const group = await prisma.group.findFirst({
    where: { id: groupId, deletedAt: null },
  });

  if (!group) {
    return NextResponse.json({ error: "Grupo no encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    id: group.id,
    name: group.name,
    role: access.membership.role,
  });
}

export async function PATCH(
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
  const parsed = groupUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos." },
      { status: 400 }
    );
  }

  const group = await prisma.group.update({
    where: { id: groupId },
    data: { name: parsed.data.name },
  });

  return NextResponse.json({
    id: group.id,
    name: group.name,
    role: access.membership.role,
  });
}

export async function DELETE(
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

  await prisma.group.update({
    where: { id: groupId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}


