import { defaultProfile } from "./types";
import {
  budgetModes,
  goals,
  groupTypes,
  mobilityNeeds,
  personas,
  scenarioIds,
  type CrowdReport,
  type RecommendationRequest,
  type ScenarioId,
  type UserProfile,
  type VenueState,
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
  expectArray(input.zones, "venueState.zones");
  expectArray(input.metrics, "venueState.metrics");
  expectArray(input.alerts, "venueState.alerts");
  expectArray(input.incidents, "venueState.incidents");

  return input as unknown as VenueState;
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
