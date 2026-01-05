import { useState, useEffect, useRef } from "react";
//components
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import PeopleManager from "./components/PeopleManager";
import SettlementView from "./components/SettlementView";
//types
import { Person, Expense } from "./types";
//ui
import { FaMoon, FaSun } from "react-icons/fa";

function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [theme, setTheme] = useState("light");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedPeople = localStorage.getItem("people");
    const storedExpenses = localStorage.getItem("expenses");
    const storedTheme = localStorage.getItem("theme");

    if (storedPeople) {
      setPeople(JSON.parse(storedPeople));
    }

    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses));
    }

    // Carga la preferencia de tema
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // Opcional: Establecer el tema predeterminado según la preferencia del sistema
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  // Sincroniza la clase 'dark' con el estado del tema
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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

  const handleUpdateExpense = (updatedExpense: Expense) => {
    const updatedExpenses = expenses.map((exp) =>
      exp.id === updatedExpense.id ? updatedExpense : exp
    );
    setExpenses(updatedExpenses);
    localStorage.setItem("expenses", JSON.stringify(updatedExpenses));
    setEditingExpense(null); // Sale del modo de edición
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleClearAll = () => {
    localStorage.removeItem("people");
    localStorage.removeItem("expenses");
    setPeople([]);
    setExpenses([]);
  };

  // Función para cambiar el tema
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleExportData = () => {
    // 1. Crear el objeto de datos a exportar
    const data = {
      people: people,
      expenses: expenses,
    };

    // 2. Convertir el objeto a una cadena JSON
    const jsonData = JSON.stringify(data, null, 2);

    // 3. Crear un objeto Blob con el JSON
    const blob = new Blob([jsonData], { type: "application/json" });

    // 4. Crear un enlace temporal para la descarga
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "divisor_gastos_data.json";

    // 5. Simular un clic para iniciar la descarga
    document.body.appendChild(a);
    a.click();

    // 6. Limpiar el objeto URL y el elemento 'a'
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          // 1. Leer y parsear el contenido del archivo
          const importedData = JSON.parse(e.target.result);

          // 2. Actualizar los estados de la aplicación con los datos importados
          if (importedData.people && importedData.expenses) {
            setPeople(importedData.people);
            setExpenses(importedData.expenses);

            // 3. Guardar los nuevos datos en localStorage
            localStorage.setItem("people", JSON.stringify(importedData.people));
            localStorage.setItem(
              "expenses",
              JSON.stringify(importedData.expenses)
            );

            alert("¡Datos importados con éxito!");
          } else {
            alert("El archivo no tiene el formato correcto.");
          }
        } catch (error) {
          alert(
            "Error al leer el archivo. Asegúrate de que sea un JSON válido."
          );
          console.error("Error importing file:", error);
        } finally {
          // Limpia el valor del input para permitir la reimportación
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };
      // Leer el archivo como texto
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100  dark:bg-gray-900 ransition-colors duration-300 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold dark:text-white">
            Divisor de gastos
          </h1>
          {/* Botón de toggle del modo oscuro */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-300"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? (
              <FaSun className="w-6 h-6" />
            ) : (
              <FaMoon className="w-6 h-6" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <PeopleManager people={people} onAddPerson={handleAddPerson} />
            <ExpenseForm
              people={people}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              editingExpense={editingExpense}
              setEditingExpense={setEditingExpense}
            />
          </div>

          <div className="space-y-8">
            <SettlementView people={people} expenses={expenses} />
            <ExpenseList
              expenses={expenses}
              people={people}
              onEdit={handleEditExpense}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row justify-center items-center space-x-0 md:space-x-4 space-y-4 md:space-y-0">
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Limpiar Todo
          </button>
          <button
            onClick={() => {
              setExpenses([]);
              localStorage.removeItem("expenses");
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Limpiar Gastos
          </button>
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Exportar a JSON
          </button>
          <label
            htmlFor="import-file"
            className="cursor-pointer px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Importar desde JSON
            <input
              id="import-file"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportData}
              ref={fileInputRef}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default App;
