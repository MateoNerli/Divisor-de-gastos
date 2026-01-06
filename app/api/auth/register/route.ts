import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setAuthCookie } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de registro invalidos." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing && !existing.deletedAt) {
    return NextResponse.json(
      { error: "El email ya esta registrado." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: parsed.data.name,
      passwordHash,
    },
    update: {
      name: parsed.data.name,
      passwordHash,
      deletedAt: null,
    },
  });

  const response = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
  await setAuthCookie(response, user.id);
  return response;
}



