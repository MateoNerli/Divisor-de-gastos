export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
  date: string;
}

export interface Person {
  id: string;
  name: string;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}