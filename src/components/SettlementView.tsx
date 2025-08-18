import { useEffect, useState } from "react";
//ui
import { FaArrowRight } from "react-icons/fa";
//types
import { Settlement, Person, Expense, SettlementViewProps } from "../types";

export default function SettlementView({
  people,
  expenses,
}: SettlementViewProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const calculateSettlements = (
    expenses: Expense[],
    people: Person[]
  ): Settlement[] => {
    const balances = new Map<string, number>();

    people.forEach((person) => balances.set(person.id, 0));

    expenses.forEach((expense) => {
      const payer = expense.paidBy;
      const amountPerPerson = expense.amount / expense.participants.length;

      balances.set(payer, (balances.get(payer) || 0) + expense.amount);

      expense.participants.forEach((participantId) => {
        balances.set(
          participantId,
          (balances.get(participantId) || 0) - amountPerPerson
        );
      });
    });

    const settlements: Settlement[] = [];
    const debtors = Array.from(balances.entries()).filter(
      ([, amount]) => amount < 0
    );
    const creditors = Array.from(balances.entries()).filter(
      ([, amount]) => amount > 0
    );

    while (debtors.length > 0 && creditors.length > 0) {
      const [debtorId, debtAmount] = debtors[0];
      const [creditorId, creditAmount] = creditors[0];

      const amount = Math.min(Math.abs(debtAmount), creditAmount);

      settlements.push({
        from: debtorId,
        to: creditorId,
        amount: Number(amount.toFixed(2)),
      });

      // Actualizar los saldos correctamente
      if (Math.abs(debtAmount) > creditAmount) {
        debtors[0][1] += creditAmount; // Ajustar el saldo del deudor
        creditors.shift(); // Eliminar al acreedor porque ya se le pagó
      } else {
        creditors[0][1] -= Math.abs(debtAmount); // Ajustar el saldo del acreedor
        debtors.shift(); // Eliminar al deudor porque ya pagó
      }
    }

    return settlements;
  };

  useEffect(() => {
    setSettlements(calculateSettlements(expenses, people));
  }, [expenses, people]);

  const getPerson = (id: string) =>
    people.find((p) => p.id === id)?.name || "Unknown";

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Pagar a cada persona</h2>
      </div>

      <div className="p-4">
        {settlements.length === 0 ? (
          <p className="text-center text-gray-500">No hay pagos pendientes</p>
        ) : (
          <div className="space-y-4">
            {settlements.map((settlement, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">
                  {getPerson(settlement.from)}
                </span>
                <div className="flex items-center text-gray-500">
                  <span className="mx-2">${settlement.amount.toFixed(2)}</span>
                  <FaArrowRight className="w-5 h-5" />
                </div>
                <span className="font-medium">{getPerson(settlement.to)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
