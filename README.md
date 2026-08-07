# QueueKind

QueueKind transforms chaotic physical queues into a calmer digital waiting experience. People can describe what they need in everyday language, receive a structured queue token, track their estimated wait, and stay coordinated with service providers.

## Features

- Gemini-powered natural-language intake for walk-ins, appointments, and service requests.
- Structured queue creation with service category, priority, and estimated wait time.
- Participant view with token status, queue progress, notifications, and leave-queue controls.
- Provider command center with active queue visibility, next-customer controls, completion actions, and pause/resume status.
- Responsive interface designed for community services, public offices, clinics, libraries, and similar environments.
- Deterministic fallback parsing when the AI service is unavailable.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Vercel AI SDK
- Gemini through the Vercel AI Gateway
- Lucide React icons

## Getting started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

```bash
pnpm dev       # Start the development server
pnpm build     # Create a production build
pnpm start     # Start the production server
pnpm lint      # Run ESLint when configured
```

## AI intake API

The intake endpoint is available at:

```text
POST /api/intake
```

Send an unstructured request in the request body:

```json
{
  "request": "I need help renewing my library card"
}
```

The endpoint returns structured queue data including the detected service, priority, confidence, and a human-readable summary. If Gemini is unavailable, the route uses a safe deterministic fallback so the queue experience remains usable.

## Project structure

```text
app/
  api/intake/route.ts   # Gemini-powered request parsing
  globals.css           # Design tokens and application styles
  layout.tsx            # Metadata and root layout
  page.tsx              # QueueKind participant/provider interface
```

## Deployment

The application is configured for Vercel deployment. Build locally before deploying:

```bash
pnpm build
```

Then deploy through the Vercel dashboard or the linked Vercel project. Configure the Vercel AI Gateway integration for production AI-powered intake; the application still provides fallback parsing when AI configuration is unavailable.

## Design principles

QueueKind is built around dignity, clarity, and coordination:

- Make waiting status visible without making people repeatedly ask for updates.
- Translate messy requests into structured service work without forcing users through long forms.
- Give providers operational controls that are simple under pressure.
- Keep the experience accessible, responsive, and understandable at a glance.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [QueueKind on v0](https://v0.app/chat/projects/prj_syaN8qlFJ4GoQ0lGS84MSywTVDZh)
