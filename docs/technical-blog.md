# Building PulsePath Stadium OS With AI-Native Development

## The problem

Large sporting venues look exciting from the outside, but the on-ground attendee experience often breaks in the same places:

- gates get overloaded while other entrances stay underused
- halftime creates a synchronized rush toward food and restrooms
- accessibility journeys become fragile if one lift or corridor slows down
- operations teams need clear reroute messaging in seconds, not minutes

For PromptWars, I wanted to build something that felt like a real product instead of a generic dashboard. That led to PulsePath Stadium OS: one web app that behaves like both a fan copilot and a venue operations console.

## Product direction

I narrowed the concept to a single fictional mega-stadium instead of building a multi-venue platform. That decision made the demo more believable and helped me focus on depth:

- one memorable match-day story
- four scenario-driven flows
- better UI polish
- stronger logic for routing and ops coordination

The result is a more convincing submission because judges can test concrete outcomes instead of clicking through abstract product placeholders.

## What PulsePath does

PulsePath has two connected surfaces.

### 1. Attendee copilot

The attendee view asks for:

- persona
- current zone
- seat zone
- goal
- mobility needs
- budget mode
- group type

From there, the app ranks routes for entry, food, merch, restrooms, accessible seat arrival, or emergency exit movement.

### 2. Venue operations console

The ops side can:

- switch match-day scenarios
- monitor zone density and wait pressure
- see active incidents
- generate public announcement copy
- collect attendee feedback for future improvements

## Why I used a deterministic engine first

I wanted the system to stay useful even if an AI key was missing or a model call failed. So the core routing engine is deterministic:

- score every candidate route by density, queue, distance, accessibility, and scenario pressure
- reward family-friendly, value-friendly, and mobility-friendly paths when relevant
- penalize incident-affected zones
- surface the top three actions with route steps and reasons

Then I layered Gemini on top to rewrite that deterministic output into more natural assistant guidance. That means the app is safe-by-default and still AI-enhanced.

## Google services in the architecture

I leaned into Google services in a practical way:

- Firebase App Hosting configuration for deployment of the full-stack Next.js app
- Firestore-ready persistence path for live scenario state and crowd reports
- Gemini REST integration for assistant explanations
- Cloud-host aware server logic so Firestore writes can run through service account credentials on hosted infrastructure

This matters because the PromptWars rubric explicitly rewards meaningful Google-service usage, not just frontend polish.

## The four demo scenarios

The app includes four scenario states so judges can evaluate multiple problem types quickly:

### Pre-entry Rush

North Gate overloads while East Gate stays relatively efficient.

### Halftime Surge

Concessions and restrooms spike together. The product must balance convenience against return-to-seat speed.

### Accessible Reroute

One lift slows down, so the system must preserve dignity and confidence for accessibility-sensitive journeys.

### Emergency Exit Coordination

A localized smoke alert closes one area and redirects outbound flow toward the safest exit spine.

## Design choices

I didn’t want a safe, default SaaS layout. The visual system borrows from sports broadcast graphics and venue command centers:

- large condensed headline typography
- dark scoreboard palette
- turf-green success accents
- amber and red incident tones
- scanline and telemetry-inspired layering

That gave the app a stronger identity and made the demo feel closer to an actual stadium control interface.

## Testing and quality

I added unit tests for:

- recommendation ranking
- scenario modeling
- input validation
- Gemini fallback behavior

I also kept the repository source-only and small, which matters for PromptWars submission limits.

## What I’d add next

If I extend PulsePath after the hackathon, the next steps would be:

- real Firestore live documents for cross-device synchronization
- Google Maps or indoor graph routing for turn-by-turn navigation
- richer reporting analytics for venue management teams
- personalized notification flows for post-purchase attendee guidance

## Final thought

The best part of building PulsePath was using AI as an accelerator, not a substitute for product thinking. Prompting sped up iteration, but the winning edge came from making decisions clearly:

- pick one sharp story
- make the core engine reliable
- use AI where it creates leverage
- design for both the algorithmic rubric and the human judge

That combination made PulsePath feel like a real event-tech product, not just a hackathon mockup.
