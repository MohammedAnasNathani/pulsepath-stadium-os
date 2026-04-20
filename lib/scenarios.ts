import type {
  Incident,
  Persona,
  ScenarioCard,
  ScenarioId,
  VenueMetric,
  VenueState,
  ZoneState,
} from "./types";

const baseZones: ZoneState[] = [
  {
    zoneId: "north-gate",
    label: "North Gate",
    zoneType: "gate",
    density: 58,
    waitMins: 11,
    trend: "steady",
    accessibilityScore: 84,
    status: "open",
    distanceFromEntry: 1,
    amenities: ["bag-check", "mobile-ticket", "shade"],
  },
  {
    zoneId: "east-gate",
    label: "East Gate",
    zoneType: "gate",
    density: 44,
    waitMins: 8,
    trend: "steady",
    accessibilityScore: 91,
    status: "open",
    distanceFromEntry: 2,
    amenities: ["family-lane", "mobile-ticket", "rideshare"],
  },
  {
    zoneId: "turf-food-hall",
    label: "Turf Food Hall",
    zoneType: "concession",
    density: 37,
    waitMins: 7,
    trend: "rising",
    accessibilityScore: 88,
    status: "open",
    distanceFromEntry: 4,
    amenities: ["veg-options", "value-combos", "cashless"],
  },
  {
    zoneId: "fan-plaza",
    label: "Fan Plaza",
    zoneType: "plaza",
    density: 29,
    waitMins: 4,
    trend: "steady",
    accessibilityScore: 90,
    status: "open",
    distanceFromEntry: 2,
    amenities: ["photo-wall", "shade", "info-desk"],
  },
  {
    zoneId: "merch-hub",
    label: "Merch Hub",
    zoneType: "merch",
    density: 34,
    waitMins: 6,
    trend: "rising",
    accessibilityScore: 82,
    status: "open",
    distanceFromEntry: 5,
    amenities: ["express-pickup", "locker", "jersey-heatpress"],
  },
  {
    zoneId: "accessible-lift",
    label: "Accessible Lift Core",
    zoneType: "assist",
    density: 22,
    waitMins: 3,
    trend: "steady",
    accessibilityScore: 99,
    status: "open",
    distanceFromEntry: 3,
    amenities: ["staff-support", "priority-route", "hearing-loop"],
  },
  {
    zoneId: "family-restrooms",
    label: "Family Restrooms",
    zoneType: "restroom",
    density: 24,
    waitMins: 5,
    trend: "steady",
    accessibilityScore: 92,
    status: "open",
    distanceFromEntry: 4,
    amenities: ["changing-table", "family-ready", "wide-stalls"],
  },
  {
    zoneId: "west-concourse",
    label: "West Concourse",
    zoneType: "concourse",
    density: 35,
    waitMins: 4,
    trend: "steady",
    accessibilityScore: 86,
    status: "open",
    distanceFromEntry: 3,
    amenities: ["viewing-bay", "staff-rovers", "wide-corridor"],
  },
  {
    zoneId: "south-exit",
    label: "South Exit Spine",
    zoneType: "exit",
    density: 18,
    waitMins: 2,
    trend: "steady",
    accessibilityScore: 94,
    status: "open",
    distanceFromEntry: 2,
    amenities: ["taxi-queue", "pickup-zone", "medical-post"],
  },
];

const scenarioCards: ScenarioCard[] = [
  {
    id: "pre-entry-rush",
    label: "Pre-entry Rush",
    kicker: "Gates are loading up 22 minutes before kickoff.",
    focus: "Keep arrival times low while dispersing fans toward friendlier gates.",
  },
  {
    id: "halftime-surge",
    label: "Halftime Surge",
    kicker: "Concessions spike as 62,000 fans move at once.",
    focus: "Balance food demand, restroom load, and fast return-to-seat guidance.",
  },
  {
    id: "accessible-reroute",
    label: "Accessible Reroute",
    kicker: "A lift slowdown forces a dignified mobility-first reroute.",
    focus: "Protect accessible journeys with staff-assisted alternative flows.",
  },
  {
    id: "emergency-exit",
    label: "Emergency Exit Coordination",
    kicker: "A localized smoke alert demands fast and calm redirection.",
    focus: "Drive the safest exit plan while keeping announcements clear and concise.",
  },
];

type ScenarioTemplate = {
  label: string;
  narrative: string;
  matchLabel: string;
  recommendedPersona: Persona;
  alerts: string[];
  zoneOverrides: Record<string, Partial<ZoneState>>;
  incidents: Incident[];
};

const scenarioTemplates: Record<ScenarioId, ScenarioTemplate> = {
  "pre-entry-rush": {
    label: "Pre-entry Rush",
    narrative:
      "PulsePath senses an uneven gate load. North Gate is swelling, but East Gate and the Fan Plaza give attendees a faster, calmer path into the bowl.",
    matchLabel: "Mumbai Meteors vs Bengaluru Blaze",
    recommendedPersona: "solo-fan",
    alerts: [
      "North Gate bag-check queues are accelerating.",
      "East Gate family lane is below capacity.",
      "Fan Plaza is a low-friction holding zone for early arrivals.",
    ],
    zoneOverrides: {
      "north-gate": { density: 86, waitMins: 23, trend: "rising", status: "busy" },
      "east-gate": { density: 48, waitMins: 9, trend: "steady", status: "open" },
      "fan-plaza": { density: 36, waitMins: 5, trend: "steady", status: "open" },
      "west-concourse": { density: 41, waitMins: 6, trend: "rising", status: "open" },
    },
    incidents: [
      {
        type: "gate-pressure",
        severity: "warning",
        affectedZones: ["north-gate"],
        message: "North Gate throughput is 28% above forecast after two buses arrived together.",
        rerouteBias: "Shift families and solo fans to East Gate until the bag-check spike cools.",
        timestamp: "T-00:22",
      },
    ],
  },
  "halftime-surge": {
    label: "Halftime Surge",
    narrative:
      "The whole venue pivots at halftime. Food, restrooms, and merch all spike together, so the assistant has to protect return-to-seat timing as much as it protects convenience.",
    matchLabel: "Mumbai Meteors vs Bengaluru Blaze",
    recommendedPersona: "family",
    alerts: [
      "Turf Food Hall is peaking.",
      "Merch Hub express pickup still has headroom.",
      "West Concourse remains the most stable return route.",
    ],
    zoneOverrides: {
      "turf-food-hall": { density: 92, waitMins: 26, trend: "rising", status: "busy" },
      "family-restrooms": { density: 68, waitMins: 14, trend: "rising", status: "busy" },
      "merch-hub": { density: 52, waitMins: 8, trend: "steady", status: "open" },
      "west-concourse": { density: 38, waitMins: 5, trend: "steady", status: "open" },
      "fan-plaza": { density: 22, waitMins: 2, trend: "falling", status: "open" },
    },
    incidents: [
      {
        type: "halftime-surge",
        severity: "warning",
        affectedZones: ["turf-food-hall", "family-restrooms"],
        message: "Concession and restroom demand peaked together 90 seconds after the whistle.",
        rerouteBias: "Promote split-stop journeys with express pickup and lower-density restroom banks.",
        timestamp: "T+00:03",
      },
    ],
  },
  "accessible-reroute": {
    label: "Accessible Reroute",
    narrative:
      "One vertical transport core is running slow, so PulsePath has to protect dignity and confidence for mobility-sensitive guests with staff handoffs and calmer corridors.",
    matchLabel: "Mumbai Meteors vs Bengaluru Blaze",
    recommendedPersona: "vip-guest",
    alerts: [
      "Accessible Lift Core is operating at reduced capacity.",
      "Staff escorts are staged at East Gate and West Concourse.",
      "Priority routes are open for wheelchair and low-vision assistance.",
    ],
    zoneOverrides: {
      "accessible-lift": { density: 76, waitMins: 15, trend: "rising", status: "limited" },
      "east-gate": { density: 39, waitMins: 6, trend: "steady", status: "open" },
      "west-concourse": { density: 31, waitMins: 4, trend: "steady", status: "open" },
      "family-restrooms": { density: 22, waitMins: 3, trend: "steady", status: "open" },
    },
    incidents: [
      {
        type: "lift-slowdown",
        severity: "warning",
        affectedZones: ["accessible-lift"],
        message: "One lift car is cycling slowly, adding 9 minutes to accessible seat arrival.",
        rerouteBias: "Prioritize East Gate handoff and staff-guided escort through West Concourse.",
        timestamp: "T-00:11",
      },
    ],
  },
  "emergency-exit": {
    label: "Emergency Exit Coordination",
    narrative:
      "A localized smoke alert in the west bowl means the venue must issue confident reroutes, avoid panic, and move fans through safe exit spines with clarity.",
    matchLabel: "Mumbai Meteors vs Bengaluru Blaze",
    recommendedPersona: "superfan",
    alerts: [
      "Localized smoke alert near West Concourse food kiosk.",
      "South Exit Spine is the cleanest outbound route.",
      "Ops should deliver one calm announcement every 45 seconds until clear.",
    ],
    zoneOverrides: {
      "west-concourse": { density: 89, waitMins: 18, trend: "rising", status: "limited" },
      "south-exit": { density: 42, waitMins: 6, trend: "rising", status: "open" },
      "north-gate": { density: 61, waitMins: 12, trend: "rising", status: "busy" },
      "fan-plaza": { density: 48, waitMins: 5, trend: "steady", status: "open" },
      "turf-food-hall": { density: 7, waitMins: 0, trend: "falling", status: "closed" },
    },
    incidents: [
      {
        type: "smoke-alert",
        severity: "critical",
        affectedZones: ["west-concourse", "turf-food-hall"],
        message: "A localized smoke alert has closed Turf Food Hall and narrowed one west-bowl corridor.",
        rerouteBias: "Move attendees away from West Concourse and channel them to South Exit Spine.",
        timestamp: "T+00:00",
      },
    ],
  },
};

function buildMetrics(zones: ZoneState[], incidents: Incident[]): VenueMetric[] {
  const averageWait =
    Math.round(zones.reduce((sum, zone) => sum + zone.waitMins, 0) / zones.length) || 0;
  const peakDensity = Math.max(...zones.map((zone) => zone.density));
  const accessFriendly = Math.round(
    zones.reduce((sum, zone) => sum + zone.accessibilityScore, 0) / zones.length,
  );

  return [
    {
      key: "wait",
      label: "Avg Wait",
      value: `${averageWait} min`,
      delta: peakDensity > 80 ? "+3 vs target" : "-2 vs target",
      tone: peakDensity > 80 ? "warning" : "positive",
    },
    {
      key: "density",
      label: "Peak Density",
      value: `${peakDensity}%`,
      delta: peakDensity > 88 ? "critical hotspot" : "contained",
      tone: peakDensity > 88 ? "critical" : "warning",
    },
    {
      key: "access",
      label: "Access Readiness",
      value: `${accessFriendly}/100`,
      delta: incidents.some((incident) => incident.type.includes("lift"))
        ? "escort mode live"
        : "fully staffed",
      tone: incidents.some((incident) => incident.type.includes("lift"))
        ? "warning"
        : "positive",
    },
  ];
}

export function getScenarioCards(): ScenarioCard[] {
  return scenarioCards;
}

export function getScenarioState(scenarioId: ScenarioId): VenueState {
  const template = scenarioTemplates[scenarioId];
  const zones = baseZones.map((zone) => ({
    ...zone,
    ...template.zoneOverrides[zone.zoneId],
  }));

  return {
    scenarioId,
    scenarioLabel: template.label,
    narrative: template.narrative,
    matchLabel: template.matchLabel,
    lastUpdated: new Date().toISOString(),
    recommendedPersona: template.recommendedPersona,
    alerts: template.alerts,
    zones,
    incidents: template.incidents,
    metrics: buildMetrics(zones, template.incidents),
  };
}

export function normalizeVenueState(candidate: unknown): VenueState | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const value = candidate as Partial<VenueState>;

  if (
    typeof value.scenarioId !== "string" ||
    !scenarioCards.some((card) => card.id === value.scenarioId)
  ) {
    return null;
  }

  if (!Array.isArray(value.zones) || !Array.isArray(value.metrics) || !Array.isArray(value.alerts)) {
    return null;
  }

  return value as VenueState;
}
