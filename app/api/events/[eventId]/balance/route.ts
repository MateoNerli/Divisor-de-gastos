import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { requireGroupMembership } from "@/lib/group";
import { calculateBalances } from "@/lib/balance";

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

  const participants = await prisma.eventParticipant.findMany({
    where: { eventId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const expenses = await prisma.expense.findMany({
    where: { eventId, deletedAt: null },
    include: {
      shares: true,
      category: { select: { name: true } },
    },
  });

  const participantList = participants.map((participant) => ({
    id: participant.user.id,
    name: participant.user.name || participant.user.email,
  }));

  const expenseList = expenses.map((expense) => ({
    amount: Number(expense.amount),
    paidById: expense.paidById,
    categoryName: expense.category?.name || null,
    shares: expense.shares.map((share) => ({
      userId: share.userId,
      amount: Number(share.amount),
    })),
  }));

  const balances = calculateBalances(participantList, expenseList);
  return NextResponse.json(balances);
}
