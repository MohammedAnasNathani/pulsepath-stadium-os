import test from "node:test";
import assert from "node:assert/strict";
import { buildAssistantResponse, buildDeterministicRecommendation } from "../lib/recommendation-engine";
import { getScenarioState } from "../lib/scenarios";
import { defaultProfile, type RecommendationRequest } from "../lib/types";

test("wheelchair routing favors accessible alternatives during accessible reroute", () => {
  const venueState = getScenarioState("accessible-reroute");
  const request: RecommendationRequest = {
    profile: {
      ...defaultProfile,
      goal: "accessible-seat-arrival",
      mobilityNeeds: "wheelchair",
      persona: "vip-guest",
    },
    currentZone: "East Gate",
    activeScenario: "accessible-reroute",
    venueState,
  };

  const response = buildDeterministicRecommendation(request);

  assert.equal(response.rankedActions[0]?.destinationZoneId, "west-concourse");
  assert.match(response.headline, /accessible/i);
});

test("emergency exit scenario prioritizes an exit spine", () => {
  const venueState = getScenarioState("emergency-exit");
  const request: RecommendationRequest = {
    profile: {
      ...defaultProfile,
      goal: "exit-fast",
      persona: "superfan",
    },
    currentZone: "West Concourse",
    activeScenario: "emergency-exit",
    venueState,
  };

  const response = buildDeterministicRecommendation(request);

  assert.equal(response.rankedActions[0]?.destinationZoneId, "south-exit");
  assert.match(response.announcementCopy ?? "", /move calmly/i);
});

test("assistant falls back to deterministic mode when AI request fails", async () => {
  const venueState = getScenarioState("halftime-surge");
  const request: RecommendationRequest = {
    profile: defaultProfile,
    currentZone: "West Concourse",
    activeScenario: "halftime-surge",
    venueState,
  };

  const response = await buildAssistantResponse(request, {
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });

  assert.equal(response.modelMode, "deterministic");
  assert.ok(response.rankedActions.length >= 1);
});
