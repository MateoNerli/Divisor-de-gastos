import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Divisor de gastos",
  description: "Divisor de gastos con grupos, eventos y balances.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-100 text-gray-900">
        {children}
      </body>
    </html>
  );
}
