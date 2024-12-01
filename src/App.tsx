import { useState, useEffect } from "react";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import PeopleManager from "./components/PeopleManager";
import SettlementView from "./components/SettlementView";
import { Person, Expense } from "./types";

function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const storedPeople = localStorage.getItem("people");
    const storedExpenses = localStorage.getItem("expenses");

    if (storedPeople) {
      setPeople(JSON.parse(storedPeople));
    }

    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses));
    }
  }, []);

  const handleAddPerson = (person: Person) => {
    const updatedPeople = [...people, person];
    setPeople(updatedPeople);
    localStorage.setItem("people", JSON.stringify(updatedPeople));
  };

  const handleAddExpense = (expense: Expense) => {
    const updatedExpenses = [...expenses, expense];
    setExpenses(updatedExpenses);
    localStorage.setItem("expenses", JSON.stringify(updatedExpenses));
  };

  const handleClearAll = () => {
    localStorage.removeItem("people");
    localStorage.removeItem("expenses");
    setPeople([]);
    setExpenses([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Divisor de gastos
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <PeopleManager people={people} onAddPerson={handleAddPerson} />
            <ExpenseForm people={people} onAddExpense={handleAddExpense} />
          </div>

          <div className="space-y-8">
            <SettlementView people={people} expenses={expenses} />
            <ExpenseList expenses={expenses} people={people} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Limpiar Todo
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
