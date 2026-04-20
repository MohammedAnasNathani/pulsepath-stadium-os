# Submission Copy

## Challenge

Physical Event Experience

## Project title

PulsePath Stadium OS

## Short description

PulsePath Stadium OS is a stadium-scale crowd coordination platform that improves the physical event experience for both attendees and venue operators. It combines live route recommendations, wait-time-aware decision support, accessibility-sensitive rerouting, and scenario-based operations control in one polished web app.

## Key innovation points

- Dual-surface product: attendee copilot + venue ops command center
- Deterministic crowd-routing engine with Gemini-enhanced explanation layer
- Firebase App Hosting + Firestore live sync + Vertex AI full-stack architecture
- Accessibility-first logic for dignified rerouting under venue pressure
- Scenario-driven demo that judges can evaluate instantly

## Copy for “Approach and Logic”

PulsePath models a single high-capacity sporting venue and simulates four live operational states: pre-entry rush, halftime surge, accessible reroute, and emergency exit coordination. The core engine ranks candidate routes using real-time factors like zone density, queue time, distance, accessibility score, attendee goal, group type, and budget mode. Firestore keeps the venue state synchronized across the attendee and ops surfaces, while Gemini on Vertex AI generates natural-language guidance and announcement support. The routing layer remains deterministic first, so the product stays reliable even if the AI path is unavailable.

## Copy for “How the solution works”

Attendees interact with a personalized copilot that recommends the best live route for entering the stadium, grabbing food, accessing restrooms, reaching accessible seating, buying merchandise, or exiting safely. Venue operators use a separate control surface to trigger scenarios, review alerts, inspect zone-level telemetry, and issue reroute announcements. The application is built with Next.js and TypeScript, includes API endpoints for assistant guidance, reporting, and scenario switching, and is deployed on Firebase App Hosting with Firestore-backed synchronization and Vertex AI-assisted explanations.

## Copy for “Assumptions made”

- The venue is represented as a fictional mega-stadium to create a realistic but self-contained match-day simulation.
- Scenario data is simulated for demo purposes but structured so it can be replaced with live sensor, ticketing, or operations feeds.
- Gemini improves explanation quality but is not required for the core product logic.
- Firestore sync and hosted Gemini support are active in the production deployment, while deterministic fallbacks preserve demo reliability.
