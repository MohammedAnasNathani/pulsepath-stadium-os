import { defaultProfile } from "./types";
import {
  budgetModes,
  goals,
  groupTypes,
  incidentSeverities,
  mobilityNeeds,
  personas,
  scenarioIds,
  trends,
  zoneStatuses,
  zoneTypes,
  type CrowdReport,
  type Incident,
  type RecommendationRequest,
  type ScenarioId,
  type UserProfile,
  type VenueMetric,
  type VenueState,
  type ZoneState,
} from "./types";

export class ValidationError extends Error {
  status = 400;
}

function expectObject(value: unknown, field: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${field} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function expectString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} must be a non-empty string.`);
  }

  return value.trim();
}

function expectArray(value: unknown, field: string) {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be an array.`);
  }

  return value;
}

function expectEnum<T extends readonly string[]>(value: unknown, field: string, choices: T): T[number] {
  const parsed = expectString(value, field);

  if (!choices.includes(parsed)) {
    throw new ValidationError(`${field} must be one of: ${choices.join(", ")}.`);
  }

  return parsed as T[number];
}

function expectNumber(value: unknown, field: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ValidationError(`${field} must be a number.`);
  }

  return value;
}

function expectStringArray(value: unknown, field: string) {
  return expectArray(value, field).map((item, index) => expectString(item, `${field}[${index}]`));
}

function parseZoneState(value: unknown, index: number): ZoneState {
  const input = expectObject(value, `venueState.zones[${index}]`);

  return {
    zoneId: expectString(input.zoneId, `venueState.zones[${index}].zoneId`),
    label: expectString(input.label, `venueState.zones[${index}].label`),
    zoneType: expectEnum(input.zoneType, `venueState.zones[${index}].zoneType`, zoneTypes),
    density: expectNumber(input.density, `venueState.zones[${index}].density`),
    waitMins: expectNumber(input.waitMins, `venueState.zones[${index}].waitMins`),
    trend: expectEnum(input.trend, `venueState.zones[${index}].trend`, trends),
    accessibilityScore: expectNumber(
      input.accessibilityScore,
      `venueState.zones[${index}].accessibilityScore`,
    ),
    status: expectEnum(input.status, `venueState.zones[${index}].status`, zoneStatuses),
    distanceFromEntry: expectNumber(
      input.distanceFromEntry,
      `venueState.zones[${index}].distanceFromEntry`,
    ),
    amenities: expectStringArray(input.amenities, `venueState.zones[${index}].amenities`),
  };
}

function parseIncident(value: unknown, index: number): Incident {
  const input = expectObject(value, `venueState.incidents[${index}]`);

  return {
    type: expectString(input.type, `venueState.incidents[${index}].type`),
    severity: expectEnum(
      input.severity,
      `venueState.incidents[${index}].severity`,
      incidentSeverities,
    ),
    affectedZones: expectStringArray(
      input.affectedZones,
      `venueState.incidents[${index}].affectedZones`,
    ),
    message: expectString(input.message, `venueState.incidents[${index}].message`),
    rerouteBias: expectString(input.rerouteBias, `venueState.incidents[${index}].rerouteBias`),
    timestamp: expectString(input.timestamp, `venueState.incidents[${index}].timestamp`),
  };
}

function parseVenueMetric(value: unknown, index: number): VenueMetric {
  const input = expectObject(value, `venueState.metrics[${index}]`);

  return {
    key: expectString(input.key, `venueState.metrics[${index}].key`),
    label: expectString(input.label, `venueState.metrics[${index}].label`),
    value: expectString(input.value, `venueState.metrics[${index}].value`),
    delta: expectString(input.delta, `venueState.metrics[${index}].delta`),
    tone: expectEnum(
      input.tone,
      `venueState.metrics[${index}].tone`,
      ["positive", "warning", "critical"] as const,
    ),
  };
}

export function parseProfile(value: unknown): UserProfile {
  const input = expectObject(value, "profile");

  return {
    persona: expectEnum(input.persona, "profile.persona", personas),
    seatZone: expectString(input.seatZone, "profile.seatZone"),
    goal: expectEnum(input.goal, "profile.goal", goals),
    mobilityNeeds: expectEnum(input.mobilityNeeds, "profile.mobilityNeeds", mobilityNeeds),
    budgetMode: expectEnum(input.budgetMode, "profile.budgetMode", budgetModes),
    groupType: expectEnum(input.groupType, "profile.groupType", groupTypes),
  };
}

export function parseVenueState(value: unknown): VenueState {
  const input = expectObject(value, "venueState");

  return {
    scenarioId: expectEnum(input.scenarioId, "venueState.scenarioId", scenarioIds),
    scenarioLabel: expectString(input.scenarioLabel, "venueState.scenarioLabel"),
    narrative: expectString(input.narrative, "venueState.narrative"),
    matchLabel: expectString(input.matchLabel, "venueState.matchLabel"),
    lastUpdated: expectString(input.lastUpdated, "venueState.lastUpdated"),
    recommendedPersona: expectEnum(
      input.recommendedPersona,
      "venueState.recommendedPersona",
      personas,
    ),
    alerts: expectStringArray(input.alerts, "venueState.alerts"),
    zones: expectArray(input.zones, "venueState.zones").map((zone, index) =>
      parseZoneState(zone, index),
    ),
    incidents: expectArray(input.incidents, "venueState.incidents").map((incident, index) =>
      parseIncident(incident, index),
    ),
    metrics: expectArray(input.metrics, "venueState.metrics").map((metric, index) =>
      parseVenueMetric(metric, index),
    ),
  };
}

export function parseAssistantRequest(value: unknown): RecommendationRequest {
  const input = expectObject(value, "request");

  return {
    profile: parseProfile(input.profile),
    currentZone: expectString(input.currentZone, "currentZone"),
    activeScenario: expectEnum(input.activeScenario, "activeScenario", scenarioIds),
    venueState: parseVenueState(input.venueState),
  };
}

export function parseScenarioId(value: unknown): ScenarioId {
  const input = expectObject(value, "scenario");

  return expectEnum(input.scenarioId, "scenarioId", scenarioIds);
}

export function parseCrowdReport(value: unknown): CrowdReport {
  const input = expectObject(value, "report");
  const sentiment = expectString(input.sentiment, "sentiment");

  if (!["better", "same", "worse"].includes(sentiment)) {
    throw new ValidationError("sentiment must be one of: better, same, worse.");
  }

  return {
    zoneId: expectString(input.zoneId, "zoneId"),
    sentiment: sentiment as CrowdReport["sentiment"],
    message: expectString(input.message, "message"),
    submittedAt:
      typeof input.submittedAt === "string" && input.submittedAt
        ? input.submittedAt
        : new Date().toISOString(),
  };
}

export function createDefaultRequest(venueState: VenueState): RecommendationRequest {
  return {
    profile: defaultProfile,
    currentZone: "West Concourse",
    activeScenario: venueState.scenarioId,
    venueState,
  };
}
