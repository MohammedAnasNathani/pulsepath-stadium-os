"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
exports.parseProfile = parseProfile;
exports.parseVenueState = parseVenueState;
exports.parseAssistantRequest = parseAssistantRequest;
exports.parseScenarioId = parseScenarioId;
exports.parseCrowdReport = parseCrowdReport;
exports.createDefaultRequest = createDefaultRequest;
const types_1 = require("./types");
const types_2 = require("./types");
class ValidationError extends Error {
    status = 400;
}
exports.ValidationError = ValidationError;
function expectObject(value, field) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new ValidationError(`${field} must be an object.`);
    }
    return value;
}
function expectString(value, field) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new ValidationError(`${field} must be a non-empty string.`);
    }
    return value.trim();
}
function expectArray(value, field) {
    if (!Array.isArray(value)) {
        throw new ValidationError(`${field} must be an array.`);
    }
    return value;
}
function expectEnum(value, field, choices) {
    const parsed = expectString(value, field);
    if (!choices.includes(parsed)) {
        throw new ValidationError(`${field} must be one of: ${choices.join(", ")}.`);
    }
    return parsed;
}
function parseProfile(value) {
    const input = expectObject(value, "profile");
    return {
        persona: expectEnum(input.persona, "profile.persona", types_2.personas),
        seatZone: expectString(input.seatZone, "profile.seatZone"),
        goal: expectEnum(input.goal, "profile.goal", types_2.goals),
        mobilityNeeds: expectEnum(input.mobilityNeeds, "profile.mobilityNeeds", types_2.mobilityNeeds),
        budgetMode: expectEnum(input.budgetMode, "profile.budgetMode", types_2.budgetModes),
        groupType: expectEnum(input.groupType, "profile.groupType", types_2.groupTypes),
    };
}
function parseVenueState(value) {
    const input = expectObject(value, "venueState");
    expectArray(input.zones, "venueState.zones");
    expectArray(input.metrics, "venueState.metrics");
    expectArray(input.alerts, "venueState.alerts");
    expectArray(input.incidents, "venueState.incidents");
    return input;
}
function parseAssistantRequest(value) {
    const input = expectObject(value, "request");
    return {
        profile: parseProfile(input.profile),
        currentZone: expectString(input.currentZone, "currentZone"),
        activeScenario: expectEnum(input.activeScenario, "activeScenario", types_2.scenarioIds),
        venueState: parseVenueState(input.venueState),
    };
}
function parseScenarioId(value) {
    const input = expectObject(value, "scenario");
    return expectEnum(input.scenarioId, "scenarioId", types_2.scenarioIds);
}
function parseCrowdReport(value) {
    const input = expectObject(value, "report");
    const sentiment = expectString(input.sentiment, "sentiment");
    if (!["better", "same", "worse"].includes(sentiment)) {
        throw new ValidationError("sentiment must be one of: better, same, worse.");
    }
    return {
        zoneId: expectString(input.zoneId, "zoneId"),
        sentiment: sentiment,
        message: expectString(input.message, "message"),
        submittedAt: typeof input.submittedAt === "string" && input.submittedAt
            ? input.submittedAt
            : new Date().toISOString(),
    };
}
function createDefaultRequest(venueState) {
    return {
        profile: types_1.defaultProfile,
        currentZone: "West Concourse",
        activeScenario: venueState.scenarioId,
        venueState,
    };
}
