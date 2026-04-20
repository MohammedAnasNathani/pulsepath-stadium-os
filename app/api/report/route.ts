import { persistCrowdReport } from "@/lib/google-services";
import { ValidationError, parseCrowdReport } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const report = parseCrowdReport(body);
    const sync = await persistCrowdReport(report);

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
