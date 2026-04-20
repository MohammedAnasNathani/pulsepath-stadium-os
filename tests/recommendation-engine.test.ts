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

test("assistant can use the hosted Vertex fallback when no Gemini API key is present", async () => {
  const venueState = getScenarioState("pre-entry-rush");
  const request: RecommendationRequest = {
    profile: defaultProfile,
    currentZone: "Fan Plaza",
    activeScenario: "pre-entry-rush",
    venueState,
  };

  const previousAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const previousGeminiKey = process.env.GEMINI_API_KEY;
  const previousGoogleKey = process.env.GOOGLE_API_KEY;

  process.env.GOOGLE_ACCESS_TOKEN = "test-token";
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;

  try {
    const response = await buildAssistantResponse(request, {
      fetchImpl: async (input, init) => {
        const url = String(input);

        assert.match(url, /aiplatform\.googleapis\.com/);
        assert.equal(init?.headers && "Authorization" in init.headers ? init.headers.Authorization : "", "Bearer test-token");

        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: "Use East Gate because it is the cleanest live route." }],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      },
    });

    assert.equal(response.modelMode, "hybrid-ai");
    assert.match(response.reasoning, /East Gate/i);
  } finally {
    if (previousAccessToken === undefined) {
      delete process.env.GOOGLE_ACCESS_TOKEN;
    } else {
      process.env.GOOGLE_ACCESS_TOKEN = previousAccessToken;
    }

    if (previousGeminiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = previousGeminiKey;
    }

    if (previousGoogleKey === undefined) {
      delete process.env.GOOGLE_API_KEY;
    } else {
      process.env.GOOGLE_API_KEY = previousGoogleKey;
    }
  }
});
