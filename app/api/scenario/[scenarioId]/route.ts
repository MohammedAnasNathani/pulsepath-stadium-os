import { getScenarioState } from "@/lib/scenarios";
import { scenarioIds } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scenarioId: string }> },
) {
  const { scenarioId } = await params;

  if (!scenarioIds.includes(scenarioId as (typeof scenarioIds)[number])) {
    return Response.json({ error: "Unknown scenario." }, { status: 404 });
  }

  return Response.json(getScenarioState(scenarioId as (typeof scenarioIds)[number]));
}
