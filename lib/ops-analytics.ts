import {
  getGoogleAccessToken,
  getGoogleProjectId,
} from "./google-services";
import type {
  CrowdReport,
  OpsAnalyticsSnapshot,
  OpsSignalType,
  RecommendationResponse,
  ScenarioAnalytics,
  ScenarioId,
  VenueState,
} from "./types";

export const BIGQUERY_DATASET_ID = "pulsepath_analytics";
export const BIGQUERY_TABLE_ID = "ops_signals";

type OpsSignalInput = {
  signalType: OpsSignalType;
  venueState: VenueState;
  zoneId?: string;
  sentiment?: CrowdReport["sentiment"];
  message?: string;
  modelMode?: RecommendationResponse["modelMode"];
  createdAt?: string;
};

type AnalyticsOptions = {
  fetchImpl?: typeof fetch;
};

type BigQueryRow = {
  f: Array<{ v: string | null }>;
};

function computeAverageQueue(state: VenueState) {
  const total = state.zones.reduce((sum, zone) => sum + zone.waitMins, 0);
  return Number((total / state.zones.length).toFixed(1));
}

function computeTopPressureZone(state: VenueState) {
  return state.zones
    .slice()
    .sort((left, right) => (right.density + right.waitMins * 2) - (left.density + left.waitMins * 2))[0]?.label ?? "Unknown";
}

export function buildDerivedOpsAnalytics(state: VenueState): OpsAnalyticsSnapshot {
  const currentScenario: ScenarioAnalytics = {
    scenarioId: state.scenarioId,
    label: state.scenarioLabel,
    totalSignals: 0,
    crowdReports: 0,
    scenarioSwitches: 0,
    assistantRuns: 0,
    hybridAiRuns: 0,
  };

  return {
    mode: "derived",
    datasetId: BIGQUERY_DATASET_ID,
    tableId: BIGQUERY_TABLE_ID,
    updatedAt: new Date().toISOString(),
    totalSignals: 0,
    crowdReports: 0,
    scenarioSwitches: 0,
    assistantRuns: 0,
    hybridAiRuns: 0,
    averageQueueMins: computeAverageQueue(state),
    topPressureZone: computeTopPressureZone(state),
    scenarioBreakdown: [currentScenario],
  };
}

function buildInsertUrl() {
  return `https://bigquery.googleapis.com/bigquery/v2/projects/${getGoogleProjectId()}/datasets/${BIGQUERY_DATASET_ID}/tables/${BIGQUERY_TABLE_ID}/insertAll`;
}

function buildQueryUrl() {
  return `https://bigquery.googleapis.com/bigquery/v2/projects/${getGoogleProjectId()}/queries`;
}

function buildSignalRow(input: OpsSignalInput) {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const densityPeak = Math.max(...input.venueState.zones.map((zone) => zone.density));
  const averageQueueMins = computeAverageQueue(input.venueState);

  return {
    signalType: input.signalType,
    scenarioId: input.venueState.scenarioId,
    scenarioLabel: input.venueState.scenarioLabel,
    zoneId: input.zoneId ?? "",
    sentiment: input.sentiment ?? "",
    modelMode: input.modelMode ?? "",
    message: input.message ?? "",
    densityPeak,
    averageQueueMins,
    createdAt,
  };
}

export async function recordOpsSignal(
  input: OpsSignalInput,
  options: AnalyticsOptions = {},
) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const accessToken = await getGoogleAccessToken(fetchImpl);

  if (!accessToken) {
    return "derived" as const;
  }

  const response = await fetchImpl(buildInsertUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      skipInvalidRows: true,
      ignoreUnknownValues: true,
      rows: [
        {
          insertId: `${input.signalType}-${input.createdAt ?? Date.now()}`,
          json: buildSignalRow(input),
        },
      ],
    }),
    signal: AbortSignal.timeout(2500),
  }).catch(() => null);

  return response?.ok ? ("bigquery" as const) : ("derived" as const);
}

function buildQuery() {
  return `
    SELECT
      scenarioId,
      ANY_VALUE(scenarioLabel) AS scenarioLabel,
      COUNT(*) AS totalSignals,
      COUNTIF(signalType = 'crowd_report') AS crowdReports,
      COUNTIF(signalType = 'scenario_switch') AS scenarioSwitches,
      COUNTIF(signalType = 'assistant_request') AS assistantRuns,
      COUNTIF(modelMode = 'hybrid-ai') AS hybridAiRuns
    FROM \`${getGoogleProjectId()}.${BIGQUERY_DATASET_ID}.${BIGQUERY_TABLE_ID}\`
    WHERE createdAt >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 48 HOUR)
    GROUP BY scenarioId
    ORDER BY totalSignals DESC
    LIMIT 4
  `;
}

function parseScenarioRows(rows: BigQueryRow[] | undefined) {
  if (!rows?.length) {
    return [];
  }

  return rows.map((row) => {
    const [scenarioId, label, totalSignals, crowdReports, scenarioSwitches, assistantRuns, hybridAiRuns] =
      row.f.map((cell) => cell.v ?? "");

    return {
      scenarioId: scenarioId as ScenarioId,
      label: String(label),
      totalSignals: Number(totalSignals),
      crowdReports: Number(crowdReports),
      scenarioSwitches: Number(scenarioSwitches),
      assistantRuns: Number(assistantRuns),
      hybridAiRuns: Number(hybridAiRuns),
    } satisfies ScenarioAnalytics;
  });
}

export async function readOpsAnalytics(
  state: VenueState,
  options: AnalyticsOptions = {},
): Promise<OpsAnalyticsSnapshot> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const accessToken = await getGoogleAccessToken(fetchImpl);

  if (!accessToken) {
    return buildDerivedOpsAnalytics(state);
  }

  const response = await fetchImpl(buildQueryUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: buildQuery(),
      useLegacySql: false,
      timeoutMs: 2500,
    }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => null);

  if (!response?.ok) {
    return buildDerivedOpsAnalytics(state);
  }

  const payload = (await response.json()) as {
    rows?: BigQueryRow[];
  };
  const scenarioBreakdown = parseScenarioRows(payload.rows);

  if (!scenarioBreakdown.length) {
    return {
      ...buildDerivedOpsAnalytics(state),
      mode: "bigquery",
    };
  }

  return {
    mode: "bigquery",
    datasetId: BIGQUERY_DATASET_ID,
    tableId: BIGQUERY_TABLE_ID,
    updatedAt: new Date().toISOString(),
    totalSignals: scenarioBreakdown.reduce((sum, row) => sum + row.totalSignals, 0),
    crowdReports: scenarioBreakdown.reduce((sum, row) => sum + row.crowdReports, 0),
    scenarioSwitches: scenarioBreakdown.reduce((sum, row) => sum + row.scenarioSwitches, 0),
    assistantRuns: scenarioBreakdown.reduce((sum, row) => sum + row.assistantRuns, 0),
    hybridAiRuns: scenarioBreakdown.reduce((sum, row) => sum + row.hybridAiRuns, 0),
    averageQueueMins: computeAverageQueue(state),
    topPressureZone: computeTopPressureZone(state),
    scenarioBreakdown,
  };
}
