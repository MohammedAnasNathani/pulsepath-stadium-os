import { getScenarioState } from "./scenarios";
import type {
  Goal,
  RankedAction,
  RecommendationRequest,
  RecommendationResponse,
  RouteStep,
  UserProfile,
  VenueState,
  ZoneState,
} from "./types";

type GoalBlueprint = {
  title: string;
  description: string;
  candidates: Array<{
    zoneId: string;
    baseEta: number;
    title: string;
    summary: string;
    via: string[];
  }>;
};

const goalBlueprints: Record<Goal, GoalBlueprint> = {
  "fastest-entry": {
    title: "Fastest Entry",
    description: "Prioritize ticket scan speed and calm arrival pressure.",
    candidates: [
      {
        zoneId: "east-gate",
        baseEta: 7,
        title: "Slide to East Gate family lane",
        summary: "East Gate is the most balanced ticketing channel right now.",
        via: ["fan-plaza", "east-gate"],
      },
      {
        zoneId: "north-gate",
        baseEta: 5,
        title: "Hold North Gate only if you are already queue-committed",
        summary: "Still viable for solo fans if bag-check has already been cleared.",
        via: ["north-gate"],
      },
      {
        zoneId: "west-concourse",
        baseEta: 10,
        title: "Use West Concourse overflow entrance",
        summary: "A lower-stress walk that avoids gate bunching.",
        via: ["fan-plaza", "west-concourse"],
      },
    ],
  },
  "food-run": {
    title: "Food Run",
    description: "Protect return-to-seat timing while still giving quality options.",
    candidates: [
      {
        zoneId: "turf-food-hall",
        baseEta: 8,
        title: "Hit Turf Food Hall",
        summary: "Best menu range if the queue stays under control.",
        via: ["west-concourse", "turf-food-hall"],
      },
      {
        zoneId: "fan-plaza",
        baseEta: 6,
        title: "Grab the Fan Plaza kiosks",
        summary: "Smaller menus, but much faster if halftime demand surges.",
        via: ["fan-plaza"],
      },
      {
        zoneId: "merch-hub",
        baseEta: 9,
        title: "Use Merch Hub express pickup combo lane",
        summary: "A smart split-stop when food queues are overheated.",
        via: ["merch-hub"],
      },
    ],
  },
  "merch-stop": {
    title: "Merch Stop",
    description: "Optimize for express pickup and minimal circulation friction.",
    candidates: [
      {
        zoneId: "merch-hub",
        baseEta: 9,
        title: "Go direct to Merch Hub express pickup",
        summary: "The cleanest one-stop merch path with locker support.",
        via: ["west-concourse", "merch-hub"],
      },
      {
        zoneId: "fan-plaza",
        baseEta: 5,
        title: "Browse Fan Plaza pop-up racks first",
        summary: "Lower commitment route if you just need accessories fast.",
        via: ["fan-plaza"],
      },
      {
        zoneId: "east-gate",
        baseEta: 8,
        title: "Use East Gate pickup lockers after arrival",
        summary: "Best if you already pre-ordered jerseys online.",
        via: ["east-gate"],
      },
    ],
  },
  "restroom-break": {
    title: "Restroom Break",
    description: "Minimize queue time and preserve the fastest return lane.",
    candidates: [
      {
        zoneId: "family-restrooms",
        baseEta: 6,
        title: "Head to Family Restrooms",
        summary: "Wide stalls and steadier turnover make this the best default.",
        via: ["west-concourse", "family-restrooms"],
      },
      {
        zoneId: "accessible-lift",
        baseEta: 7,
        title: "Use the accessible support bank nearby",
        summary: "Best when mobility support or wider stalls matter more than speed.",
        via: ["accessible-lift", "family-restrooms"],
      },
      {
        zoneId: "fan-plaza",
        baseEta: 7,
        title: "Take the Fan Plaza facilities",
        summary: "Often overlooked and easier to exit from after use.",
        via: ["fan-plaza"],
      },
    ],
  },
  "accessible-seat-arrival": {
    title: "Accessible Seat Arrival",
    description: "Prioritize dignity, escort quality, and calm route surfaces.",
    candidates: [
      {
        zoneId: "accessible-lift",
        baseEta: 8,
        title: "Use the Accessible Lift Core with staff escort",
        summary: "The primary mobility route when capacity is healthy.",
        via: ["east-gate", "accessible-lift", "west-concourse"],
      },
      {
        zoneId: "west-concourse",
        baseEta: 9,
        title: "Reroute via West Concourse escort lane",
        summary: "Best alternative when the lift is running slow.",
        via: ["east-gate", "west-concourse"],
      },
      {
        zoneId: "east-gate",
        baseEta: 7,
        title: "Start with East Gate staff handoff",
        summary: "The lowest-pressure starting point for accessible wayfinding.",
        via: ["east-gate"],
      },
    ],
  },
  "exit-fast": {
    title: "Exit Fast",
    description: "Move cleanly toward the safest open outbound spine.",
    candidates: [
      {
        zoneId: "south-exit",
        baseEta: 6,
        title: "Move immediately to South Exit Spine",
        summary: "The strongest all-round outbound corridor when pressure is high.",
        via: ["west-concourse", "south-exit"],
      },
      {
        zoneId: "east-gate",
        baseEta: 8,
        title: "Use East Gate secondary exit",
        summary: "Good fallback when southbound traffic becomes mixed.",
        via: ["east-gate"],
      },
      {
        zoneId: "fan-plaza",
        baseEta: 7,
        title: "Stage at Fan Plaza before dispersal",
        summary: "Useful if the venue needs short-term pressure relief before final exit.",
        via: ["fan-plaza", "south-exit"],
      },
    ],
  },
};

function clamp(value: number, lower: number, upper: number) {
  return Math.min(upper, Math.max(lower, value));
}

function zoneIndex(state: VenueState) {
  return new Map(state.zones.map((zone) => [zone.zoneId, zone]));
}

function buildReasons(profile: UserProfile, zone: ZoneState, state: VenueState) {
  const reasons = [
    `${zone.label} is running at ${zone.waitMins} minutes with ${zone.density}% density.`,
  ];

  if (profile.mobilityNeeds !== "none") {
    reasons.push(`Accessibility score is ${zone.accessibilityScore}/100 for ${profile.mobilityNeeds}.`);
  }

  if (profile.budgetMode === "value" && zone.amenities.includes("value-combos")) {
    reasons.push("Value-combo availability keeps this route cost-conscious.");
  }

  if (profile.groupType === "family" && zone.amenities.includes("family-ready")) {
    reasons.push("Family-ready amenities reduce friction for groups and kids.");
  }

  const matchingIncident = state.incidents.find((incident) =>
    incident.affectedZones.includes(zone.zoneId),
  );

  if (matchingIncident) {
    reasons.push(matchingIncident.rerouteBias);
  }

  return reasons;
}

function buildRouteSteps(currentZone: string, option: GoalBlueprint["candidates"][number], zone: ZoneState, state: VenueState): RouteStep[] {
  const steps: RouteStep[] = [
    {
      label: "Start",
      detail: `Move out of ${currentZone} and follow the lowest-pressure concourse signage.`,
      zoneId: currentZone,
      emphasis: "move",
    },
  ];

  for (const viaZoneId of option.via) {
    steps.push({
      label: `Pass ${zoneLabelFor(state, viaZoneId)}`,
      detail:
        viaZoneId === zone.zoneId
          ? `Use ${zone.label} as your primary decision point and reassess density on arrival.`
          : `Stay with the live PulsePath line until ${zoneLabelFor(state, viaZoneId)} clears you onward.`,
      zoneId: viaZoneId,
      emphasis: viaZoneId === "accessible-lift" ? "assist" : "move",
    });
  }

  if (state.incidents.length > 0) {
    steps.push({
      label: "Stay alert",
      detail: state.incidents[0].message,
      zoneId: zone.zoneId,
      emphasis: state.incidents[0].severity === "critical" ? "alert" : "wait",
    });
  }

  return steps;
}

function zoneLabelFor(state: VenueState, zoneId: string) {
  return state.zones.find((zone) => zone.zoneId === zoneId)?.label ?? zoneId;
}

function scoreCandidate(
  profile: UserProfile,
  option: GoalBlueprint["candidates"][number],
  zone: ZoneState,
  state: VenueState,
) {
  let score = 140;
  score -= zone.density * 0.48;
  score -= zone.waitMins * 1.9;
  score -= option.baseEta * 2.4;
  score -= zone.distanceFromEntry * 1.8;

  if (profile.mobilityNeeds !== "none") {
    score -= (100 - zone.accessibilityScore) * 0.8;
  }

  if (profile.mobilityNeeds === "wheelchair" && zone.zoneType === "assist") {
    score += 16;
  }

  if (profile.groupType === "family" && zone.amenities.includes("family-ready")) {
    score += 12;
  }

  if (profile.budgetMode === "value" && zone.amenities.includes("value-combos")) {
    score += 10;
  }

  if (profile.persona === state.recommendedPersona) {
    score += 6;
  }

  if (state.incidents.some((incident) => incident.affectedZones.includes(zone.zoneId))) {
    score -= 12;
  }

  if (state.scenarioId === "emergency-exit" && zone.zoneType === "exit") {
    score += 22;
  }

  if (state.scenarioId === "accessible-reroute" && zone.zoneId === "west-concourse") {
    score += 18;
  }

  return clamp(score, 8, 98);
}

function buildHeadline(goal: Goal, topAction: RankedAction, state: VenueState) {
  const prefixes: Record<Goal, string> = {
    "fastest-entry": "Fastest clean entry",
    "food-run": "Best halftime food move",
    "merch-stop": "Best merch window",
    "restroom-break": "Best restroom lane",
    "accessible-seat-arrival": "Best accessible approach",
    "exit-fast": "Safest exit move",
  };

  return `${prefixes[goal]}: ${topAction.title} during ${state.scenarioLabel}`;
}

function buildFallbackReasoning(profile: UserProfile, state: VenueState, actions: RankedAction[]) {
  const topAction = actions[0];
  const topReasons = topAction.reasons.slice(0, 2).join(" ");
  return `For a ${profile.persona.replace("-", " ")} focused on ${profile.goal.replaceAll("-", " ")}, PulsePath ranks ${topAction.title.toLowerCase()} first because it combines the cleanest live density profile with the strongest route confidence. ${topReasons}`;
}

export function createOpsAnnouncement(state: VenueState, topAction?: RankedAction) {
  const incident = state.incidents[0];

  if (incident?.severity === "critical") {
    return `Attention guests: please move calmly away from ${incident.affectedZones
      .map((zoneId) => zoneLabelFor(state, zoneId))
      .join(" and ")} and follow staff guidance toward ${zoneLabelFor(
      state,
      topAction?.destinationZoneId ?? "south-exit",
    )}.`;
  }

  if (state.scenarioId === "halftime-surge") {
    return "Halftime update: Turf Food Hall is at peak load. Please use Fan Plaza kiosks and return through West Concourse for the quickest route back to your seat.";
  }

  if (state.scenarioId === "accessible-reroute") {
    return "Accessibility update: East Gate and West Concourse escort lanes are active. Please follow PulsePath signage or speak to the nearest staff rover for assisted guidance.";
  }

  return "Arrival update: East Gate is currently the quickest entry option. Please continue scanning PulsePath boards for live gate guidance.";
}

export function buildDeterministicRecommendation(request: RecommendationRequest): RecommendationResponse {
  const goalConfig = goalBlueprints[request.profile.goal];
  const zones = zoneIndex(request.venueState);

  const rankedActions = goalConfig.candidates
    .map((option) => {
      const zone = zones.get(option.zoneId);

      if (!zone) {
        return null;
      }

      const score = scoreCandidate(request.profile, option, zone, request.venueState);
      const reasons = buildReasons(request.profile, zone, request.venueState);

      return {
        id: option.zoneId,
        title: option.title,
        destinationZoneId: option.zoneId,
        summary: option.summary,
        etaMins: option.baseEta + Math.round(zone.distanceFromEntry / 2),
        queueMins: zone.waitMins,
        confidence: clamp(Math.round(score), 18, 98),
        score,
        reasons,
        routeSteps: buildRouteSteps(request.currentZone, option, zone, request.venueState),
      } satisfies RankedAction;
    })
    .filter((action): action is RankedAction => Boolean(action))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  const topAction = rankedActions[0];

  return {
    scenarioId: request.activeScenario,
    headline: buildHeadline(request.profile.goal, topAction, request.venueState),
    reasoning: buildFallbackReasoning(request.profile, request.venueState, rankedActions),
    confidence: clamp(topAction.confidence, 24, 98),
    rankedActions,
    announcementCopy: createOpsAnnouncement(request.venueState, topAction),
    modelMode: "deterministic",
  };
}

type AssistantOptions = {
  disableAi?: boolean;
  fetchImpl?: typeof fetch;
};

async function getHostedAccessToken(fetchImpl: typeof fetch) {
  const staticToken = process.env.GOOGLE_ACCESS_TOKEN;

  if (staticToken) {
    return staticToken;
  }

  if (!process.env.K_SERVICE) {
    return null;
  }

  const response = await fetchImpl(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    {
      headers: {
        "Metadata-Flavor": "Google",
      },
      signal: AbortSignal.timeout(2000),
    },
  ).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const payload = (await response.json()) as { access_token?: string };
  return payload.access_token ?? null;
}

async function createGeminiReasoning(
  request: RecommendationRequest,
  deterministic: RecommendationResponse,
  fetchImpl: typeof fetch,
) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  const prompt = [
    "You are PulsePath, a stadium operations copilot.",
    "Rewrite the deterministic guidance into a concise, safety-aware response.",
    "Keep it under 120 words and mention the scenario and top recommendation.",
    `Scenario: ${request.venueState.scenarioLabel}`,
    `Attendee profile: ${JSON.stringify(request.profile)}`,
    `Current zone: ${request.currentZone}`,
    `Top recommendation: ${JSON.stringify(deterministic.rankedActions[0])}`,
    `Incidents: ${JSON.stringify(request.venueState.incidents)}`,
  ].join("\n");

  let response: Response | null = null;

  if (apiKey) {
    response = await fetchImpl(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: AbortSignal.timeout(6000),
      },
    ).catch(() => null);
  } else {
    const accessToken = await getHostedAccessToken(fetchImpl);
    const projectId =
      process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.GCLOUD_PROJECT ??
      process.env.FIREBASE_PROJECT_ID ??
      "kydo-project";
    const location = process.env.GOOGLE_VERTEX_LOCATION ?? "us-central1";

    if (accessToken) {
      response = await fetchImpl(
        `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 140,
            },
          }),
          signal: AbortSignal.timeout(6000),
        },
      ).catch(() => null);
    }
  }

  if (!response?.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  return payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join(" ").trim() || null;
}

export async function buildAssistantResponse(
  request: RecommendationRequest,
  options: AssistantOptions = {},
): Promise<RecommendationResponse> {
  const deterministic = buildDeterministicRecommendation(request);

  if (options.disableAi) {
    return deterministic;
  }

  const aiReasoning = await createGeminiReasoning(
    request,
    deterministic,
    options.fetchImpl ?? fetch,
  ).catch(() => null);

  if (!aiReasoning) {
    return deterministic;
  }

  return {
    ...deterministic,
    reasoning: aiReasoning,
    modelMode: "hybrid-ai",
  };
}

export function buildRecommendationRequestFromScenario(
  profile: UserProfile,
  currentZone: string,
  scenarioId: RecommendationRequest["activeScenario"],
): RecommendationRequest {
  const venueState = getScenarioState(scenarioId);

  return {
    profile,
    currentZone,
    activeScenario: scenarioId,
    venueState,
  };
}
