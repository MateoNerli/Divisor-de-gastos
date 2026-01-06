import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { clearAuthCookie } from "@/lib/auth";

const profileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  email: z.string().email().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId! },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const payload = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos." },
      { status: 400 }
    );
  }

  if (!parsed.data.name && !parsed.data.email) {
    return NextResponse.json(
      { error: "No hay cambios para guardar." },
      { status: 400 }
    );
  }

  if (parsed.data.email) {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (existing && existing.id !== auth.userId) {
      return NextResponse.json(
        { error: "El email ya esta en uso." },
        { status: 409 }
      );
    }
  }

  const user = await prisma.user.update({
    where: { id: auth.userId! },
    data: {
      name: parsed.data.name,
      email: parsed.data.email?.toLowerCase(),
    },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: auth.userId! },
      data: { deletedAt: new Date() },
    }),
    prisma.membership.updateMany({
      where: { userId: auth.userId! },
      data: { deletedAt: new Date() },
    }),
  ]);

  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  return response;
}



