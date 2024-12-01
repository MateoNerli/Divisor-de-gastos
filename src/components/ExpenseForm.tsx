import React, { useState } from "react";
import { Expense, Person } from "../types";
import { FaPlusCircle } from "react-icons/fa";
import TextInput from "../utils/textInput";
import PaidBySelector from "../utils/paidBySelector";

interface ExpenseFormProps {
  people: Person[];
  onAddExpense: (expense: Expense) => void;
}

export default function ExpenseForm({
  people,
  onAddExpense,
}: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !paidBy || participants.length === 0) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      description,
      amount: parseFloat(amount),
      paidBy,
      participants,
      date: new Date().toISOString(),
    };

    onAddExpense(newExpense);

    setDescription("");
    setAmount("");
    setPaidBy("");
    setParticipants([]);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Agregar gastos</h2>

      <div className="space-y-4">
        <TextInput
          label="Descripcion"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Productos"
        />

        <TextInput
          label="Precio"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1000"
        />

        <PaidBySelector
          label="Pagado por"
          value={paidBy}
          onChange={setPaidBy}
          people={people}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Persona que deben pagar
          </label>
          <div className="mt-2 space-y-2">
            {people.map((person: Person) => (
              <label key={person.id} className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={participants.includes(person.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setParticipants([...participants, person.id]);
                    } else {
                      setParticipants(
                        participants.filter((id) => id !== person.id)
                      );
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2">{person.name}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaPlusCircle className="w-5 h-5 mr-2" />
          Agregar gasto
        </button>
      </div>
    </form>
  );
}
