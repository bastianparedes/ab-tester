# AB Tester Service

The AB Tester backend API, built with NestJS. It provides the REST services
used by the AB Tester UI and client script.

## Requirements

- Docker Desktop with Docker Compose, for the recommended setup
- Node.js 26 and npm, for local development and running project commands
- The team's `.npmrc` configuration to install private `@ab-tester/*` packages

Ask a team member for `.npmrc` if you do not have access. Do not commit
`.npmrc` or registry credentials.

## Run the full application with Docker Compose

The Compose file in this repository starts PostgreSQL, Redis, the backend, and
the UI. The UI directory must be a sibling of this service directory, or
`AB_TESTER_UI_PATH` must point to its location.

1. From this directory, create your local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Edit `.env`. In particular, replace the example database password, JWT
   secret, and administrator password with values appropriate for your local
   environment. Verify that `AB_TESTER_UI_PATH` points to the UI directory.
3. Start the application:

   ```powershell
   docker compose up --build
   ```

Services are available at:

| Service | Local address |
| --- | --- |
| UI | [http://localhost:3000](http://localhost:3000) |
| Backend | [http://localhost:4000](http://localhost:4000) |
| Swagger UI | [http://localhost:4000/docs](http://localhost:4000/docs) |
| OpenAPI document | [http://localhost:4000/docs-json](http://localhost:4000/docs-json) |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

Stop the services with `Ctrl+C`. To stop and remove the Compose containers,
run `docker compose down`.

### Environment variables

The Compose setup reads its configuration from `.env`. Required backend
settings include:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL_POSTGRES` | PostgreSQL connection string. In Compose, use the `db-postgres` service as the host. |
| `DATABASE_URL_REDIS` | Redis connection URL. In Compose, use the `db-redis` service as the host. |
| `JWT_SECRET` | Secret used to sign and verify authentication tokens. |
| `SALT_ROUNDS` | Work factor used when hashing passwords. |
| `SERVICE_BASE_URL` | Base URL used by the service when building public resource URLs. |
| `PORT` | HTTP port; defaults to `4000` when omitted. |

Other settings used by Compose:

| Variable | Purpose |
| --- | --- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | PostgreSQL container initialization. |
| `AB_TESTER_UI_PATH` | Path to the sibling UI directory, relative to this repository or as an absolute path. |
| `NEXT_PUBLIC_BACKEND_URL_FROM_SERVER_SIDE` | Backend URL reachable by the UI server. |
| `NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE` | Backend URL reachable by the user's browser. |
| `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` | Optional initial super-admin credentials. |
| `DOMAIN` | Optional cookie/domain configuration. |

The committed `.env.example` provides a local Compose template. Review and
replace example credentials before use; never use them in a shared or
production environment. Keep `.env` private; it is ignored by Git.

## Run the backend directly

For development without the full Compose stack, start PostgreSQL and Redis
separately and set the required backend environment variables in your shell.
The `start:dev` script uses POSIX shell syntax; use Bash (including Git Bash),
or use Docker Compose on Windows:

```bash
npm ci
npm run start:dev
```

The development command watches the NestJS service and rebuilds the client
script when its sources change. Configure database connection URLs to use the
addresses of your local PostgreSQL and Redis instances.

## Development commands

| Command | Description |
| --- | --- |
| `npm run build` | Compile the NestJS service. |
| `npm run build:script` | Build the client script. |
| `npm run start:prod` | Run the compiled service from `dist`. |
| `npm run lint` | Check the project with Biome. |
| `npm test` | Run Vitest with coverage; configured thresholds are 100%. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run generate-migration` | Generate a PostgreSQL migration from the Drizzle schema. |

## API documentation

When the service is running, use [Swagger UI](http://localhost:4000/docs) to
explore the API, request and response schemas, and examples. The generated
OpenAPI JSON is available at
[http://localhost:4000/docs-json](http://localhost:4000/docs-json).

Authentication uses secure `accessToken` and `refreshToken` cookies. Swagger
cannot set an `HttpOnly` cookie through its **Authorize** dialog. Establish a
session by calling the sign-in or refresh endpoint from the Swagger UI; see the
authentication workflow at the top of the Swagger page.
