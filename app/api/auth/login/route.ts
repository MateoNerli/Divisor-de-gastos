export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setAuthCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Credenciales invalidas." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.deletedAt) {
    return NextResponse.json(
      { error: "Email o contrasena incorrectos." },
      { status: 401 }
    );
  }

  const validPassword = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash
  );

  if (!validPassword) {
    return NextResponse.json(
      { error: "Email o contrasena incorrectos." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
  await setAuthCookie(response, user.id);
  return response;
}
