# SIAKAD

SIAKAD (Sistem Informasi Akademik) is a centralized academic platform by GLODITECH. This repository is an NPM-workspaces monorepo containing a public website, two separate Next.js portals, and a central NestJS API.

## Architecture

The Public Website, Student, and Backoffice applications communicate with the same versioned API. The API is the only application allowed to access PostgreSQL, through Prisma. Frontend applications do not contain database credentials or database clients.

```text
Public Website / PMB (Next.js :3002) ─┐
Student Portal (Next.js :3000) ───────┼─> SIAKAD API (NestJS :4000) ─> PostgreSQL (:5432)
Backoffice Portal (Next.js :3001) ────┘
```

## Technology

- Next.js App Router, React, TypeScript, Tailwind CSS, shared UI primitives, and Lucide React
- Public institutional website and future PMB entry point
- NestJS REST API, Swagger/OpenAPI, class-validator, and Helmet
- PostgreSQL 16 with Prisma
- NPM workspaces and Turborepo

## Requirements

- Node.js 20.19+ (Node.js 24 LTS recommended)
- NPM 10+
- Docker Desktop or Docker Engine with Compose, for local PostgreSQL

## Installation

From the repository root:

```bash
npm install
```

Copy `.env.example` to `.env`, replace the local database password and JWT placeholders, and keep `.env` out of version control. JWT values are placeholders only; authentication is not implemented in this foundation.

## PostgreSQL and Prisma

Start the development database:

```bash
docker compose up -d postgres
```

Generate the Prisma client:

```bash
npm run db:generate
```

Create/apply a development migration after confirming the local database is running:

```bash
npm run db:migrate
```

Open Prisma Studio with `npm run db:studio`. The foundation schema includes user, role, permission, applicant, application, and student profiles. An Applicant may have multiple Applications and at most one Student profile. Student identity is derived through Applicant rather than storing a duplicate user ID, and each Student references a unique source Application. A future API transaction must require an accepted application belonging to that Applicant before creating a Student profile and assigning the `STUDENT` role. No migration or PMB workflow is included yet.

## Run applications

Run all development servers with `npm run dev`, or start one application:

```bash
npm run dev:student
npm run dev:backoffice
npm run dev:website
npm run dev:api
```

| Application | URL |
| --- | --- |
| SIAKAD Student | http://localhost:3000 |
| SIAKAD Backoffice | http://localhost:3001 |
| SIAKAD Website / PMB | http://localhost:3002 |
| SIAKAD API | http://localhost:4000 |
| API Swagger | http://localhost:4000/api/v1/docs |
| PostgreSQL | localhost:5432 |

The API health endpoint is `GET /api/v1/health`.

## Quality checks

```bash
npm run build
npm run lint
npm run typecheck
```

## Structure

```text
apps/student       Student-facing Next.js portal
apps/backoffice    Administrative Next.js portal
apps/website       Public website and future PMB entry point
apps/api           Central NestJS API and Prisma adapter
packages/ui        Shared UI primitives
prisma             PostgreSQL Prisma schema
docs               Architecture documentation
```

Application feature modules, authentication, and academic workflows are intentionally deferred to later phases.