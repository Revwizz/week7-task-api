# Week 7 Task API

SENG3080 Week 7 backend lab: a REST Task API built with Express, Sequelize (SQLite),
express-validator, Helmet, Passport (local strategy with bcrypt) and Redis response caching.

## Requirements

- Node.js LTS and npm
- Docker Desktop (used only to run Redis)
- Postman (for testing)

## Installation

```
git clone https://github.com/Revwizz/week7-task-api.git
cd week7-task-api
npm install
```

Create a `.env` file in the project root by copying `.env.example`, then replace
`SESSION_SECRET` with your own long random value:

```
PORT=3000
SESSION_SECRET=replace-this-with-a-long-random-value
REDIS_URL=redis://localhost:6379
```

`.env` is listed in `.gitignore` and is never committed.

## Redis startup

Start Docker Desktop and wait until the Docker engine is running.
The first time, create and start the Redis container:

```
docker run -d --name week7-redis -p 6379:6379 redis:7-alpine
```

After that, start the same container with:

```
docker start week7-redis
```

Check that it is running with `docker ps`. Stop it with `docker stop week7-redis`.

## Run the server

Redis must be running before the server starts.

```
npm run dev     # development mode with nodemon (restarts on file save)
npm start       # plain node
```

The terminal prints `API running`. The API listens on http://localhost:3000.
The SQLite database file `database.sqlite` is created on the first run.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | /api/tasks/health | Health check |
| GET | /api/tasks | List tasks (cached in Redis for 60 seconds) |
| GET | /api/tasks/:id | Read one task |
| POST | /api/tasks | Create a task (validated) |
| PUT | /api/tasks/:id | Update a task (validated, partial updates allowed) |
| DELETE | /api/tasks/:id | Delete a task |
| POST | /api/auth/register | Register with `{ "email", "password" }` |
| POST | /api/auth/login | Log in; sets a session cookie |
| GET | /api/auth/me | Current user; 401 when not signed in |

## Project structure

```
src/
  config/      database.js (Sequelize), passport.js (local strategy), redis.js (Redis client)
  middleware/  validate.js (express-validator result check)
  models/      Task.js, User.js
  routes/      tasks.js, auth.js
  server.js    middleware order, routes, startup
```

## Test record

| Test | Expected result | Result | Matched |
|---|---|---|---|
| GET /api/tasks/health | 200 JSON status response; request logger output | 200 `{"status":"ok","service":"task-api"}`; terminal logged `GET /api/tasks/health` | Yes |
| POST invalid task | 400 with validation errors | 400; errors: `title must be 3-120 characters` (title), `Invalid value` (priority) | Yes |
| POST valid task | 201 and a task with id | 201; task created with `"id": 2` | Yes |
| GET missing task | 404 Task not found | 404 `{"error":"Task not found"}` for a deleted task id | Yes |
| Security header check | At least one Helmet header is present | `X-Content-Type-Options: nosniff` (also `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy`) | Yes |
| GET /api/auth/me before login | 401 Sign in required | 401 `{"error":"Sign in required"}` | Yes |
| Register, login, then GET /me | 201, 200, then 200 with current user | 201 `{"id":2,"email":"ritik@batcave.com"}`, 200 login, 200 `{"id":2,"email":"ritik@batcave.com"}` | Yes |
| Two GET /api/tasks calls | database then cache source | first `"source": "database"`, second `"source": "cache"` | Yes |
| Create task then GET /api/tasks | database source and fresh data after invalidation | 201 `"id": 3` (Cache invalidation test), then `"source": "database"` with the new task first | Yes |

## Security verification record

- Helmet header found on `GET /api/tasks/health`: `X-Content-Type-Options: nosniff`.
- `npm audit`: 2 moderate severity vulnerabilities in `uuid` < 11.1.1
  (GHSA-w5hq-g745-h8pq), pulled in as a dependency of `sequelize`.
- Action taken: ran `npm audit fix`, which found no non-breaking fix.
  `npm audit fix --force` was not applied because it would install `sequelize@3.30.0`,
  a breaking downgrade from Sequelize 6. Accepted as a known moderate risk in a dependency.