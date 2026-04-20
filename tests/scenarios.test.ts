import test from "node:test";
import assert from "node:assert/strict";
import { getScenarioCards, getScenarioState, normalizeVenueState } from "../lib/scenarios";

test("scenario catalog exposes four distinct demo flows", () => {
  const cards = getScenarioCards();

  assert.equal(cards.length, 4);
  assert.deepEqual(cards.map((card) => card.id), [
    "pre-entry-rush",
    "halftime-surge",
    "accessible-reroute",
    "emergency-exit",
  ]);
});

test("emergency exit scenario includes a critical incident and closed concession", () => {
  const state = getScenarioState("emergency-exit");

  assert.equal(state.incidents[0]?.severity, "critical");
  assert.equal(state.zones.find((zone) => zone.zoneId === "turf-food-hall")?.status, "closed");
});

test("normalizeVenueState rejects malformed data", () => {
  assert.equal(normalizeVenueState({ nope: true }), null);
  assert.equal(normalizeVenueState(getScenarioState("pre-entry-rush"))?.scenarioId, "pre-entry-rush");
});
