# Divisor de gastos
App web para dividir gastos con grupos, eventos y balances.

Stack: Next.js (App Router), Prisma y Postgres (Vercel Postgres).

## Funcionalidades
- Registro/login con email y password
- Grupos, miembros e invitaciones por link
- Eventos con participantes
- Gastos con categorias, monedas y splits (igual, monto exacto, porcentaje)
- Balances por evento y resumen por categoria

## Setup
1. Copia `.env.example` a `.env` y completa `DATABASE_URL` y `AUTH_SECRET`.
2. `npm install`
3. `npm run db:migrate`
4. `npm run dev`

## Scripts
- `npm run dev`: entorno local
- `npm run db:migrate`: migraciones Prisma
- `npm run db:generate`: genera Prisma Client
