"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

type Participant = {
  id: string;
  name: string | null;
  email: string;
};

type EventDetail = {
  id: string;
  name: string;
  description: string | null;
  groupId: string;
  currentUserId: string;
  currentUserRole: "ADMIN" | "MEMBER";
  participants: Participant[];
};

type ExpenseShare = {
  userId: string;
  amount: number;
  percent: number | null;
};

type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: Participant;
  category: { id: string; name: string } | null;
  splitType: "EQUAL" | "EXACT" | "PERCENT";
  createdAt: string;
  shares: ExpenseShare[];
};

type BalanceSummary = {
  totals: {
    userId: string;
    name: string;
    paid: number;
    owed: number;
    net: number;
  }[];
  settlements: { fromId: string; fromName: string; toId: string; toName: string; amount: number }[];
  byCategory: { category: string; total: number }[];
};

type Category = {
  id: string;
  name: string;
};

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [balances, setBalances] = useState<BalanceSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [paidStatus, setPaidStatus] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [categoryId, setCategoryId] = useState("");
  const [paidById, setPaidById] = useState("");
  const [splitType, setSplitType] = useState<"EQUAL" | "EXACT" | "PERCENT">(
    "EQUAL"
  );
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [shareAmounts, setShareAmounts] = useState<Record<string, string>>({});
  const [sharePercents, setSharePercents] = useState<Record<string, string>>({});

  const participantMap = useMemo(() => {
    const map = new Map<string, Participant>();
    event?.participants.forEach((participant) => map.set(participant.id, participant));
    return map;
  }, [event]);

  const loadAll = async () => {
    const eventResponse = await fetch(`/api/events/${eventId}`);
    if (!eventResponse.ok) {
      router.replace("/dashboard");
      return;
    }
    const eventData = (await eventResponse.json()) as EventDetail;
    setEvent(eventData);

    if (selectedParticipants.length === 0 && eventData.participants.length > 0) {
      setSelectedParticipants(eventData.participants.map((p) => p.id));
      setPaidById(eventData.participants[0]?.id || "");
    }

    const expenseResponse = await fetch(`/api/events/${eventId}/expenses`);
    if (expenseResponse.ok) {
      setExpenses(await expenseResponse.json());
    }

    const balanceResponse = await fetch(`/api/events/${eventId}/balance`);
    if (balanceResponse.ok) {
      setBalances(await balanceResponse.json());
    }

    if (eventData.groupId) {
      const categoryResponse = await fetch(
        `/api/groups/${eventData.groupId}/categories`
      );
      if (categoryResponse.ok) {
        setCategories(await categoryResponse.json());
      }
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    const stored = localStorage.getItem(`event_paid_${eventId}`);
    if (stored) {
      setPaidStatus(JSON.parse(stored));
    } else {
      setPaidStatus({});
    }
  }, [eventId]);

  useEffect(() => {
    localStorage.setItem(
      `event_paid_${eventId}`,
      JSON.stringify(paidStatus)
    );
  }, [eventId, paidStatus]);

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(participantId)) {
        return prev.filter((id) => id !== participantId);
      }
      return [...prev, participantId];
    });
  };

  const handleCreateExpense = async (
    eventForm: FormEvent<HTMLFormElement>
  ) => {
    eventForm.preventDefault();
    setError("");
    if (!description.trim() || !amount || !paidById || selectedParticipants.length === 0) {
      setError("Completa descripcion, monto, pagador y participantes.");
      return;
    }

    const sharePayload = selectedParticipants.map((userId) => ({
      userId,
      amount:
        splitType === "EXACT"
          ? Number(shareAmounts[userId] || 0)
          : undefined,
      percent:
        splitType === "PERCENT"
          ? Number(sharePercents[userId] || 0)
          : undefined,
    }));

    const response = await fetch(`/api/events/${eventId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        amount: Number(amount),
        currency,
        expenseDate: expenseDate
          ? new Date(expenseDate).toISOString()
          : undefined,
        paidById,
        categoryId: categoryId || undefined,
        splitType,
        shares: sharePayload,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "No se pudo crear el gasto.");
      return;
    }

    setDescription("");
    setAmount("");
    setCategoryId("");
    setSplitType("EQUAL");
    setShareAmounts({});
    setSharePercents({});
    setExpenseDate(new Date().toISOString().slice(0, 10));
    await loadAll();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const response = await fetch(`/api/expenses/${expenseId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError("No se pudo eliminar el gasto.");
      return;
    }
    await loadAll();
  };

  const handleTogglePaid = (key: string) => {
    setPaidStatus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopy = async (message: string, key: string) => {
    if (!navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(message);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const buildBalanceMessage = () => {
    if (!balances || balances.settlements.length === 0) {
      return "";
    }
    const lines = balances.settlements.map((settlement) => {
      const key = `${settlement.fromId}-${settlement.toId}`;
      const paid = paidStatus[key] || false;
      const paidSuffix = paid ? " (pago)" : "";
      return `- ${settlement.fromName} debe ${settlement.amount.toFixed(2)} a ${settlement.toName}${paidSuffix}`;
    });
    return `Balance del evento "${event.name}":\n${lines.join("\n")}`;
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Cargando evento...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-semibold">{event.name}</h1>
          {event.description && (
            <p className="text-sm text-gray-500">{event.description}</p>
          )}
        </div>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Registrar gasto</h2>
              <form className="space-y-4" onSubmit={handleCreateExpense}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={description}
                    onChange={(eventInput) => setDescription(eventInput.target.value)}
                    className="rounded border border-gray-300 px-3 py-2"
                    placeholder="Descripcion"
                  />
                  <input
                    type="number"
                    value={amount}
                    onChange={(eventInput) => setAmount(eventInput.target.value)}
                    className="rounded border border-gray-300 px-3 py-2"
                    placeholder="Monto"
                  />
                  <input
                    type="text"
                    value={currency}
                    onChange={(eventInput) => setCurrency(eventInput.target.value.toUpperCase())}
                    className="rounded border border-gray-300 px-3 py-2"
                    placeholder="ARS"
                  />
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(eventInput) => setExpenseDate(eventInput.target.value)}
                    className="rounded border border-gray-300 px-3 py-2"
                  />
                  <select
                    value={paidById}
                    onChange={(eventInput) => setPaidById(eventInput.target.value)}
                    className="rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="">Pagado por</option>
                    {event.participants.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.name || participant.email}
                      </option>
                    ))}
                  </select>
                  <select
                    value={categoryId}
                    onChange={(eventInput) => setCategoryId(eventInput.target.value)}
                    className="rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="">Categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={splitType}
                    onChange={(eventInput) =>
                      setSplitType(eventInput.target.value as typeof splitType)
                    }
                    className="rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="EQUAL">Reparto equitativo</option>
                    <option value="EXACT">Montos exactos</option>
                    <option value="PERCENT">Porcentajes</option>
                  </select>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Participantes</p>
                  <div className="space-y-2">
                    {event.participants.map((participant) => (
                      <label
                        key={participant.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(participant.id)}
                          onChange={() => toggleParticipant(participant.id)}
                        />
                        <span>{participant.name || participant.email}</span>
                        {splitType === "EXACT" &&
                          selectedParticipants.includes(participant.id) && (
                            <input
                              type="number"
                              value={shareAmounts[participant.id] || ""}
                              onChange={(eventInput) =>
                                setShareAmounts((prev) => ({
                                  ...prev,
                                  [participant.id]: eventInput.target.value,
                                }))
                              }
                              className="ml-auto w-28 rounded border border-gray-300 px-2 py-1 text-xs"
                              placeholder="Monto"
                            />
                          )}
                        {splitType === "PERCENT" &&
                          selectedParticipants.includes(participant.id) && (
                            <input
                              type="number"
                              value={sharePercents[participant.id] || ""}
                              onChange={(eventInput) =>
                                setSharePercents((prev) => ({
                                  ...prev,
                                  [participant.id]: eventInput.target.value,
                                }))
                              }
                              className="ml-auto w-28 rounded border border-gray-300 px-2 py-1 text-xs"
                              placeholder="%"
                            />
                          )}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Guardar gasto
                </button>
              </form>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Gastos</h2>
              {expenses.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay gastos registrados.
                </p>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="rounded border border-gray-200 px-4 py-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-xs text-gray-500">
                            Pagado por {expense.paidBy.name || expense.paidBy.email} \u00b7{" "}
                            {new Date(expense.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {expense.category?.name || "Sin Categoria"} \u00b7{" "}
                            {expense.splitType}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {expense.currency} {expense.amount.toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {expense.shares.map((share) => {
                          const participant = participantMap.get(share.userId);
                          return (
                            <div key={share.userId}>
                              {participant?.name || participant?.email}:{" "}
                              {expense.currency} {share.amount.toFixed(2)}
                              {share.percent !== null ? ` (${share.percent}%)` : ""}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Balances</h2>
                <button
                  type="button"
                  disabled={!balances || balances.settlements.length === 0}
                  onClick={() => handleCopy(buildBalanceMessage(), "balance-all")}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {copiedKey === "balance-all" ? "Copiado" : "Copiar balance"}
                </button>
              </div>
              {!balances ? (
                <p className="text-sm text-gray-500">Calculando...</p>
              ) : balances.settlements.length === 0 ? (
                <p className="text-sm text-gray-500">No hay deudas pendientes.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  {balances.settlements.map((settlement) => {
                    const key = `${settlement.fromId}-${settlement.toId}`;
                    const canManage =
                      event.currentUserRole === "ADMIN" ||
                      event.currentUserId === settlement.toId;
                    const paid = paidStatus[key] || false;
                    return (
                      <div
                        key={key}
                        className="rounded border border-gray-200 px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={paid ? "opacity-60 line-through" : ""}>
                            <div className="font-medium">
                              {settlement.fromName}
                            </div>
                            <div className="text-xs text-gray-500">
                              debe {settlement.amount.toFixed(2)} a{" "}
                              {settlement.toName}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <label className="flex items-center gap-2 text-xs text-gray-500">
                              <input
                                type="checkbox"
                                checked={paid}
                                onChange={() => handleTogglePaid(key)}
                                disabled={!canManage}
                              />
                              {paid ? "Pago" : "No pago"}
                            </label>
                          </div>
                        </div>
                        {!canManage && (
                          <p className="mt-1 text-xs text-gray-400">
                            Solo admin o quien pago puede marcar.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Resumen por persona</h2>
              {!balances ? (
                <p className="text-sm text-gray-500">Calculando...</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {balances.totals.map((total) => (
                    <div key={total.userId} className="flex items-center justify-between">
                      <span>{total.name}</span>
                      <span>{total.net.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Por Categoria</h2>
              {!balances ? (
                <p className="text-sm text-gray-500">Calculando...</p>
              ) : balances.byCategory.length === 0 ? (
                <p className="text-sm text-gray-500">Sin Categorias.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {balances.byCategory.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <span>{item.category}</span>
                      <span>{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



