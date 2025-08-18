import * as React from "react";

//quien debe pagar
export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
  date: string;
}

//persona
export interface Person {
  id: string;
  name: string;
}

//gasto
export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface SettlementViewProps {
  people: Person[];
  expenses: Expense[];
}

export interface PeopleManagerProps {
  people: Person[];
  onAddPerson: (person: Person) => void;
}

export interface ExpenseListProps {
  expenses: Expense[];
  people: Person[];
  onEdit: (expense: Expense) => void;
}

export interface ExpenseFormProps {
  people: Person[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  editingExpense: Expense | null;
  setEditingExpense: (expense: Expense | null) => void;
}

//para el input
export interface TextInputProps {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

//para el select
export interface PaidBySelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  people: { id: string; name: string }[];
}
