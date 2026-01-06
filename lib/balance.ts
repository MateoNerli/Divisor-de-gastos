type Participant = {
  id: string;
  name: string;
};

type ExpenseShare = {
  userId: string;
  amount: number;
};

type ExpenseEntry = {
  amount: number;
  paidById: string;
  categoryName: string | null;
  shares: ExpenseShare[];
};

const round = (value: number) => Math.round(value * 100) / 100;

export const calculateBalances = (
  participants: Participant[],
  expenses: ExpenseEntry[]
) => {
  const totals = new Map<string, { paid: number; owed: number }>();
  const categoryTotals = new Map<string, number>();

  participants.forEach((participant) => {
    totals.set(participant.id, { paid: 0, owed: 0 });
  });

  expenses.forEach((expense) => {
    const paid = totals.get(expense.paidById) || { paid: 0, owed: 0 };
    paid.paid += expense.amount;
    totals.set(expense.paidById, paid);

    expense.shares.forEach((share) => {
      const owed = totals.get(share.userId) || { paid: 0, owed: 0 };
      owed.owed += share.amount;
      totals.set(share.userId, owed);
    });

    const categoryKey = expense.categoryName || "Sin Categoria";
    categoryTotals.set(
      categoryKey,
      round((categoryTotals.get(categoryKey) || 0) + expense.amount)
    );
  });

  const totalsArray = participants.map((participant) => {
    const data = totals.get(participant.id) || { paid: 0, owed: 0 };
    const net = round(data.paid - data.owed);
    return {
      userId: participant.id,
      name: participant.name,
      paid: round(data.paid),
      owed: round(data.owed),
      net,
    };
  });

  const debtors = totalsArray
    .filter((item) => item.net < 0)
    .map((item) => ({ ...item, net: Math.abs(item.net) }));
  const creditors = totalsArray.filter((item) => item.net > 0);

  const settlements: {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    amount: number;
  }[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.net, creditor.net);

    settlements.push({
      fromId: debtor.userId,
      fromName: debtor.name,
      toId: creditor.userId,
      toName: creditor.name,
      amount: round(amount),
    });

    debtor.net -= amount;
    creditor.net -= amount;

    if (debtor.net <= 0.0001) {
      debtorIndex += 1;
    }
    if (creditor.net <= 0.0001) {
      creditorIndex += 1;
    }
  }

  const byCategory = Array.from(categoryTotals.entries()).map(
    ([category, total]) => ({
      category,
      total,
    })
  );

  return { totals: totalsArray, settlements, byCategory };
};


