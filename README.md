# The Movement Club

A private Pilates and yoga booking app built for the TeamLift Product Engineer Internship Challenge.

## What I built

- A weekly customer calendar with class type and instructor filters.
- Private session booking using a name and email, with confirmation in the browser.
- A separate `/admin` page where one studio host creates sessions and views booking status. Instructors do not have accounts.
- PostgreSQL persistence and database-level double-booking protection: each session can have only one booking. Conflicting requests return `409 Conflict`.
- A responsive sage and powder pink interface with descriptions and images for four class types.

**Stack:** React, TypeScript, Vite, Tailwind CSS, NestJS, Prisma 7, and PostgreSQL 17. All studio times use `Europe/Vienna`. Authentication is omitted as allowed by the challenge.

## How to run

Prerequisites: Node.js and npm (developed with Node.js 26), plus a running PostgreSQL 17 server. Run the following from the cloned repository.

### 1. Create the database

```sh
createdb movement_club
```

Create `backend/.env` with your own PostgreSQL credentials:

```dotenv
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/movement_club?schema=public"
```

The PostgreSQL user must have access to this database. `.env` is ignored by Git.

### 2. Start the backend

```sh
cd backend
npm ci
npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts
npm run start:dev
```

The API runs at `http://localhost:3000`.

### 3. Start the frontend

In a second terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`. The development proxy forwards `/api` requests to the backend on port 3000.

Visit `/admin` to create a future session, then return to `/` and navigate to its week to book it. A fresh database starts empty; the sample sessions added during development are local data and are not included in Git. The admin page is intentionally accessible without login.

## AI tools used

- **OpenAI Codex:** assisted with implementation, debugging, validation checks, and documentation.
- **OpenAI image generation:** created the four class images and edited the reformer pose using a supplied reference. These are illustrative images, not photographs of the actual studio or instructors. Prompts are documented in [the image README](frontend/public/images/classes/README.md).

AI-generated booking messages and email confirmations are not implemented.

## What I would improve with more time

- Add authentication for the studio host.
- Add automated integration and end-to-end tests, especially for concurrent bookings.
- Add a repeatable sample-data script for reviewers.
- Send booking confirmation emails, with optional AI-generated messages that cannot prevent a booking from succeeding.
- Deploy the frontend, backend, and database, and finish mobile and accessibility testing.
