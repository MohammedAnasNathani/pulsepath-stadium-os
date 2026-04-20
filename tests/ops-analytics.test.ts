import test from "node:test";
import assert from "node:assert/strict";
import { getScenarioState } from "../lib/scenarios";
import {
  buildDerivedOpsAnalytics,
  readOpsAnalytics,
  recordOpsSignal,
} from "../lib/ops-analytics";

test("derived ops analytics stay informative without BigQuery credentials", () => {
  const analytics = buildDerivedOpsAnalytics(getScenarioState("pre-entry-rush"));

  assert.equal(analytics.mode, "derived");
  assert.equal(analytics.datasetId, "pulsepath_analytics");
  assert.match(analytics.topPressureZone, /Gate|Concourse|Plaza/);
});

test("recordOpsSignal writes to BigQuery when a Google access token is available", async () => {
  const previousAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  process.env.GOOGLE_ACCESS_TOKEN = "test-token";

  try {
    const mode = await recordOpsSignal(
      {
        signalType: "scenario_switch",
        venueState: getScenarioState("accessible-reroute"),
        message: "Testing BigQuery insert.",
      },
      {
        fetchImpl: async (input, init) => {
          assert.match(String(input), /bigquery\.googleapis\.com/);
          assert.equal(init?.headers && "Authorization" in init.headers ? init.headers.Authorization : "", "Bearer test-token");

          return new Response("{}", {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          });
        },
      },
    );

    assert.equal(mode, "bigquery");
  } finally {
    if (previousAccessToken === undefined) {
      delete process.env.GOOGLE_ACCESS_TOKEN;
    } else {
      process.env.GOOGLE_ACCESS_TOKEN = previousAccessToken;
    }
  }
});

test("readOpsAnalytics parses BigQuery aggregates when the service is reachable", async () => {
  const previousAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  process.env.GOOGLE_ACCESS_TOKEN = "test-token";

  try {
    const analytics = await readOpsAnalytics(getScenarioState("pre-entry-rush"), {
      fetchImpl: async (input, init) => {
        assert.match(String(input), /bigquery\.googleapis\.com/);
        assert.equal(init?.headers && "Authorization" in init.headers ? init.headers.Authorization : "", "Bearer test-token");

        return new Response(
          JSON.stringify({
            rows: [
              {
                f: [
                  { v: "pre-entry-rush" },
                  { v: "Pre-entry Rush" },
                  { v: "8" },
                  { v: "2" },
                  { v: "3" },
                  { v: "5" },
                  { v: "4" },
                ],
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

    assert.equal(analytics.mode, "bigquery");
    assert.equal(analytics.totalSignals, 8);
    assert.equal(analytics.hybridAiRuns, 4);
    assert.equal(analytics.scenarioBreakdown[0]?.scenarioId, "pre-entry-rush");
  } finally {
    if (previousAccessToken === undefined) {
      delete process.env.GOOGLE_ACCESS_TOKEN;
    } else {
      process.env.GOOGLE_ACCESS_TOKEN = previousAccessToken;
    }
  }
});
