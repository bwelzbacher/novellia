# Novellia — Pet Medical Records

An app for managing pet medical records: add/view/edit/delete pets and
their medical records, with filtering support. Backend is NestJS +
PostgreSQL + Prisma; frontend is Angular + Angular Material.

## Quick start

Requires Docker and Docker Compose.

```bash
make up
```

This builds both images, starts Postgres, runs pending Prisma migrations,
and starts:

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:3000`

Optionally load some sample data:

```bash
make seed
```

Check the API's alive:

```bash
curl http://localhost:3000/health
```

Other commands: `make down`, `make logs`, `make restart`, `make clean`
(also drops the database volume). Run `make` with no target to see them
all, or open the [Makefile](Makefile).

### Without Docker

Backend:

```bash
cd backend
npm install
cp .env.example .env   # point DATABASE_URL at a Postgres instance you run yourself
npx prisma migrate deploy
npm run start:dev
```

Frontend (requires Node 22+):

```bash
cd frontend
npm install
npm start   # http://localhost:4200
```

## Project layout

```
backend/                 NestJS API
  prisma/schema.prisma    Data model (source of truth)
  prisma/migrations/       SQL migrations
  prisma/seed.ts            Sample data
  src/pets/                  Pet CRUD + filtering
  src/medical-records/        Medical record CRUD + filtering
  src/prisma/                  PrismaService wrapper
frontend/                Angular + Material app
  src/app/app.routes.ts    Routes: '' -> dashboard, 'pets/:id' -> pet-profile
  src/app/pages/            Dashboard, PetProfile
docker-compose.yml       Postgres + backend + frontend
Makefile                 Local dev commands
```

## Data model

**Pet** — `name`, `species`, `breed`, `dateOfBirth`, `sex`, `weightKg`,
`microchipId`, `ownerName`, `ownerEmail`, `ownerPhone`.

**MedicalRecord** — belongs to a `Pet` (cascade delete), `recordType`
(vaccination, condition, lab result, prescription, procedure, allergy,
wellness exam, note), `title`, `visitDate`, `providerName`, `clinicName`,
`sourceSystem`, `description`.

`species`, `sex`, and `recordType` are plain string columns, not database
enums — constrained instead by TypeScript union types
([pet.types.ts](backend/src/pets/pet.types.ts),
[medical-record.types.ts](backend/src/medical-records/medical-record.types.ts))
enforced at the API boundary via `class-validator`. This keeps the
controlled vocabulary extensible without a migration — useful for a system
meant to normalize records arriving from many different upstream sources.

## API

All endpoints are prefixed at the root (`http://localhost:3000`).

### Pets

| Method | Path | Notes |
|---|---|---|
| `POST` | `/pets` | Create a pet |
| `GET` | `/pets` | List pets. Query params: `species`, `name` (partial, case-insensitive) |
| `GET` | `/pets/:id` | Get one pet |
| `PATCH` | `/pets/:id` | Partial update |
| `DELETE` | `/pets/:id` | Delete (cascades to its medical records) |

### Medical records

| Method | Path | Notes |
|---|---|---|
| `POST` | `/medical-records` | Create a record (`petId` must reference an existing pet) |
| `GET` | `/medical-records` | List records. Query params: `petId`, `recordType`, `visitDateFrom`, `visitDateTo`, `search` (matches `title`/`description`) |
| `GET` | `/medical-records/:id` | Get one record |
| `PATCH` | `/medical-records/:id` | Partial update |
| `DELETE` | `/medical-records/:id` | Delete |

Example:

```bash
curl -X POST http://localhost:3000/pets \
  -H 'Content-Type: application/json' \
  -d '{"name":"Rex","species":"DOG","sex":"MALE","ownerName":"Jamie Chen"}'

curl "http://localhost:3000/medical-records?recordType=VACCINATION&search=rabies"
```

## Testing

```bash
make test
```

Runs the Jest unit test suite against `PetsService` and
`MedicalRecordsService` with a mocked Prisma client — no database required.
End-to-end tests (`npm run test:e2e` inside `backend/`) exercise the real
HTTP layer and expect a running Postgres (`make up` first).

```bash
make test-frontend
```

Runs the Angular unit tests (Vitest). Requires Node 22+.

## Design notes / things I'd revisit with more time

- **No auth** — out of scope for now; would add JWT-based auth scoped per
  clinic/owner before this went anywhere near real data.
- **Owner is inline on `Pet`**, not a separate normalized entity — kept
  scope to the two resources described (pet record, medical record). Worth
  splitting out if owners need their own lifecycle (e.g. one owner with
  multiple pets, contact history).
- **`sourceSystem` on `MedicalRecord`** is a free-text field standing in for
  the "integrates with many upstream systems" premise, without building
  real integrations.
