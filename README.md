# OrderLine SaaS

Multi-tenant order management built with **Next.js 16**, **PostgreSQL**, **Prisma 7**, and **Auth.js**.

## Features

- **Auth** — register (creates org + OWNER), login/logout, JWT sessions, password reset, change password
- **Tenant context** — org-scoped data, org switcher, RBAC (`OWNER` / `ADMIN` / `MEMBER`)
- **Audit log** — tenant activity feed on dashboard + `/activity` (search/filter)
- **Customers** — CRUD, search/sort/pagination, archive, tags, addresses, CSV export
- **Products** — CRUD, SKU uniqueness, pricing/cost, stock tracking, categories, archive, CSV export
- **Orders** — line items, auto order numbers, status workflow + history, duplicate, stock decrement, CSV export
- **Settings** — org profile, invite/add members, role updates, password change
- **Dashboard** — KPIs, pipeline, recent orders, low-stock alerts, activity feed

## Quick start (local PostgreSQL)

Requires a local PostgreSQL install (this project targets the Windows PostgreSQL service, not Docker).

```bash
npm install
cp .env.example .env   # keep DATABASE_URL + set AUTH_SECRET

# One-time: create orderline role + database (prompts for postgres superuser password)
npm run db:setup

# Push Prisma schema
npm run db:push

npm run dev
```

- App: http://localhost:3000  
- Seed demo login: `npm run db:seed`

**Demo login**
- Email: `demo@orderline.app`
- Password: `Demo1234!`

Default app connection string:

```env
DATABASE_URL="postgresql://orderline:orderline@localhost:5432/orderline?schema=public"
```

If you prefer the `postgres` superuser instead, update `DATABASE_URL` accordingly and create an `orderline` database first.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run db:setup` | Create local `orderline` role + database |
| `npm run db:push` | Push schema to PostgreSQL |
| `npm run db:migrate` | Migrations |
| `npm run db:studio` | Prisma Studio |

## Stack notes

- Prisma Client: `src/lib/db.ts` (`@prisma/adapter-pg`)
- Auth: `src/auth.ts` + middleware protection
- Tenant/RBAC: `src/lib/tenant.ts`, `src/lib/permissions.ts`
- Domain actions: `src/lib/actions/*`
