# Antigravity / AI-Native Build Notes

Use this file as your process proof when writing the blog or speaking to judges.

## Core prompt strategy

### 1. Product framing

Prompted for a product that would:

- solve the exact stadium brief
- feel like a real venture-scale tool
- include both attendee and operator workflows
- score well on Google-services usage and manual review polish

### 2. Scope control

Instead of building a wide but shallow platform, the build was constrained to:

- one fictional mega-stadium
- four high-impact match-day scenarios
- one premium UI
- one deterministic engine with an optional AI layer

### 3. Safety-first intelligence

Prompts deliberately separated:

- deterministic ranking logic
- AI-generated explanation logic

This prevented the assistant from becoming the only source of product behavior.

### 4. Narrative-first packaging

The repo was designed to include:

- implementation
- tests
- deployment config
- README
- blog draft
- LinkedIn draft
- demo script

That matters in PromptWars because the manual review includes narrative quality, not just code.

## Example prompt themes

- “Design a stadium-scale web app that improves physical event experience for both fans and operations teams.”
- “Prioritize crowd movement, waiting times, accessibility rerouting, and emergency coordination.”
- “Make the routing logic deterministic first, AI-assisted second.”
- “Create a bold sports-broadcast visual direction instead of a generic dashboard.”
- “Prepare the repo so it is submission-ready, not just prototype-ready.”

## What worked best

- keeping one strong product story
- using AI to accelerate implementation without giving up product judgment
- treating the README and narrative assets as part of the product

## What to mention if asked

- AI accelerated ideation, refactoring, QA, and packaging
- the most important human decisions were still product scope, risk handling, and demo design
- the final system intentionally preserves functionality even without model access
