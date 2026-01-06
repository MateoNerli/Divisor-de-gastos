import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { requireGroupAdmin } from "@/lib/group";

const inviteSchema = z.object({
  email: z.string().email().optional(),
});

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

  const payload = await request.json().catch(() => ({}));
  const parsed = inviteSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos." },
      { status: 400 }
    );
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await prisma.invite.create({
    data: {
      token,
      groupId,
      invitedById: auth.userId!,
      invitedEmail: parsed.data.email?.toLowerCase(),
      expiresAt,
    },
  });

  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  return NextResponse.json({
    token: invite.token,
    inviteUrl: `${origin}/invites/${invite.token}`,
    expiresAt: invite.expiresAt,
  });
}


