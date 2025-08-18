import React, { useState } from "react";
//types
import { Person, PeopleManagerProps } from "../types";
//ui
import { FaUserPlus } from "react-icons/fa";

export default function PeopleManager({
  people,
  onAddPerson,
}: PeopleManagerProps) {
  const [newName, setNewName] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPerson: Person = {
      id: Date.now().toString(),
      name: newName.trim(),
    };

    onAddPerson(newPerson);
    setNewName("");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Personas</h2>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2 flex-col md:flex-row">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre"
            className="flex-1 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaUserPlus className="w-5 h-5 mr-2" />
            Agregar
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {people.map((person) => (
          <div
            key={person.id}
            className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
          >
            <span>{person.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
