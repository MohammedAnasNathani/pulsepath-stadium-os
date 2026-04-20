# PulsePath Stadium OS

PulsePath Stadium OS is a single-stadium crowd coordination platform built for the PromptWars Virtual challenge, `Physical Event Experience`. It combines an attendee copilot and a venue-ops control room in one cinematic web app so judges can instantly test crowd movement, waiting times, accessibility-aware routing, and real-time coordination.

## Why this stands out

- Real product shape: one app serves both the attendee and the operations team.
- Strong prompt-native story: deterministic routing first, Gemini-enhanced explanations second.
- Google-forward architecture: Next.js + Firebase App Hosting + live Firestore sync + Gemini on Vertex AI + BigQuery ops analytics.
- Manual-review friendly: the repo includes the README, technical blog draft, LinkedIn post draft, demo script, and Antigravity process notes.

## Challenge fit

This project directly addresses the PromptWars physical venue brief:

- Crowd movement: live zone density, route ranking, reroute instructions, and emergency dispersal.
- Waiting times: queue-aware gate, restroom, and concession recommendations.
- Real-time coordination: the ops panel switches scenarios, generates public announcements, and syncs state through Firestore-backed live state.
- Seamless fan experience: personalization by persona, budget, group type, mobility needs, and current zone.

## Core features

### Attendee copilot

- Persona onboarding for solo fans, families, superfans, and VIP guests
- Goal-aware navigation for entry, food, merch, restrooms, accessible arrival, and fast exits
- Accessibility-first ranking with dignified fallback routes
- Gemini-powered explanation layer via `POST /api/assistant`
- Deterministic fallback so the app still works without API keys

### Venue ops console

- Four realistic demo scenarios:
  - `pre-entry-rush`
  - `halftime-surge`
  - `accessible-reroute`
  - `emergency-exit`
- Live alert cards and zone heat status
- AI-ready ops announcement copy
- BigQuery-backed signal warehouse for scenario switches, crowd reports, and assistant usage
- Scenario mutation endpoint via `POST /api/scenario`
- Attendee feedback capture via `POST /api/report`

## Architecture

### Frontend

- `Next.js 16` with App Router
- `TypeScript`
- `Tailwind CSS v4`
- Distinct sports-broadcast visual system with scoreboard typography, turf-green accents, and telemetry styling

### Intelligence layer

- Deterministic scoring engine in [lib/recommendation-engine.ts](/Users/mohammedanasnathani/Downloads/PromptWars/lib/recommendation-engine.ts)
- Gemini augmentation using `gemini-2.5-flash`, with Vertex AI enabled in the hosted project
- Graceful fallback to deterministic reasoning when Gemini is unavailable

### Google services

- Firebase App Hosting deployment on `kydo-project`
- Firestore-backed persistence for scenario state and crowd reports
- Service-account-aware server persistence for Google-hosted environments
- Vertex AI path for hosted Gemini explanations
- BigQuery dataset `pulsepath_analytics` for ops event analytics

## API surface

- `POST /api/assistant`
  - Input: `RecommendationRequest`
  - Output: `RecommendationResponse`
- `POST /api/report`
  - Input: crowd sentiment report
  - Output: validated report and sync mode
- `POST /api/scenario`
  - Input: `{ scenarioId }`
  - Output: new `VenueState`
- `GET /api/ops-analytics`
  - Output: BigQuery-backed scenario analytics with fallback derivation
- `GET /api/scenario/[scenarioId]`
  - Output: a specific scenario snapshot for testing or QA

## Local development

### Prerequisites

- Node.js `20+`
- npm
- Firebase CLI if you want App Hosting deploys

### Install

```bash
npm ci
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### Verify

```bash
npm run lint
npm run test:unit
npm run build
```

## Environment

Create an env file from [.env.example](/Users/mohammedanasnathani/Downloads/PromptWars/.env.example).

Optional variables:

- `GEMINI_API_KEY` or `GOOGLE_API_KEY`
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_ACCESS_TOKEN`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

The app is fully demoable without env vars. In the hosted project, App Hosting, Firestore, Vertex AI, and BigQuery are active.

## Firebase and App Hosting

This repo includes:

- [firebase.json](/Users/mohammedanasnathani/Downloads/PromptWars/firebase.json)
- [.firebaserc](/Users/mohammedanasnathani/Downloads/PromptWars/.firebaserc)
- [firestore.rules](/Users/mohammedanasnathani/Downloads/PromptWars/firestore.rules)
- [Dockerfile](/Users/mohammedanasnathani/Downloads/PromptWars/Dockerfile)

Deploy to Firebase App Hosting from local source:

```bash
firebase deploy --only apphosting:pulsepath-stadium --project kydo-project
```

Note: App Hosting requires a Blaze-plan Firebase project. This repo is already wired for `kydo-project` because App Hosting is enabled there.

## Testing

Unit tests cover:

- recommendation ranking
- scenario modeling
- input validation
- Gemini fallback safety

See:

- [tests/recommendation-engine.test.ts](/Users/mohammedanasnathani/Downloads/PromptWars/tests/recommendation-engine.test.ts)
- [tests/scenarios.test.ts](/Users/mohammedanasnathani/Downloads/PromptWars/tests/scenarios.test.ts)
- [tests/validation.test.ts](/Users/mohammedanasnathani/Downloads/PromptWars/tests/validation.test.ts)

## Submission assets

- Technical blog draft: [docs/technical-blog.md](/Users/mohammedanasnathani/Downloads/PromptWars/docs/technical-blog.md)
- LinkedIn post draft: [docs/linkedin-post.md](/Users/mohammedanasnathani/Downloads/PromptWars/docs/linkedin-post.md)
- Demo script: [docs/demo-script.md](/Users/mohammedanasnathani/Downloads/PromptWars/docs/demo-script.md)
- Antigravity process proof: [docs/antigravity-log.md](/Users/mohammedanasnathani/Downloads/PromptWars/docs/antigravity-log.md)
- Submission checklist: [docs/submission-checklist.md](/Users/mohammedanasnathani/Downloads/PromptWars/docs/submission-checklist.md)

## Assumptions

- The venue is a fictional mega-stadium used to simulate high-stakes match-day flows.
- The product optimizes for a polished single-venue narrative over a thin multi-venue platform.
- Firestore sync is live in the hosted environment and falls back safely during local offline demo use.
- BigQuery analytics are live in the hosted environment and track scenario changes, crowd reports, and assistant usage.
- Server writes are validated first and secrets are never exposed to the client.
