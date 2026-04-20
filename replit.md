# Workspace

## Overview

Royal Karahi Stock Inventory Management System — a full-stack production-ready web application for ROYAL KARAHI restaurant.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui

## Application Features

### Admin (login: Royal / Admin786)
- Dashboard with inventory summary, low stock alerts, recent transactions
- Category & Subcategory management (create/delete)
- Daily and date-range stock reports with PDF export (browser print)
- User account management (create/delete users with role assignment)
- Low stock items highlighted in red (quantity < 10)

### Staff (login: staff1 / staff123)
- Simple inventory view with search
- Categories and subcategories with current stock levels
- IN/OUT transaction buttons with quantity dialog
- Low stock indicators

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (auth, inventory, transactions, reports)
│   └── royal-karahi/       # React frontend (admin dashboard + staff inventory)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── users.ts       # users table
│           ├── categories.ts  # categories + subcategories tables
│           └── transactions.ts # transactions table
```

## Default Credentials

- **Admin**: username `Royal`, password `Admin786`
- **Staff**: username `staff1`, password `staff123`

## API Routes

All routes under `/api`:
- `POST /auth/login` — login
- `GET /auth/me` — current user (auth required)
- `GET /categories` — list all categories with subcategories
- `POST /categories` — create category (admin)
- `DELETE /categories/:id` — delete category (admin)
- `POST /subcategories` — create subcategory (admin)
- `DELETE /subcategories/:id` — delete subcategory (admin)
- `GET /inventory` — list inventory with stock (auth)
- `GET /inventory/low-stock` — items below 10 units (auth)
- `GET /inventory/summary` — aggregate stats (auth)
- `POST /transactions` — log IN/OUT transaction (auth)
- `GET /transactions/recent` — last 20 transactions (auth)
- `GET /reports/daily?date=YYYY-MM-DD` — daily report (admin)
- `GET /reports/range?from=YYYY-MM-DD&to=YYYY-MM-DD` — range report (admin)
- `GET /users` — list users (admin)
- `POST /users` — create user (admin)
- `DELETE /users/:id` — delete user (admin)
