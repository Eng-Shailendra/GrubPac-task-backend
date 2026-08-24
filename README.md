# TaskFlow Backend

A multi-tenant task-management REST API built with Node.js, Express, PostgreSQL, Prisma, Redis and BullMQ.

## Tech stack

- Node.js v24.13.0
- Express 
- PostgreSQL 
- Prisma
- JWT access/refresh tokens
- bcrypt (cost 12)
- Redis + BullMQ
- Vitest + Supertest
- Swagger UI / OpenAPI
- Docker Compose

## Architecture

```text
Client
  |
  v
Express API
  |
  +--> JWT authentication
  |
  +--> Controllers
          |
          v
       Services
          |
          +--> Prisma --> PostgreSQL
          |
          +--> BullMQ --> Redis --> Worker
```

Every organization is treated as a tenant. Authenticated requests carry `organizationId` in the access token, and project/task services verify that the target resource belongs to that organization before reading or changing it.

## Main API areas

| Area | Endpoints |
|---|---|
| Auth | `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` |
| Projects | `/api/projects` and `/api/projects/:id` |
| Tasks | `/api/tasks` and `/api/tasks/:id` |
| Assignment | `/api/tasks/:taskId/assign` |
| Members | `/api/members` |
| Jobs | `/api/jobs/:id` |
| Swagger | `/api-docs` |

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

### 3. Configure environment

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskflow
PORT=8080
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
REDIS_URL=redis://localhost:6379
```

### 4. Run migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Seed development data

```bash
node src/seed.js
```

Seed users:

```text
alice@taskflow.com   -> org_admin
bob@taskflow.com     -> member
charlie@taskflow.com -> member
david@taskflow.com   -> org_admin
eva@taskflow.com     -> member

Password: Password@123
```

### 6. Start the API

```bash
npm run dev
```

API:

```text
http://localhost:8080
```

Swagger UI:

```text
http://localhost:8080/api-docs
```

### 7. Start the worker

In another terminal:

```bash
npm run worker
```

The worker consumes email notification jobs from BullMQ.

---

# Task 05 - Testing & API Documentation

## Testing strategy

Tests are split into:

```text
tests/
├── unit/
│   ├── auth.test.js
│   ├── task-assignment.test.js
│   └── pagination.test.js
├── integration/
│   └── api.test.js
├── helpers/
│   ├── api.js
│   └── db.js
└── setup.js
```

### Unit tests

Covered:

- Authentication middleware
- Missing/invalid JWT
- Authenticated user context
- Task assignment validation
- Cross-tenant assignment protection
- Invalid assignee
- Duplicate assignment
- Assignment + queue creation
- Pagination defaults
- Pagination bounds and offset calculation

### Integration tests

Covered:

- Login flow
- Invalid login
- Unauthorized requests
- Task create
- Task read
- Task update
- Task soft-delete
- Pagination
- Cross-tenant read -> `403`
- Cross-tenant update -> `403`
- Cross-tenant delete -> `403`
- Cross-tenant task creation -> `403`
- Cross-tenant assignment -> `403`
- Invalid task input -> `400`
- Invalid IDs -> `400`
- Missing resources -> `404`
- Task assignment creates a BullMQ job

## Test isolation

Tests use a dedicated PostgreSQL database and dedicated Redis instance.

Start test infrastructure:

```bash
docker compose -f docker-compose.test.yml up -d
```

Create `.env.test` from `.env.test.example`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/taskflow_test
REDIS_URL=redis://localhost:6380
JWT_ACCESS_SECRET=test-access-secret-change-me
JWT_REFRESH_SECRET=test-refresh-secret-change-me
PORT=8081
```

Apply the Prisma schema to the test database:

```bash
npx prisma migrate deploy
```

Run tests:

```bash
npm test
```

Unit tests only:

```bash
npm run test:unit
```

Integration tests only:

```bash
npm run test:integration
```

Watch mode:

```bash
npm run test:watch
```

Coverage:

```bash
npm run test:coverage
```

Coverage output is generated under:

```text
coverage/
```

> Do not point automated tests at your development or production database. The integration suite truncates all application tables before each test and uses a dedicated test PostgreSQL instance.

## Test database note

Because Prisma reads `DATABASE_URL`, make sure the test command is executed with the test environment loaded.

On PowerShell:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/taskflow_test"
$env:REDIS_URL="redis://localhost:6380"
$env:JWT_ACCESS_SECRET="test-access-secret-change-me"
$env:JWT_REFRESH_SECRET="test-refresh-secret-change-me"
npm test
```

On macOS/Linux:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/taskflow_test \
REDIS_URL=redis://localhost:6380 \
JWT_ACCESS_SECRET=test-access-secret-change-me \
JWT_REFRESH_SECRET=test-refresh-secret-change-me \
npm test
```

---

# API documentation

OpenAPI source files:

```text
docs/openapi.yaml
docs/openapi.json
```

Swagger UI:

```text
http://localhost:8080/api-docs
```

The documentation covers authentication, projects, tasks, assignments, members and jobs.

---

# Postman collection

Import:

```text
postman/TaskFlow.postman_collection.json
```

The collection uses:

```text
{{baseUrl}}
```

with the default value:

```text
http://localhost:8080
```

Login automatically stores the returned access and refresh tokens in collection variables.

No URL or token editing is required for the normal local flow.

## Typical Postman flow

1. Start API.
2. Seed database.
3. Run `Auth -> Login`.
4. Run `Tasks -> List Tasks`.
5. Run `Tasks -> Create Task`.
6. Set `taskId` if testing a specific existing task.
7. Run task read/update/delete/assignment requests.

---

# Multi-tenant security

Tenant isolation is enforced at the service layer.

For example, a task is reached through its project:

```text
Task
 |
 +--> Project
       |
       +--> Organization
```

Before task operations, the service checks:

```text
task.project.organizationId === authenticatedUser.organizationId
```

A mismatch produces:

```http
403 Forbidden
```

This prevents a user from using another organization's task/project ID to read, update, delete or assign resources.

The test suite explicitly verifies these cases.

---

# Authentication

Access tokens:

- JWT
- 15 minute TTL
- Contains `userId`, `organizationId` and `role`

Refresh tokens:

- Random 64-byte value
- SHA-256 hash stored in PostgreSQL
- 7 day expiry
- Rotation on refresh
- Revocation on logout

Passwords:

- bcrypt
- cost factor 12

Authentication endpoints are protected by a rate limiter of 10 requests per minute per IP.

---

# Background jobs

Task assignment performs:

```text
POST /api/tasks/:taskId/assign
             |
             v
      Create assignment
             |
             v
       BullMQ Queue
             |
             v
      Redis / Job
             |
             v
        Email Worker
```

Queue configuration includes:

- 3 attempts
- exponential backoff
- completed-job retention for one hour
- failed-job retention for inspection

The Task 05 integration suite verifies that assigning a task creates the expected `task-assigned` queue job.

---

# Docker

Start the full application:

```bash
docker compose up -d --build
```

Check services:

```bash
docker compose ps
```

Expected services:

```text
postgres
redis
api
worker
```

API:

```text
http://localhost:8080
```

Swagger:

```text
http://localhost:8080/api-docs
```

Stop services:

```bash
docker compose down
```

Stop and remove volumes:

```bash
docker compose down -v
```

> `docker compose down -v` deletes the local PostgreSQL volume and therefore removes local database data.

---

# Useful Prisma commands

Generate client:

```bash
npx prisma generate
```

Apply migrations:

```bash
npx prisma migrate deploy
```

Development migration:

```bash
npx prisma migrate dev
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

# Project structure

```text
.
├── docs/
│   ├── openapi.json
│   └── openapi.yaml
├── postman/
│   └── TaskFlow.postman_collection.json
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── controllers/
│   ├── jobs/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
├── tests/
│   ├── helpers/
│   ├── integration/
│   ├── unit/
│   └── setup.js
├── Dockerfile
├── docker-compose.yml
├── docker-compose.test.yml
├── package.json
├── prisma.config.ts
├── server.js
└── README.md
```

---

# Technical decisions

### PostgreSQL

Used as the primary relational database because TaskFlow has strong relationships between users, organizations, projects, tasks, assignments and comments.

### Prisma

Provides typed database access, migrations and transactions.

### JWT + refresh token storage

Short-lived access tokens reduce exposure. Refresh tokens are stored as SHA-256 hashes so raw refresh tokens are not persisted.

### Service-layer tenant checks

Authorization is enforced close to the data access logic rather than relying only on controllers. This reduces the chance of accidentally exposing a cross-tenant resource through a different route.

### Redis + BullMQ

Background email notifications are asynchronous and retryable without blocking the main API request.

### Dedicated test database

Automated tests never intentionally run against the development database.

### Vitest + Supertest

Vitest handles unit/integration test execution and coverage; Supertest exercises the Express application through HTTP without requiring an external HTTP client.

---

# Task 05 acceptance checklist

- [x] Unit tests for authentication logic
- [x] Unit tests for task assignment validation
- [x] Unit tests for pagination
- [x] Integration login test
- [x] Integration task CRUD tests
- [x] Cross-tenant access tests returning `403`
- [x] Validation/error scenario tests
- [x] Dedicated test database configuration
- [x] Dedicated test Redis configuration
- [x] Swagger/OpenAPI documentation
- [x] Local Swagger UI
- [x] Importable Postman collection
- [x] Coverage command
- [x] Queue-job test for task assignment
- [x] Docker test infrastructure
- [x] README with setup and technical decisions

## Before submission

Run:

```bash
npm install
docker compose up -d
npx prisma migrate deploy
node src/seed.js
npm run dev
```

In another terminal:

```bash
npm run worker
```

Then verify:

```text
http://localhost:8080/api-docs
```

For tests, start the test infrastructure and run:

```bash
docker compose -f docker-compose.test.yml up -d
npm run test:coverage
```

A successful submission should have:

```text
API working
Swagger working
Postman collection importing
Unit tests passing
Integration tests passing
Cross-tenant tests passing
Queue test passing
Coverage report generated
Docker working
README documented
```
