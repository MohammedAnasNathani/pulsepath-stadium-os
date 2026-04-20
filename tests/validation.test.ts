import test from "node:test";
import assert from "node:assert/strict";
import { getScenarioState } from "../lib/scenarios";
import {
  ValidationError,
  parseAssistantRequest,
  parseCrowdReport,
  parseScenarioId,
} from "../lib/validation";
import { defaultProfile } from "../lib/types";

test("parseAssistantRequest accepts a valid payload", () => {
  const venueState = getScenarioState("pre-entry-rush");
  const parsed = parseAssistantRequest({
    profile: defaultProfile,
    currentZone: "Fan Plaza",
    activeScenario: "pre-entry-rush",
    venueState,
  });

  assert.equal(parsed.profile.persona, defaultProfile.persona);
  assert.equal(parsed.activeScenario, "pre-entry-rush");
});

test("parseAssistantRequest rejects invalid enum values", () => {
  assert.throws(
    () =>
      parseAssistantRequest({
        profile: {
          ...defaultProfile,
          persona: "mystery",
        },
        currentZone: "Fan Plaza",
        activeScenario: "pre-entry-rush",
        venueState: getScenarioState("pre-entry-rush"),
      }),
    ValidationError,
  );
});

test("parseAssistantRequest rejects malformed venue state payloads", () => {
  const venueState = getScenarioState("pre-entry-rush");

  assert.throws(
    () =>
      parseAssistantRequest({
        profile: defaultProfile,
        currentZone: "Fan Plaza",
        activeScenario: "pre-entry-rush",
        venueState: {
          ...venueState,
          zones: [
            {
              ...venueState.zones[0],
              status: "mystery",
            },
          ],
        },
      }),
    ValidationError,
  );
});

test("parseScenarioId and parseCrowdReport validate user input", () => {
  assert.equal(parseScenarioId({ scenarioId: "halftime-surge" }), "halftime-surge");
  assert.equal(
    parseCrowdReport({
      zoneId: "fan-plaza",
      sentiment: "better",
      message: "Queues moved quickly after reroute.",
    }).sentiment,
    "better",
  );
});
