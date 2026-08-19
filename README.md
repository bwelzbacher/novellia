# Novellia — Pet Medical Records

An app for managing pet medical records: pets, vet visits (appointments,
vaccines, prescriptions), standalone conditions and allergies, and
AI-assisted extraction of new records from an uploaded document. Backend is NestJS + PostgreSQL + Prisma; frontend
is Angular + Angular Material.

## Tools & AI assistance

Built with **Claude Code** as my primary AI pair for most of this —
architecture and data model decisions, the NestJS/Angular implementation,
refactors, tests, seed data, and this README were all done in
collaboration with it rather than solo. I reviewed and directed every
change; "I typed every line myself" wouldn't be honest, and neither would
"an AI built this unsupervised" — it was closer to pairing with a fast
collaborator who still needed direction, correction, and a second look at
every decision, especially around the data model.

The rest of the stack, briefly:

- **NestJS + Prisma + PostgreSQL** for the backend — my default for a
  typed API over a relational schema. Prisma's migration workflow made the
  data model's many rounds of iteration far less error-prone than
  hand-written SQL would have been.
- **Angular + Angular Material** for the frontend — this is what I know
  best after 8 years mostly in frontend, and Material meant not having to
  hand-build a date picker, a bottom sheet, or an accessible dropdown. The
  cost is bundle size, noted below.
- **Anthropic's Claude API** — The document-extraction flow vet summary, review a draft, save calls Claude directly to parse the document.
- **Docker Compose** for local dev parity between Postgres and the two
  services.

## Quick start

Requires Docker and Docker Compose.

```bash
make up
```

This builds both images, starts Postgres, runs pending Prisma migrations,
and starts:

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:3000`

The document-extraction feature calls the Claude API and needs a key.
Copy `backend/.env.example` to `backend/.env` and set `ANTHROPIC_API_KEY`
before running `make up` — Compose reads it from that file directly.
Everything else works without it.

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
backend/                      NestJS API
  prisma/schema.prisma          Data model (source of truth)
  prisma/migrations/             SQL migrations
  prisma/seed.ts                   Sample data generator
  src/pets/                          Pet CRUD + pagination/filtering
  src/medical-records/                 Visit CRUD (appointment/vaccine/medication)
  src/conditions/                        Condition CRUD
  src/allergies/                           Allergy CRUD
  src/vet-records/                           Vet office CRUD
  src/record-extraction/                       Claude-based document extraction
  src/prisma/                                    PrismaService wrapper
frontend/                     Angular + Material app
  src/app/pages/                 Dashboard, PetProfile (+ record-tabs/ for
                                    each medical-data tab), RecordDetail,
                                    ConditionDetail, VaccineDetail
  src/app/pages/**/*.store.ts      Component-scoped signal stores — each
                                      page owns its data fetch + mutations
  src/app/components/sheets/         Bottom sheets for every create/edit form
  src/app/services/                    Thin HTTP clients, one per resource
docker-compose.yml            Postgres + backend + frontend
Makefile                      Local dev commands
```

## Data model

A pet's medical history is modeled as a set of **visits**
(`MedicalRecord`), each optionally attaching one appointment plus any
number of vaccines and medications — a visit doesn't have to be all three.
`Condition` and `Allergy` are standalone, pet-level entities rather than
owned by a single visit, since a chronic condition is meant to be tracked
across many visits over time; appointments and medications reference a
condition optionally instead of containing one.

- **Pet** — `name`, `species`, `breed`, `dateOfBirth`, `sex`, `weightLbs`,
  `microchipId`, `ownerName`/`ownerEmail`/`ownerPhone`, `isActive` (soft
  deactivation, not a delete — see below).
- **VetRecord** — a clinic. Reusable across many visits and pets.
- **MedicalRecord** — a visit. `vetRecordId` is optional (an OTC
  medication doesn't require a clinic visit), `date`, `sourceSystem`.
- **AppointmentRecord** — at most one per visit. `time`, `vet` (name,
  optional — some visits aren't tied to a specific vet), `reason`,
  `weightLbs`/`temperatureF`, an optional `conditionId`, and any number of
  typed `AppointmentNote` rows (staff / discharge / personal / care plan /
  other).
- **VaccineRecord** / **MedicationRecord** — belong to a visit, not
  necessarily its appointment. A medication also carries its own `status`
  (active/completed/discontinued) independent of any linked condition's
  status — a medication can be discontinued without the condition itself
  being resolved.
- **Condition** / **Allergy** — belong to a pet directly.

`species`, `sex`, condition `status`, medication `status`, allergy
`severity`, and appointment-note `type` are plain string columns, not
database enums — constrained instead by TypeScript union types under
`backend/src/*/*.types.ts`, enforced at the API boundary via
`class-validator`. This keeps the controlled vocabulary extensible without
a migration.

**Deletes are soft** across every child table (`deleted: boolean`, hidden
from reads, never removed) — deleting a visit cascades to the
vaccines/medications/notes it exclusively owns, but deleting a condition
only unlinks the appointments/medications that reference it, since those
records aren't owned by it. `Pet` uses `isActive`/`inactiveReason` instead
of a `deleted` flag for the same soft-delete purpose. The foreign keys
underneath do support a real hard-delete cascade from `Pet` down through
everything, it's just not an exposed action in the app today.

## API

All endpoints are prefixed at the root (`http://localhost:3000`).

### Pets

| Method | Path | Notes |
|---|---|---|
| `POST` | `/pets` | Create a pet |
| `GET` | `/pets` | Paginated list. Query params: `species`, `name` (partial, case-insensitive), `page` |
| `GET` | `/pets/:id` | Get one pet |
| `PATCH` | `/pets/:id` | Partial update |
| `DELETE` | `/pets/:id` | Deactivate (`isActive: false`) — not a delete |
| `POST` | `/pets/:id/photo` | Upload a profile photo (multipart, field `photo`) |

### Medical records (visits)

| Method | Path | Notes |
|---|---|---|
| `POST` | `/medical-records` | Create a visit — `petId` required; `appointment`, `vaccineRecords`, `medicationRecords` all optional |
| `GET` | `/medical-records` | List. Query params: `petId`, `vetRecordId`, `dateFrom`, `dateTo`, `search` (matches vaccine/medication names and appointment reason) |
| `GET` | `/medical-records/:id` | Get one visit, with its appointment/vaccines/medications |
| `PATCH` | `/medical-records/:id` | Partial update; `vaccineRecords`/`medicationRecords` replace the existing set when provided |
| `DELETE` | `/medical-records/:id` | Soft-deletes the visit and cascades to its vaccines/medications/notes |
| `DELETE` | `/medical-records/vaccines/:id` | Soft-delete one vaccine |
| `DELETE` | `/medical-records/medications/:id` | Soft-delete one medication |
| `DELETE` | `/medical-records/notes/:id` | Soft-delete one appointment note |
| `PATCH` | `/medical-records/appointments/:id/set-condition` | Link an appointment to a condition |
| `PATCH` | `/medical-records/appointments/:id/remove-condition` | Unlink |
| `PATCH` | `/medical-records/medications/:id/set-condition` | Link a medication to a condition |
| `PATCH` | `/medical-records/medications/:id/remove-condition` | Unlink |

### Conditions / Allergies / Vet records

Same CRUD shape for all three — `POST`, `GET` (list, filtered), `GET /:id`,
`PATCH /:id`, `DELETE /:id` (soft-delete for conditions/allergies, hard
delete for vet records, which have no soft-delete flag). List filters:
conditions take `petId`/`status`/`search`; allergies take
`petId`/`severity`/`search`; vet records take `officeName`.

### Record extraction

| Method | Path | Notes |
|---|---|---|
| `POST` | `/record-extraction?petId=...` | Multipart upload, field `document` (PNG/JPEG/WEBP/GIF/PDF, max 10MB). Returns a draft record for the client to review/edit — doesn't persist anything itself. The client submits the reviewed draft through the normal `POST /medical-records` / `POST /conditions` endpoints. |

Example:

```bash
curl -X POST http://localhost:3000/pets \
  -H 'Content-Type: application/json' \
  -d '{"name":"Rex","species":"DOG","sex":"MALE","ownerName":"Jamie Chen"}'

curl "http://localhost:3000/medical-records?search=rabies"
```

## Testing

```bash
make test
```

Runs the Jest unit test suite (`PetsService`, `MedicalRecordsService`,
`ConditionsService`, `AllergiesService`, `VetRecordsService`,
`RecordExtractionService`) with a mocked Prisma client — no database
required. End-to-end tests (`npm run test:e2e` inside `backend/`) exercise
the real HTTP layer and expect a running Postgres (`make up` first).

```bash
make test-frontend
```

Runs the Angular unit tests (Vitest). Requires Node 22+.

## Design notes / things I'd revisit with more time

- **No auth** — `ownerName`/`ownerEmail`/`ownerPhone` are plain fields on
  `Pet`, not a real account. Under real auth I'd expect a pet to belong to
  an authorized user, with permissions following from that relationship.
- **Dashboard status (missing visit details, upcoming/overdue vaccines and
  appointments)** is computed client-side today by scanning every fetched
  record. That belongs server-side, returned as part of the pet record
  itself, both for correctness at volume and so every client gets it for
  free.
- **Notes aren't a real table** — the Notes view is a client-side
  aggregation of typed appointment notes plus free-text fields on
  vaccines/medications/conditions. A single `Note` model, foreign-keyed to
  whatever record it belongs to, would replace that merge.
- **Pet weight lives in two places** — a static field on `Pet` and a
  per-appointment reading on `AppointmentRecord` — with nothing keeping
  them in sync. Needs one source of truth while still allowing a manual
  entry outside of a visit.
- **Angular Material** covers every form, sheet, and menu in the frontend,
  which is most of why the bundle sits well over Angular's default 500KB
  budget — a deliberate trade of bundle size for not hand-building UI
  primitives, worth revisiting if load time on slow connections mattered.
