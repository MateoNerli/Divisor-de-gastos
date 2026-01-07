"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";

type Person = {
  id: string;
  name: string;
};

type Expense = {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  consumerIds: string[];
  date: string;
};

type Settlement = {
  fromId: string;
  toId: string;
  amount: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

const buildSettlements = (
  people: Person[],
  balances: Map<string, number>
) => {
  const debtors = people
    .map((person) => ({
      id: person.id,
      name: person.name,
      balance: balances.get(person.id) || 0,
    }))
    .filter((item) => item.balance < 0)
    .map((item) => ({ ...item, balance: Math.abs(item.balance) }));

  const creditors = people
    .map((person) => ({
      id: person.id,
      name: person.name,
      balance: balances.get(person.id) || 0,
    }))
    .filter((item) => item.balance > 0);

  const settlements: Settlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.balance, creditor.balance);

    settlements.push({
      fromId: debtor.id,
      toId: creditor.id,
      amount: round(amount),
    });

    debtor.balance = round(debtor.balance - amount);
    creditor.balance = round(creditor.balance - amount);

    if (debtor.balance <= 0.0001) {
      debtorIndex += 1;
    }
    if (creditor.balance <= 0.0001) {
      creditorIndex += 1;
    }
  }

  return settlements;
};

export default function QuickSplitPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newName, setNewName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState("");
  const [consumerIds, setConsumerIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    const storedPeople = localStorage.getItem("quick_people");
    const storedExpenses = localStorage.getItem("quick_expenses");

    if (storedPeople) {
      setPeople(JSON.parse(storedPeople));
    }
    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("quick_people", JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem("quick_expenses", JSON.stringify(expenses));
  }, [expenses]);

  const handleAddPerson = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!newName.trim()) {
      setError("Ingresa un nombre de participante.");
      return;
    }
    const person: Person = {
      id: crypto.randomUUID(),
      name: newName.trim(),
    };
    setPeople((prev) => [...prev, person]);
    setNewName("");
  };

  const handleAddExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!description.trim() || !amount || !paidById || consumerIds.length === 0) {
      setError("Completa descripcion, monto, pagador y consumos.");
      return;
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }

    const expense: Expense = {
      id: crypto.randomUUID(),
      description: description.trim(),
      amount: parsedAmount,
      paidById,
      consumerIds,
      date,
    };

    setExpenses((prev) => [expense, ...prev]);
    setDescription("");
    setAmount("");
    setConsumerIds([]);
    setDate(new Date().toISOString().slice(0, 10));
  };

  const totals = useMemo(() => {
    const balances = new Map<string, number>();
    people.forEach((person) => balances.set(person.id, 0));

    expenses.forEach((expense) => {
      const consumers = expense.consumerIds;
      if (consumers.length === 0) {
        return;
      }
      const share = expense.amount / consumers.length;

      balances.set(
        expense.paidById,
        round((balances.get(expense.paidById) || 0) + expense.amount)
      );

      consumers.forEach((consumerId) => {
        balances.set(
          consumerId,
          round((balances.get(consumerId) || 0) - share)
        );
      });
    });

    const settlements = buildSettlements(people, balances);

    const summary = people.map((person) => ({
      id: person.id,
      name: person.name,
      balance: balances.get(person.id) || 0,
    }));

    return { balances, settlements, summary };
  }, [people, expenses]);

  const handleToggleConsumer = (id: string) => {
    setConsumerIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleClear = () => {
    setPeople([]);
    setExpenses([]);
    setConsumerIds([]);
    localStorage.removeItem("quick_people");
    localStorage.removeItem("quick_expenses");
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Division rapida</h1>
              <p className="text-sm text-gray-500">
                Sin login ni grupos. Selecciona quien pago y quien consumio.
              </p>
            </div>
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:underline"
            >
              Volver al login
            </Link>
          </div>
        </div>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Participantes</h2>
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleAddPerson}>
                <input
                  type="text"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  className="flex-1 rounded border border-gray-300 px-3 py-2"
                  placeholder="Nombre"
                />
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Agregar
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                {people.length === 0 ? (
                  <span className="text-sm text-gray-500">
                    Agrega participantes para comenzar.
                  </span>
                ) : (
                  people.map((person) => (
                    <span
                      key={person.id}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {person.name}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Registrar gasto</h2>
              <form className="space-y-4" onSubmit={handleAddExpense}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="rounded border border-gray-300 px-3 py-2"
                    placeholder="Descripcion"
                  />
                  <input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="rounded border border-gray-300 px-3 py-2"
                    placeholder="Monto"
                  />
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="rounded border border-gray-300 px-3 py-2"
                  />
                  <select
                    value={paidById}
                    onChange={(event) => setPaidById(event.target.value)}
                    className="rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="">Pago</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Consumieron</p>
                  <div className="space-y-2">
                    {people.map((person) => (
                      <label
                        key={person.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={consumerIds.includes(person.id)}
                          onChange={() => handleToggleConsumer(person.id)}
                        />
                        <span>{person.name}</span>
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold mb-4">Gastos</h2>
                <button
                  onClick={handleClear}
                  className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Limpiar todo
                </button>
              </div>
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
                            Pago {people.find((p) => p.id === expense.paidById)?.name || "N/A"} ·{" "}
                            {new Date(expense.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Consumieron:{" "}
                            {expense.consumerIds
                              .map(
                                (id) =>
                                  people.find((p) => p.id === id)?.name || "N/A"
                              )
                              .join(", ")}
                          </p>
                        </div>
                        <div className="text-right font-semibold">
                          ${expense.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Balances</h2>
              {totals.settlements.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay deudas pendientes.
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  {totals.settlements.map((settlement) => {
                    const fromName =
                      people.find((p) => p.id === settlement.fromId)?.name ||
                      "N/A";
                    const toName =
                      people.find((p) => p.id === settlement.toId)?.name || "N/A";
                    return (
                      <div
                        key={`${settlement.fromId}-${settlement.toId}`}
                        className="flex items-center justify-between"
                      >
                        <span>{fromName}</span>
                        <span>
                          debe ${settlement.amount.toFixed(2)} a {toName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Resumen</h2>
              {totals.summary.length === 0 ? (
                <p className="text-sm text-gray-500">Sin participantes.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {totals.summary.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between"
                    >
                      <span>{item.name}</span>
                      <span>{item.balance.toFixed(2)}</span>
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
