# Demo Script

## Total length

4 to 5 minutes

## Opening

“This is PulsePath Stadium OS, a crowd coordination platform for large sporting venues. It improves the attendee experience and the venue operations experience at the same time.”

## Scene 1: Product overview

- Show the hero section.
- Call out that the app is one single-stadium product, not a fake multi-tenant concept.
- Mention that the UI is built to feel like a real match-day command center.

Say:

“PulsePath combines two surfaces: an attendee copilot and an operations control room. The system handles crowd movement, waiting times, accessibility-aware routing, and emergency coordination.”

## Scene 2: Attendee copilot

- Set persona to `family`
- Goal to `food-run`
- Current zone to `West Concourse`
- Trigger or mention `Halftime Surge`

Say:

“At halftime, the whole venue moves at once. PulsePath evaluates live density, queue length, access score, group type, and budget mode to recommend the best route.”

- Show the top ranked route.
- Open the route cards and read one or two reasons.
- Click `Ask PulsePath AI`.

Say:

“The core routing engine is deterministic, so it still works safely without AI. Gemini makes the explanation more natural and easier to trust.”

## Scene 3: Accessibility story

- Switch to `Accessible Reroute`
- Set mobility needs to `wheelchair`
- Goal to `accessible-seat-arrival`

Say:

“This scenario simulates a lift slowdown. Instead of failing the journey, PulsePath prioritizes dignified reroutes with escort-friendly corridors and accessibility-aware ranking.”

- Point to the recommended route and the access score.

## Scene 4: Operations console

- Focus on the right-hand panel.
- Switch to `Emergency Exit Coordination`.

Say:

“The ops side sees the same venue twin through a different lens. It can change scenarios, monitor incidents, and instantly generate public announcements for safe rerouting.”

- Read the generated announcement.
- Show the incident card.

## Scene 5: Google services and architecture

Say:

“Under the hood, the app is built with Next.js and TypeScript, includes Gemini integration for assistant responses, and is wired for Firebase App Hosting and Firestore-backed synchronization.”

## Closing

Say:

“PulsePath is designed to feel deployable, not just demoable. It gives fans faster decisions, gives operations teams calmer control, and stays useful even when AI is unavailable. That balance between reliability and intelligence is what makes the product strong.”
