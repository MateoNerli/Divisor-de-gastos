import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { requireGroupAdmin } from "@/lib/group";

const roleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function PATCH(
  request: NextRequest,
  context: { params: { groupId: string; memberId: string } }
) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { groupId, memberId } = context.params;
  const access = await requireGroupAdmin(auth.userId!, groupId);
  if (access.response || !access.membership) {
    return access.response!;
  }

  const payload = await request.json().catch(() => null);
  const parsed = roleSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos." },
      { status: 400 }
    );
  }

  const membership = await prisma.membership.update({
    where: {
      userId_groupId: {
        userId: memberId,
        groupId,
      },
    },
    data: { role: parsed.data.role },
  });

  return NextResponse.json({
    id: membership.userId,
    role: membership.role,
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: { groupId: string; memberId: string } }
) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { groupId, memberId } = context.params;
  const access = await requireGroupAdmin(auth.userId!, groupId);
  if (access.response || !access.membership) {
    return access.response!;
  }

  await prisma.membership.update({
    where: {
      userId_groupId: {
        userId: memberId,
        groupId,
      },
    },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}


