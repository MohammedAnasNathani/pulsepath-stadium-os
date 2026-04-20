import { getScenarioState, normalizeVenueState } from "@/lib/scenarios";
import { readScenarioState } from "@/lib/google-services";
import { readOpsAnalytics } from "@/lib/ops-analytics";
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
  const normalized = normalizeVenueState(current.state) ?? fallbackState;
  const analytics = await readOpsAnalytics(normalized);

  return Response.json(analytics);
}
