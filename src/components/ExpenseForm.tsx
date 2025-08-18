import React, { useState, useEffect } from "react";
//types
import { Expense, Person, ExpenseFormProps } from "../types";
//ui
import { FaPlusCircle } from "react-icons/fa";
//components ui
import TextInput from "../utils/textInput";
import PaidBySelector from "../utils/paidBySelector";

export default function ExpenseForm({
  people,
  onAddExpense,
  onUpdateExpense,
  editingExpense,
  setEditingExpense,
}: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setAmount(editingExpense.amount.toString());
      setPaidBy(editingExpense.paidBy);
      setParticipants(editingExpense.participants);
    } else {
      // Limpia el formulario si no hay un gasto en edición
      setDescription("");
      setAmount("");
      setPaidBy("");
      setParticipants([]);
    }
  }, [editingExpense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !paidBy || participants.length === 0) return;

    const newOrUpdatedExpense: Expense = {
      id: editingExpense ? editingExpense.id : Date.now().toString(),
      description,
      amount: parseFloat(amount),
      paidBy,
      participants,
      date: editingExpense ? editingExpense.date : new Date().toISOString(),
    };

    if (editingExpense) {
      onUpdateExpense(newOrUpdatedExpense);
    } else {
      onAddExpense(newOrUpdatedExpense);
    }

    setDescription("");
    setAmount("");
    setPaidBy("");
    setParticipants([]);
  };

  const handleCancelEdit = () => {
    setEditingExpense(null); // Sale del modo de edición
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {editingExpense ? "Editar gasto" : "Agregar gastos"}
      </h2>

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
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-blue-600"
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
          {editingExpense ? "Guardar cambios" : "Agregar gasto"}
        </button>
        {editingExpense && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
