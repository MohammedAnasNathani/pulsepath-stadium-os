import { buildAssistantResponse } from "@/lib/recommendation-engine";
import { ValidationError, parseAssistantRequest } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseAssistantRequest(body);
    const recommendation = await buildAssistantResponse(parsed);

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
