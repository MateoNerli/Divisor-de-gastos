export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: { token: string } }
) {
  const { token } = context.params;
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { group: { select: { id: true, name: true } } },
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

  return NextResponse.json({
    group: invite.group,
    invitedEmail: invite.invitedEmail,
    expiresAt: invite.expiresAt,
  });
}
