# Just Do It

A full-stack todo app with a Next.js frontend, NestJS backend, and PostgreSQL database.

## Run Locally

Before you start, make sure Docker with Compose V2 (`docker compose`) is installed.

If you do not have Docker installed:

- macOS / Windows: install [Docker Desktop](https://docs.docker.com/get-started/introduction/get-docker-desktop/). Docker Compose is included.
- Linux: install [Docker Engine](https://docs.docker.com/engine/install/) and the [Docker Compose plugin](https://docs.docker.com/compose/install/linux/).

Verify:

```bash
docker --version
docker compose version
```

Start the full app:

```bash
docker compose up --build -d
```

This builds the frontend/backend images, starts PostgreSQL, runs migrations and seeds, then starts the app.

Open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
