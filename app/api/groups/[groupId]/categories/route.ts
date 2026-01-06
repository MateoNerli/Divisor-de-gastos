import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { requireGroupMembership } from "@/lib/group";

const categorySchema = z.object({
  name: z.string().min(1).max(80),
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

  const categories = await prisma.category.findMany({
    where: { groupId, deletedAt: null },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    categories.map((category) => ({ id: category.id, name: category.name }))
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
  const access = await requireGroupMembership(auth.userId!, groupId);
  if (access.response || !access.membership) {
    return access.response!;
  }

  const payload = await request.json().catch(() => null);
  const parsed = categorySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos." },
      { status: 400 }
    );
  }

  const existing = await prisma.category.findFirst({
    where: { groupId, name: parsed.data.name, deletedAt: null },
  });
  if (existing) {
    return NextResponse.json(
      { error: "La Categoria ya existe." },
      { status: 409 }
    );
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      groupId,
      createdById: auth.userId!,
    },
  });

  return NextResponse.json({ id: category.id, name: category.name });
}



