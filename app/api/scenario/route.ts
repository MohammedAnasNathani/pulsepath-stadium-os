import { persistScenarioState } from "@/lib/google-services";
import { recordOpsSignal } from "@/lib/ops-analytics";
import { getScenarioState } from "@/lib/scenarios";
import { ValidationError, parseScenarioId } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const scenarioId = parseScenarioId(body);
    const state = getScenarioState(scenarioId);
    const sync = await persistScenarioState(state);
    await recordOpsSignal({
      signalType: "scenario_switch",
      venueState: state,
      message: state.narrative,
    }).catch(() => "derived");

    return Response.json({
      state,
      sync,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json({ error: "PulsePath could not switch scenarios." }, { status: 500 });
  }
}
