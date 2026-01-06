import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

export async function POST(
  request: NextRequest,
  context: { params: { token: string } }
) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { token } = context.params;
  const invite = await prisma.invite.findUnique({
    where: { token },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Invitacion no encontrada." },
      { status: 404 }
    );
  }

  if (invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Invitacion expirada." },
      { status: 410 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId! },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 }
    );
  }

  if (invite.invitedEmail && invite.invitedEmail !== user.email) {
    return NextResponse.json(
      { error: "Esta invitacion es para otro email." },
      { status: 403 }
    );
  }

  await prisma.$transaction([
    prisma.membership.upsert({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: invite.groupId,
        },
      },
      create: {
        userId: user.id,
        groupId: invite.groupId,
        role: "MEMBER",
      },
      update: {
        deletedAt: null,
      },
    }),
    prisma.invite.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ groupId: invite.groupId });
}


