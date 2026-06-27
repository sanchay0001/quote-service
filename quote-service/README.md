# Quote Service — Backend Internship Assignment

Node.js + TypeScript + Express backend that integrates with a FastAPI document analysis service.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Language | TypeScript (strict) |
| Framework | Express.js |
| ORM | Prisma |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Validation | Zod v4 |
| HTTP client | Axios |
| Logging | Winston + Morgan |

---

## Project Structure

```
src/
├── controllers/     — Request/response handling only
├── routes/          — Express router definitions
├── services/        — Business logic (quote workflow, FastAPI calls)
├── repositories/    — Database access via Prisma
├── models/          — Zod schemas and TypeScript types
├── middleware/       — requestId, logging, error handler
└── utils/           — logger, prisma client, custom errors
prisma/
├── schema.prisma    — DB schema (QuoteRequest + AnalysisResult)
└── seed.ts          — Sample data seed
```

---

## Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, FASTAPI_URL
```

### 3. Setup database
```bash
npx prisma generate
npx prisma db push       # or: npx prisma migrate dev
```

### 4. Run in development
```bash
# With mock FastAPI (no real FastAPI needed):
MOCK_FASTAPI=true npm run dev

# With real FastAPI:
npm run dev
```

### 5. Build for production
```bash
npm run build
npm start
```

---

## API Reference

Base URL: `http://localhost:3000`

### `GET /health`
Returns service status.

---

### `GET /quotes`
Returns all quotes with pagination and optional filtering.

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Results per page (max 100) |
| `search` | string | — | Search in customer/project name |
| `status` | string | — | Filter by status |

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

---

### `GET /quotes/:id`
Returns a single quote with its analysis result.

---

### `POST /quotes`
Create a new quote.

**Body:**
```json
{
  "customer": "ABC Corp",
  "project": "Office Renovation",
  "estimated_value": 150000,
  "status": "New"
}
```

**Validations:** customer required, project required, estimated_value ≥ 0, status must be valid enum.

---

### `POST /quotes/:id/analyze`
Triggers FastAPI document analysis for a quote. Saves and returns combined result.

**Response:**
```json
{
  "success": true,
  "data": {
    "quote": { ... },
    "analysis": {
      "risk": "Medium",
      "confidence": 91,
      "missing_items": ["Structural drawings"],
      "analyzed_at": "2026-06-27T..."
    }
  }
}
```

---

### `PATCH /quotes/:id/status`
Update the status of a quote.

**Body:**
```json
{ "status": "In Review" }
```

**Allowed values:** `New`, `In Review`, `Needs Info`, `Completed`

---

## Error Responses

All errors follow this shape:
```json
{
  "success": false,
  "error": {
    "message": "Quote with id 'xyz' not found",
    "statusCode": 404,
    "requestId": "uuid-here"
  }
}
```

| Code | Scenario |
|---|---|
| 400 | Validation error |
| 404 | Quote not found |
| 502 | FastAPI unavailable / returned invalid JSON |
| 500 | Database failure / unhandled error |

---

## Bonus Features Implemented

- **Pagination** — `page` + `limit` on `GET /quotes` with meta response
- **Search** — `?search=term` filters customer and project fields
- **Logging middleware** — Morgan HTTP logs piped through Winston, with timestamps
- **Request ID middleware** — Every request gets a UUID (or passes through `X-Request-Id` header), included in all error responses and logs

---

## Design Decisions (Q&A)

**Q1. Why controllers / services / repositories?**
Each layer has one job. Controllers handle HTTP (req/res), services hold business rules, repositories talk to the DB. This makes testing easy — you can unit-test a service by mocking the repository without spinning up Express.

**Q2. If FastAPI takes 30 seconds, should the client wait?**
No. The `POST /quotes/:id/analyze` endpoint should be made async: return a `202 Accepted` immediately with a job ID, run the FastAPI call in a background worker (BullMQ + Redis), and let the client poll `GET /quotes/:id` or receive a webhook. This prevents request timeouts and unblocks the connection pool.

**Q3. If FastAPI returns invalid JSON?**
The `fastapi.service.ts` wraps the call in try/catch. Axios parse failures and unexpected shapes are both caught — a `502 FastAPIError` is thrown with a clear message. The client always gets a structured error response, never a crash.

**Q4. 500,000 quote requests — performance?**
Add DB indexes on `status` and `created_date`, use cursor-based pagination instead of offset, add Redis caching for read-heavy routes, and consider read replicas for analytics queries.

**Q5. Two users updating the same quote simultaneously?**
Use optimistic locking: add a `version` integer to `QuoteRequest`, increment on every update, and include it in the `WHERE` clause. If `rowsAffected = 0`, the update was lost to a race — return `409 Conflict` so the client can retry.

**Q6. Store every analysis or only the latest?**
Store only the latest (using `upsert`). Re-runs are triggered explicitly, and keeping every run would require a history table and more complex queries for "current" state. If audit history is needed later, a separate `analysis_history` table can be added.

**Q7. Where to put business rules?**
In the **service layer**. Controllers only translate HTTP to function calls. Repositories only do DB I/O. Services own the logic (status transitions, triggering analysis, validation beyond schema). This keeps rules testable and independent of transport or persistence.
