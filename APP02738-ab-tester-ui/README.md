# AB Tester UI

The AB Tester web application, built with Next.js and React. It provides the
interface for managing tenants, audiences, campaigns, execution groups,
lifecycle hooks, track events, and user accounts.

## Requirements

- Node.js 26 (the version specified in [`.nvmrc`](./.nvmrc))
- npm
- Access to the AB Tester backend
- The team's `.npmrc` configuration, if required to install the private
  `@ab-tester/constants` package

Ask a team member for the `.npmrc` configuration if you do not have access.
Do not commit `.npmrc` or registry credentials.

## Setup

From this directory, install the dependencies:

```bash
npm ci
```

Create a local `.env.local` file with the backend URLs:

```dotenv
NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE=http://localhost:4000
NEXT_PUBLIC_BACKEND_URL_FROM_SERVER_SIDE=http://localhost:4000
```

Use the client-side URL for requests from the user's browser; it must be
reachable from that browser. The server-side URL is used for requests made by
Next.js and must be reachable from the frontend server. When running everything
locally, both can point to `http://localhost:4000`. If the services run in
different containers or hosts, configure each URL for the network location
where it is used. Keep the values free of a trailing slash.

These variables are prefixed with `NEXT_PUBLIC_` and can be included in
client-side code. Do not put secrets in them. Local `.env*` files are excluded
from Git.

## Run locally

Start the backend first, then run the frontend development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The backend's interactive
API documentation is available at [http://localhost:4000/docs](http://localhost:4000/docs)
when the backend is running.

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Serve the production build; run `npm run build` first. |
| `npm run lint` | Check the project with Biome. |
| `npm test` | Run Vitest with coverage; the configured thresholds are 100%. |

## Project structure

```text
src/
  app/       Routes, page components, shared UI, and app-level tests
  config/    Application configuration and shared constants
  libs/      Environment access and backend REST client
  utils/     Shared utilities
```

Routes live under `src/app`. Tenant-specific screens use dynamic route segments
such as `[tenantId]`; shared components and contexts are under
`src/app/_common`. The frontend uses HTTP requests and Socket.IO to communicate
with the backend.
