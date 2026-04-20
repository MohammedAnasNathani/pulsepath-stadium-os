import { buildAssistantResponse } from "@/lib/recommendation-engine";
import { recordOpsSignal } from "@/lib/ops-analytics";
import { ValidationError, parseAssistantRequest } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseAssistantRequest(body);
    const recommendation = await buildAssistantResponse(parsed);
    await recordOpsSignal({
      signalType: "assistant_request",
      venueState: parsed.venueState,
      zoneId: parsed.currentZone,
      message: recommendation.headline,
      modelMode: recommendation.modelMode,
    }).catch(() => "derived");

    return Response.json(recommendation);
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "PulsePath could not generate guidance for this request." },
      { status: 500 },
    );
  }
}
