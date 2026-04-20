import { persistCrowdReport } from "@/lib/google-services";
import { recordOpsSignal } from "@/lib/ops-analytics";
import { normalizeVenueState } from "@/lib/scenarios";
import { readScenarioState } from "@/lib/google-services";
import { getScenarioState } from "@/lib/scenarios";
import { ValidationError, parseCrowdReport } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const report = parseCrowdReport(body);
    const sync = await persistCrowdReport(report);
    const current = await readScenarioState();
    const venueState = normalizeVenueState(current.state) ?? getScenarioState("pre-entry-rush");
    await recordOpsSignal({
      signalType: "crowd_report",
      venueState,
      zoneId: report.zoneId,
      sentiment: report.sentiment,
      message: report.message,
      createdAt: report.submittedAt,
    }).catch(() => "derived");

    return Response.json({
      ok: true,
      report,
      sync,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json({ error: "PulsePath could not record the crowd report." }, { status: 500 });
  }
}
