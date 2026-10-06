# SIAKAD Architecture

## System boundary

The Public Website/PMB, Student Portal, and Backoffice Portal are separate Next.js applications. All three call the same versioned SIAKAD API. No frontend connects to PostgreSQL or contains a database client.

```text
Public Website / PMB (:3002) ─┐
Student Portal (:3000) ────────┼──> SIAKAD API (NestJS, /api/v1)
Backoffice (:3001) ────────────┘            |
                                            v
Application modules and API adapters
      |
      v
Prisma
      |
      v
PostgreSQL

```

## Applications

- **Student Portal**: Next.js App Router at port `3000`; reserved for the student experience.
- **Backoffice Portal**: Next.js App Router at port `3001`; reserved for operational and management workflows.
- **Public Website / PMB**: Next.js App Router at port `3002`; public institutional information and the future applicant registration entry point.
- **API**: NestJS REST API at port `4000`, with the global prefix `/api/v1`. The API is the only layer that accesses the database.

## Database

PostgreSQL 16 is the development database. Prisma schema lives in `prisma/schema.prisma`; the API owns the generated Prisma client integration in `apps/api`. The schema includes users, roles, permissions, applicants, applications, student academic profiles, study programs, lecturers, curricula, courses and prerequisites, class offerings and schedules, KRS, grades, attendance, graduation rules/evaluations, ceremony periods/registrations, and academic calendar events. Academic relations use database foreign keys and explicit join models where a relationship is many-to-many.

The authenticated academic API controllers, server-side permission checks, and database migration have not been implemented yet. Back Office academic screens currently use a clearly labeled browser-local demo workspace; those records are not production data and do not connect to PostgreSQL. Do not use the demo adapter for operational data.

Back Office bulk-import screens cover students, lecturers, study programs, curricula, courses, class offerings, schedules, KRS, grades, meeting attendance, graduation evaluations, ceremony participants, and academic calendar events. KHS/transcripts are derived outputs and ceremony periods are master records, so neither is imported. XLSX templates are generated from the module import configuration; CSV is accepted for single-sheet modules. The upload limit is `NEXT_PUBLIC_IMPORT_MAX_FILE_SIZE_BYTES` (10 MiB default) and can be set in `apps/backoffice/.env`.

Import preview, partial row results, and import history currently use browser-local demo storage. UI permission codes are defined per module, but they are not a security boundary until authenticated API RBAC and database-backed import/audit endpoints exist. Attendance currently validates positive meeting numbers and that the date matches a scheduled weekday; an authoritative dated class-meeting catalog is not modeled yet.

## Applicant and student lifecycle

`User` is the authentication identity and is not synonymous with an applicant or a student. An account may have an optional one-to-one Applicant profile. An Applicant may have multiple Applications and, after acceptance, at most one Student profile. Student reaches the same account through its Applicant relation rather than duplicating a user ID. A Student references one unique source Application, so that application cannot be converted twice.

```text
User + APPLICANT role <-> Applicant -> Application(s) -> accepted application
                         |                               |
                         |                               v
                         +---------------------------> Student
User + STUDENT role ------------------------------------^
```

Applicant and application records remain after conversion. Future application logic must verify that the source application is accepted and belongs to that Applicant, then create the Student profile and grant the `STUDENT` role to the Applicant's User atomically. Public applicant registration must not grant `STUDENT`. The schema provides the relationships and uniqueness constraints; the acceptance gate belongs in the API application layer and is not implemented yet.

## Authentication and authorization boundary

Authentication and authorization are centralized in the API. The portals will consume API-issued access and refresh tokens; they must not implement separate authentication business rules. Authorization will be enforced server-side using roles and permissions. The current Back Office username/password demo session is browser-local, and the API does not yet implement those flows or academic endpoints. The demo role display is not a security boundary.

## Monorepo

- `apps/student`: Student Next.js portal.
- `apps/backoffice`: Backoffice Next.js portal.
- `apps/website`: Public website and future applicant/PMB entry point.
- `apps/api`: NestJS API and Prisma service adapter.
- `packages/ui`: shared UI primitives consumed by both portals.
- `prisma`: database schema and Prisma CLI input.
- `docs`: architecture and future project documentation.

NPM workspaces manage packages, and Turborepo orchestrates development, build, lint, and typecheck tasks.

## Local ports and workflow

| Service | Port |
| --- | --- |
| Student Portal | 3000 |
| Backoffice Portal | 3001 |
| Public Website / PMB | 3002 |
| API | 4000 |
| PostgreSQL | 5432 |

Copy `.env.example` to `.env`, install with `npm install`, start PostgreSQL with `docker compose up -d postgres`, then run `npm run dev`. Database migrations and all business features are separate development steps.