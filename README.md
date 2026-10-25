# The Movement Club

A private Pilates and yoga booking app built for the TeamLift Product Engineer Internship Challenge.

## What I built

- A weekly customer calendar with class type and instructor filters.
- Private session booking using a name and email, with confirmation in the browser.
- Booking confirmation emails through Resend, currently limited to the registered test recipient until a sender domain is verified.
- A preparation-tips bubble on the booking confirmation, visible even when email delivery is unavailable. AI-generated messages are labeled; standard fallback messages are identified separately.
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

## Frontend hosting on Render

The root `render.yaml` defines a Render Static Site for `frontend`. Create a Blueprint from this GitHub repository to deploy it. It builds the Vite app, forwards `/api/*` to `https://the-movement-club-api.onrender.com/*`, and serves `index.html` for frontend routes such as `/admin`. API keys and the Neon connection string belong only in the existing backend service's environment settings.

The hosted database starts empty. Create future sessions through the public `/admin` page to populate the calendar.

## AI tools used

- **OpenAI Codex:** assisted with implementation, debugging, validation checks, and documentation.
- **OpenAI image generation:** created the four class images and edited the reformer pose using a supplied reference. These are illustrative images, not photographs of the actual studio or instructors. Prompts are documented in [the image README](frontend/public/images/classes/README.md).
- **Google Gemini:** generates class-specific preparation and what-to-bring tips displayed after booking. The same tips are included in confirmation emails when delivery is available.

## Email confirmation — test mode

After a booking is saved, the backend uses Resend to send the class, instructor, Vienna date/time, duration, booking reference, and the preparation note described below. The email integration is implemented and tested, but delivery to arbitrary customers is not enabled in the public demo because no sender domain has been verified.

The default `onboarding@resend.dev` sender can [only send to the email address registered with Resend](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain). To enable delivery to other customers, verify a domain you own in Resend and update `EMAIL_FROM` to an address on that domain.

For local email testing, add these settings to `backend/.env` and book using your Resend account email:

```dotenv
RESEND_API_KEY=your_resend_key
EMAIL_FROM="The Movement Club <onboarding@resend.dev>"
```

Create a key in [Resend](https://resend.com/api-keys). Without email configuration, sending is skipped. If delivery fails, the booking remains confirmed and the browser explains that the email could not be sent. Provider acceptance does not guarantee inbox delivery; there is no background queue or automatic retry.

## AI class preparation tips — visible in the browser

After `POST /sessions/:id/book` saves a booking, Gemini generates a short preparation note specific to Reformer Pilates, Mat Pilates, Vinyasa Yoga, or Hatha Yoga. It covers what to expect, practical preparation, what to wear, and what to bring. Equipment provision and grip-sock requirements are not assumed; guests are advised to check with the studio.

The note appears in a powder pink bubble on the booking confirmation. It works independently of email delivery, so reviewers can experience the AI feature using their own booking email without needing a verified sender domain. The same note is included in the confirmation email when sending is available.

AI-generated tips are labeled. If Gemini is missing, unavailable, or returns incomplete content, a class-specific standard note is shown instead and is not labeled as AI-generated. Only the class type and general preparation guidance are sent to Gemini, not the customer's name or email. Exact booking details come from the database.

To enable generation, add these settings to `backend/.env`:

```dotenv
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Create a key in [Google AI Studio](https://aistudio.google.com/apikey). The default [model has a free tier](https://ai.google.dev/gemini-api/docs/pricing), subject to quotas. Each external request has a five-second timeout, and provider failures do not cancel a saved booking.

See [backend/.env.example](backend/.env.example) for all settings. Never commit real keys. Restart the local backend after changing `.env`; configure hosted keys in Render's backend environment settings.

## Tests

Run `npm test` inside `backend` for mocked provider success/failure, booking validation, and double-booking conflict checks. Tests do not send real emails.

Run `npm run test:e2e` inside `backend` with the local database running and migrations applied to test real concurrent bookings. Two simultaneous HTTP requests must produce one `201` and one `409`, leave exactly one booking in PostgreSQL, and mark the session unavailable. This test disables email and removes only its own test records afterward.

## What I would improve with more time

- Add authentication for the studio host.
- Expand automated end-to-end coverage to include the customer and admin interfaces.
- Add a repeatable sample-data script for reviewers.
- Verify a sender domain to enable emails to all customers, then add reliable background delivery and retries.
- Expand mobile and accessibility testing.
