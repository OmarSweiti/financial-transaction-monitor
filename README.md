# Financial Transaction Monitor Dashboard

A comprehensive, production-ready full-stack application built to monitor, manage, and analyze financial transactions. The project consists of a type-safe **NestJS** backend integrated with **Prisma ORM** and **PostgreSQL**, and a highly interactive, responsive **Next.js** frontend built with **shadcn/ui**, **Tailwind CSS**, **React Query**, and **Recharts**.

---

## 🏗️ Architecture & Tech Stack

This repository is structured as a monorepo containing both the backend and frontend components.

```mermaid
graph TD
    Client[Next.js Frontend / Client]
    Nest[NestJS Backend / API]
    Postgres[(PostgreSQL Database)]
    Prisma[Prisma ORM]

    Client -- HTTP Requests / TanStack Query --> Nest
    Nest -- Prisma Client --> Prisma
    Prisma -- Query Execution --> Postgres
```

### Backend (`/backend1`)
- **Framework:** [NestJS](https://nestjs.org/) (v11.x) - Standardized, modular structure for reliable APIs.
- **ORM:** [Prisma](https://www.prisma.io/) (v7.x) - Type-safe database client and automated migrations.
- **Database:** PostgreSQL (v16.x) running in Docker.
- **Validation:** `class-validator` & `class-transformer` for strict input schema enforcement.
- **Rules Engine:** Dynamic NestJS Interceptor to catch and flags potential fraudulent transactions (> 5,000) before persistence.

### Frontend (`/frontend1`)
- **Framework:** [Next.js App Router](https://nextjs.org/) (v16.x) & React 19.
- **Styling & Components:** [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) for a sleek, modern, glassmorphic design system.
- **State Management & Data Fetching:** [TanStack React Query v5](https://tanstack.com/query) for caching, optimistic updates, and background synchronization.
- **Charts:** [Recharts](https://recharts.org/) for beautiful, responsive transaction volume metrics grouped by status.
- **Forms:** `react-hook-form` & `zod` for client-side form validation and type safety.

---

## ✨ Key Features

1. **Dashboard Analytics:** Displays transaction volumes (aggregated sum, not just transaction counts) categorized by status using high-quality visual charts.
2. **Transaction Directory:** Interactive table with full pagination, quick status filtering, and a debounced text search matching transaction descriptions.
3. **Transaction Creation:** Complete modal drawer/form enabling users to add new transactions with dynamic validation checks (currency codes, amounts, specific status classes).
4. **Automated Fraud Review:** Any transaction with a transaction amount strictly greater than **5,000** (regardless of user-specified status) is intercepted and forced to `PENDING_REVIEW` to prevent un-audited high-value movement.
5. **Robust Database Design:** PostgreSQL index configurations for optimized sort feeds (Recent Transactions, status filters, and currencies).
6. **Graceful Application Handling:** Complete API error handling, graceful shutdown hooks, and soft-delete capabilities (`deletedAt`) to protect transactional history.

---

## 🚀 Getting Started

### 📋 Prerequisites

Before running the application, make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v20.x or higher)
- [Docker & Docker Compose](https://www.docker.com/) (For launching the database)
- [npm](https://www.npmjs.com/) (bundled with Node.js)

---

### 1. 🗄️ Run the Database (Docker)

At the root directory of the repository, start the PostgreSQL container using Docker Compose:

```bash
docker compose up -d
```

This will run PostgreSQL in the background on port `5432` with the credentials:
- **User:** `postgres`
- **Password:** `postgres`
- **Database:** `financial_monitor_db`

---

### 2. 🔌 Setup & Run the Backend

Navigate to the `backend1` directory:

```bash
cd backend1
```

#### Install Dependencies
```bash
npm install
```

#### Configure Environment Variables
Copy the provided example environment file and adjust values if needed:

```bash
cp .env.example .env
```

The defaults in `.env.example` match the Docker Compose credentials and work out of the box for local development. See the [Environment Variables](#-environment-variables) section below for a full reference.

#### Run Database Migrations & Generate Prisma Client
Push the schema to your local PostgreSQL database and generate the Prisma Client bindings:

```bash
npx prisma migrate dev --name init
```

#### Seed the Database
Populate the database with 20+ realistic mock transactions (with mixed statuses, dates, currencies, and high-value transactions that test the fraud interceptor):

```bash
npm run seed
```

#### Start the Server
Start the NestJS backend in development mode:

```bash
npm run start:dev
```

The API will now be running at [http://localhost:3000](http://localhost:3000).

---

### 3. 💻 Setup & Run the Frontend

Navigate to the `frontend1` directory:

```bash
cd ../frontend1
```

#### Install Dependencies
```bash
npm install
```

#### Configure Environment Variables
Copy the provided example environment file:

```bash
cp .env.example .env.local
```

> **Note:** The `NEXT_PUBLIC_API_URL` variable is **required**. The app will refuse to start without it. See the [Environment Variables](#-environment-variables) section below for details.

#### Start the Development Server
```bash
npm run dev
```

Next.js will detect that port `3000` is currently being used by the NestJS API and will automatically run on **[http://localhost:3001](http://localhost:3001)**. Open this link in your browser to view the application.

---

## 📡 API Reference

The backend API handles all requests at `http://localhost:3000`.

### Transactions Resource

| Method | Endpoint | Description | Query Parameters / Payload |
| :--- | :--- | :--- | :--- |
| **GET** | `/transactions` | List/Filter Transactions | Supports pagination (`?page=1&limit=10`), search (`?search=`), and status filtering (`?status=COMPLETED`) |
| **POST** | `/transactions` | Create a Transaction | Payload: `{ amount, currency, date, description, status }` |
| **GET** | `/transactions/:id` | Get Transaction Details | Returns full transaction object |
| **PATCH**| `/transactions/:id` | Update a Transaction | Payload: Partial update object |

#### Fraud Rule Interceptor Action
When calling `POST /transactions` with an `amount` greater than `5000` (e.g. `5001.00`), the `FraudInterceptor` will intercept the request payload and overwrite the `status` to `PENDING_REVIEW` before saving it to the database.

---

## 🧪 Development Commands & Testing

### Backend Commands
- **Linting:** `npm run lint` — Runs ESLint rules.
- **Formating:** `npm run format` — Cleans up styling using Prettier.
- **Unit Tests:** `npm run test` — Executing NestJS business logic unit tests.
- **E2E Tests:** `npm run test:e2e` — Integration test suite.

### Frontend Commands
- **Linting:** `npm run lint` — Checks for ESLint errors.
- **Production Build:** `npm run build` — Compiles optimized production package.
- **Production Run:** `npm run start` — Boots compiled bundle locally.

---

## 🔐 Environment Variables

Both projects ship with a `.env.example` file that is tracked in Git. Real `.env` / `.env.local` files are **gitignored** and must be created locally.

### Backend (`backend1/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string used by Prisma. Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE` |
| `PORT` | ❌ | `3000` | Port the NestJS API server listens on. |
| `NODE_ENV` | ❌ | — | Set to `development` to enable verbose Prisma query logging. |

### Frontend (`frontend1/.env.local`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | ✅ | — | Base URL of the NestJS backend API. Must match the backend `PORT`. |

> **Important:** The frontend will throw a startup error if `NEXT_PUBLIC_API_URL` is not defined. This is intentional to prevent silent misconfigurations.

---

## 📁 Repository Structure

```text
financial-transaction-monitor/
├── backend1/                   # NestJS Application
│   ├── .env.example            # ⬅ Environment template (copy to .env)
│   ├── prisma/                 # Prisma DB Schemas, Migrations & Seeds
│   │   ├── schema.prisma       # Database design
│   │   └── seed.ts             # 20+ realistic mock items
│   ├── src/
│   │   ├── prisma/             # Prisma client setup module
│   │   ├── transactions/       # Core transaction business module
│   │   │   ├── dto/            # Request payloads & query validation DTOs
│   │   │   ├── enums/          # Shared status definitions
│   │   │   ├── interceptors/   # FraudInterceptor logic
│   │   │   ├── transactions.controller.ts
│   │   │   └── transactions.service.ts
│   │   └── main.ts             # Application entrypoint
│   └── package.json
├── frontend1/                  # Next.js Frontend App
│   ├── .env.example            # ⬅ Environment template (copy to .env.local)
│   ├── app/                    # Next.js pages & root layout
│   ├── components/
│   │   ├── transactions/       # Feature-specific dashboard components
│   │   │   ├── status-badge.tsx
│   │   │   ├── transaction-dialog.tsx
│   │   │   ├── transaction-filters.tsx
│   │   │   ├── transaction-stats.tsx
│   │   │   ├── transaction-table.tsx
│   │   │   └── transaction-volume-chart.tsx
│   │   └── ui/                 # Reusable shadcn component layer
│   ├── lib/                    # HTTP clients & utilities
│   └── package.json
├── docker-compose.yaml         # PostgreSQL services config
├── AI_LOG.md                   # Audit log tracking AI development assistance
└── README.md                   # Project instructions handbook (This file)
```
