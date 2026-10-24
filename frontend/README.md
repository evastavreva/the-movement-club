# The Movement Club frontend

React, TypeScript, Vite, and Tailwind CSS.

## Run locally

Start PostgreSQL and the backend first:

```sh
cd backend
npm run start:dev
```

In another terminal, from the project root:

```sh
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite. The development proxy forwards `/api` to the backend at `http://localhost:3000`, removing the `/api` prefix. If the backend uses another port, update `vite.config.ts`.

## Customer booking

- Upcoming, available sessions are listed in Vienna time (`Europe/Vienna`).
- Class type and instructor filters work together; their options come from saved sessions.
- A name and email are required to book. Successful bookings disappear from availability.
- If someone else books first, the customer sees a message and can choose another session.
- An empty database shows an empty schedule. Create sessions through `POST /sessions`; the admin UI is the next increment.

## Checks and deployment

```sh
npm run build
npm run lint
```

The production output is `dist/`. The Vite proxy is for development only: production hosting must forward `/api/*` to the NestJS backend and remove the `/api` prefix.
