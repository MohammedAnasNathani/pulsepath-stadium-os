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
- Firebase/App Hosting-ready full-stack architecture
- Accessibility-first logic for dignified rerouting under venue pressure
- Scenario-driven demo that judges can evaluate instantly

## Copy for “Approach and Logic”

PulsePath models a single high-capacity sporting venue and simulates four live operational states: pre-entry rush, halftime surge, accessible reroute, and emergency exit coordination. The core engine ranks candidate routes using real-time factors like zone density, queue time, distance, accessibility score, attendee goal, group type, and budget mode. Gemini is used as an augmentation layer to generate natural-language guidance and operations announcements, but the core routing remains deterministic so the system stays reliable without AI availability.

## Copy for “How the solution works”

Attendees interact with a personalized copilot that recommends the best live route for entering the stadium, grabbing food, accessing restrooms, reaching accessible seating, buying merchandise, or exiting safely. Venue operators use a separate control surface to trigger scenarios, review alerts, inspect zone-level telemetry, and issue reroute announcements. The application is built with Next.js and TypeScript, includes API endpoints for assistant guidance, reporting, and scenario switching, and is wired for Firebase/App Hosting deployment with Firestore-ready synchronization.

## Copy for “Assumptions made”

- The venue is represented as a fictional mega-stadium to create a realistic but self-contained match-day simulation.
- Scenario data is simulated for demo purposes but structured so it can be replaced with live sensor, ticketing, or operations feeds.
- Gemini improves explanation quality but is not required for the core product logic.
- Firestore sync is optional at runtime and activates when Google-hosted configuration is present.
