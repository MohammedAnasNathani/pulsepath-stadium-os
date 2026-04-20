import { getScenarioState } from "@/lib/scenarios";
import { normalizeVenueState } from "@/lib/scenarios";
import { persistScenarioState, readScenarioState } from "@/lib/google-services";
import { scenarioIds } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedScenario = searchParams.get("scenarioId");
  const scenarioId = scenarioIds.includes(requestedScenario as (typeof scenarioIds)[number])
    ? (requestedScenario as (typeof scenarioIds)[number])
    : "pre-entry-rush";

  const fallbackState = getScenarioState(scenarioId);
  const current = await readScenarioState();
  const normalized = normalizeVenueState(current.state);

  if (normalized) {
    return Response.json({
      state: normalized,
      sync: current.sync,
    });
  }

  const sync = await persistScenarioState(fallbackState);

  return Response.json({
    state: fallbackState,
    sync,
  });
}
