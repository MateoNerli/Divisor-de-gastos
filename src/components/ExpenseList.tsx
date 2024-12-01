import { FaReceipt } from "react-icons/fa";
import { Expense, Person } from "../types";

interface ExpenseListProps {
  expenses: Expense[];
  people: Person[];
}

export default function ExpenseList({ expenses, people }: ExpenseListProps) {
  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Gastos</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {expenses.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No hay gastos registrados
          </div>
        ) : (
          expenses.map((expense: Expense) => (
            <div
              key={expense.id}
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <FaReceipt className="text-gray-400" />
                <div>
                  <p className="font-semibold">{expense.description}</p>
                  <p className="text-sm text-gray-500">
                    {expense.participants.map((id: string, index: number) => (
                      <span key={id}>
                        {people.find((p: Person) => p.id === id)?.name}
                        {index === expense.participants.length - 1 ? "" : ", "}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <p className="font-semibold">${expense.amount}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
