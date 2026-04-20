export const personas = ["solo-fan", "family", "superfan", "vip-guest"] as const;
export const goals = [
  "fastest-entry",
  "food-run",
  "merch-stop",
  "restroom-break",
  "accessible-seat-arrival",
  "exit-fast",
] as const;
export const mobilityNeeds = [
  "none",
  "wheelchair",
  "low-vision",
  "hearing-support",
] as const;
export const groupTypes = ["solo", "pair", "family", "squad"] as const;
export const budgetModes = ["value", "flex"] as const;
export const scenarioIds = [
  "pre-entry-rush",
  "halftime-surge",
  "accessible-reroute",
  "emergency-exit",
] as const;
export const zoneTypes = [
  "gate",
  "concourse",
  "concession",
  "restroom",
  "merch",
  "assist",
  "exit",
  "plaza",
] as const;
export const trends = ["rising", "steady", "falling"] as const;
export const zoneStatuses = ["open", "busy", "limited", "closed"] as const;
export const incidentSeverities = ["info", "warning", "critical"] as const;

export type Persona = (typeof personas)[number];
export type Goal = (typeof goals)[number];
export type MobilityNeed = (typeof mobilityNeeds)[number];
export type GroupType = (typeof groupTypes)[number];
export type BudgetMode = (typeof budgetModes)[number];
export type ScenarioId = (typeof scenarioIds)[number];
export type ZoneType = (typeof zoneTypes)[number];
export type Trend = (typeof trends)[number];
export type ZoneStatus = (typeof zoneStatuses)[number];
export type IncidentSeverity = (typeof incidentSeverities)[number];

export interface UserProfile {
  persona: Persona;
  seatZone: string;
  goal: Goal;
  mobilityNeeds: MobilityNeed;
  budgetMode: BudgetMode;
  groupType: GroupType;
}

export interface ZoneState {
  zoneId: string;
  label: string;
  zoneType: ZoneType;
  density: number;
  waitMins: number;
  trend: Trend;
  accessibilityScore: number;
  status: ZoneStatus;
  distanceFromEntry: number;
  amenities: string[];
}

export interface Incident {
  type: string;
  severity: IncidentSeverity;
  affectedZones: string[];
  message: string;
  rerouteBias: string;
  timestamp: string;
}

export interface VenueMetric {
  key: string;
  label: string;
  value: string;
  delta: string;
  tone: "positive" | "warning" | "critical";
}

export interface VenueState {
  scenarioId: ScenarioId;
  scenarioLabel: string;
  narrative: string;
  matchLabel: string;
  lastUpdated: string;
  recommendedPersona: Persona;
  alerts: string[];
  zones: ZoneState[];
  incidents: Incident[];
  metrics: VenueMetric[];
}

export interface RouteStep {
  label: string;
  detail: string;
  zoneId: string;
  emphasis: "move" | "wait" | "assist" | "alert";
}

export interface RankedAction {
  id: string;
  title: string;
  destinationZoneId: string;
  summary: string;
  etaMins: number;
  queueMins: number;
  confidence: number;
  score: number;
  reasons: string[];
  routeSteps: RouteStep[];
}

export interface RecommendationRequest {
  profile: UserProfile;
  currentZone: string;
  activeScenario: ScenarioId;
  venueState: VenueState;
}

export interface RecommendationResponse {
  scenarioId: ScenarioId;
  headline: string;
  reasoning: string;
  confidence: number;
  rankedActions: RankedAction[];
  announcementCopy?: string;
  modelMode: "deterministic" | "hybrid-ai";
}

export interface CrowdReport {
  zoneId: string;
  sentiment: "better" | "same" | "worse";
  message: string;
  submittedAt: string;
}

export type OpsSignalType = "scenario_switch" | "crowd_report" | "assistant_request";

export interface ScenarioAnalytics {
  scenarioId: ScenarioId;
  label: string;
  totalSignals: number;
  crowdReports: number;
  scenarioSwitches: number;
  assistantRuns: number;
  hybridAiRuns: number;
}

export interface OpsAnalyticsSnapshot {
  mode: "bigquery" | "derived";
  datasetId: string;
  tableId: string;
  updatedAt: string;
  totalSignals: number;
  crowdReports: number;
  scenarioSwitches: number;
  assistantRuns: number;
  hybridAiRuns: number;
  averageQueueMins: number;
  topPressureZone: string;
  scenarioBreakdown: ScenarioAnalytics[];
}

export interface ScenarioCard {
  id: ScenarioId;
  label: string;
  kicker: string;
  focus: string;
}

export const defaultProfile: UserProfile = {
  persona: "family",
  seatZone: "West Concourse",
  goal: "food-run",
  mobilityNeeds: "none",
  budgetMode: "value",
  groupType: "family",
};
