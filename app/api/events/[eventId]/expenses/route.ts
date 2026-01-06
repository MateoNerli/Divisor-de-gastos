import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { requireGroupMembership } from "@/lib/group";

const expenseSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.string().min(1).max(10),
  paidById: z.string().min(1),
  categoryId: z.string().optional(),
  splitType: z.enum(["EQUAL", "EXACT", "PERCENT"]),
  expenseDate: z.string().datetime().optional(),
  shares: z.array(
    z.object({
      userId: z.string().min(1),
      amount: z.number().optional(),
      percent: z.number().optional(),
    })
  ).min(1),
});

const round = (value: number) => Math.round(value * 100) / 100;

export async function GET(
  request: NextRequest,
  context: { params: { eventId: string } }
) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { eventId } = context.params;
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });
  if (!event) {
    return NextResponse.json(
      { error: "Evento no encontrado." },
      { status: 404 }
    );
  }

  const access = await requireGroupMembership(auth.userId!, event.groupId);
  if (access.response || !access.membership) {
    return access.response!;
  }

  const expenses = await prisma.expense.findMany({
    where: { eventId, deletedAt: null },
    include: {
      paidBy: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true } },
      shares: true,
    },
    orderBy: { expenseDate: "desc" },
  });

  return NextResponse.json(
    expenses.map((expense) => ({
      id: expense.id,
      description: expense.description,
      amount: Number(expense.amount),
      currency: expense.currency,
      paidBy: expense.paidBy,
      category: expense.category,
      splitType: expense.splitType,
      createdAt: expense.expenseDate,
      shares: expense.shares.map((share) => ({
        userId: share.userId,
        amount: Number(share.amount),
        percent: share.percent ? Number(share.percent) : null,
      })),
    }))
  );
}

export async function POST(
  request: NextRequest,
  context: { params: { eventId: string } }
) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const { eventId } = context.params;
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    include: { group: { select: { id: true } } },
  });
  if (!event) {
    return NextResponse.json(
      { error: "Evento no encontrado." },
      { status: 404 }
    );
  }

  const access = await requireGroupMembership(auth.userId!, event.groupId);
  if (access.response || !access.membership) {
    return access.response!;
  }

  const payload = await request.json().catch(() => null);
  const parsed = expenseSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos." },
      { status: 400 }
    );
  }

  const participantRows = await prisma.eventParticipant.findMany({
    where: { eventId },
    select: { userId: true },
  });
  const participantIds = new Set(participantRows.map((row) => row.userId));

  if (!participantIds.has(parsed.data.paidById)) {
    return NextResponse.json(
      { error: "El pagador no es participante del evento." },
      { status: 400 }
    );
  }

  if (parsed.data.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        groupId: event.groupId,
        deletedAt: null,
      },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Categoria invalida." },
        { status: 400 }
      );
    }
  }

  const uniqueShares = new Map<string, { amount?: number; percent?: number }>();
  parsed.data.shares.forEach((share) => {
    uniqueShares.set(share.userId, {
      amount: share.amount,
      percent: share.percent,
    });
  });

  const shareUserIds = Array.from(uniqueShares.keys()).filter((id) =>
    participantIds.has(id)
  );

  if (shareUserIds.length === 0) {
    return NextResponse.json(
      { error: "Selecciona participantes validos." },
      { status: 400 }
    );
  }

  const totalAmount = parsed.data.amount;
  let shares: { userId: string; amount: number; percent?: number }[] = [];

  if (parsed.data.splitType === "EQUAL") {
    const perPerson = round(totalAmount / shareUserIds.length);
    shares = shareUserIds.map((userId) => ({ userId, amount: perPerson }));
    const sum = shares.reduce((acc, item) => acc + item.amount, 0);
    const diff = round(totalAmount - sum);
    if (shares.length > 0 && diff !== 0) {
      shares[shares.length - 1].amount = round(
        shares[shares.length - 1].amount + diff
      );
    }
  }

  if (parsed.data.splitType === "EXACT") {
    shares = shareUserIds.map((userId) => ({
      userId,
      amount: round(uniqueShares.get(userId)?.amount || 0),
    }));
    const sum = round(shares.reduce((acc, item) => acc + item.amount, 0));
    if (sum !== round(totalAmount)) {
      return NextResponse.json(
        { error: "La suma de montos no coincide con el total." },
        { status: 400 }
      );
    }
  }

  if (parsed.data.splitType === "PERCENT") {
    shares = shareUserIds.map((userId) => ({
      userId,
      percent: round(uniqueShares.get(userId)?.percent || 0),
      amount: 0,
    }));
    const sumPercent = round(
      shares.reduce((acc, item) => acc + (item.percent || 0), 0)
    );
    if (sumPercent !== 100) {
      return NextResponse.json(
        { error: "Los porcentajes deben sumar 100." },
        { status: 400 }
      );
    }
    shares = shares.map((item) => ({
      ...item,
      amount: round((totalAmount * (item.percent || 0)) / 100),
    }));
    const sum = round(shares.reduce((acc, item) => acc + item.amount, 0));
    const diff = round(totalAmount - sum);
    if (shares.length > 0 && diff !== 0) {
      shares[shares.length - 1].amount = round(
        shares[shares.length - 1].amount + diff
      );
    }
  }

  const expense = await prisma.expense.create({
    data: {
      eventId,
      description: parsed.data.description,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      paidById: parsed.data.paidById,
      categoryId: parsed.data.categoryId,
      splitType: parsed.data.splitType,
      expenseDate: parsed.data.expenseDate
        ? new Date(parsed.data.expenseDate)
        : undefined,
      shares: {
        create: shares.map((share) => ({
          userId: share.userId,
          amount: share.amount,
          percent: share.percent ?? null,
        })),
      },
    },
  });

  return NextResponse.json({ id: expense.id });
}



