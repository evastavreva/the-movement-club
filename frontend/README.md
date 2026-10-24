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
- An empty database shows an empty schedule. Create sessions at `/admin`.

## Studio admin

Open `/admin` or use the Studio admin link in the footer. Create sessions using a fixed list of four class types and instructors: Eva, Sofia, Anastasia, and Ioanna. View all sessions and use Refresh status to see new bookings.

Dates and times entered in the form are interpreted in `Europe/Vienna`, regardless of the browser's time zone. Nonexistent times during the spring clock change are rejected; repeated autumn times use the first occurrence.

The admin page has no authentication, as required by the challenge. The eight initial sample sessions were added to the local database; they are not recreated automatically on other machines.

## Checks and deployment

```sh
npm run build
npm run lint
```

The production output is `dist/`. The Vite proxy is for development only: production hosting must forward `/api/*` to the NestJS backend and remove the `/api` prefix. Serve `index.html` for frontend routes such as `/admin`.
