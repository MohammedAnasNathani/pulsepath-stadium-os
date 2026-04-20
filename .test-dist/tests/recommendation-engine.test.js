"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const recommendation_engine_1 = require("../lib/recommendation-engine");
const scenarios_1 = require("../lib/scenarios");
const types_1 = require("../lib/types");
(0, node_test_1.default)("wheelchair routing favors accessible alternatives during accessible reroute", () => {
    const venueState = (0, scenarios_1.getScenarioState)("accessible-reroute");
    const request = {
        profile: {
            ...types_1.defaultProfile,
            goal: "accessible-seat-arrival",
            mobilityNeeds: "wheelchair",
            persona: "vip-guest",
        },
        currentZone: "East Gate",
        activeScenario: "accessible-reroute",
        venueState,
    };
    const response = (0, recommendation_engine_1.buildDeterministicRecommendation)(request);
    strict_1.default.equal(response.rankedActions[0]?.destinationZoneId, "west-concourse");
    strict_1.default.match(response.headline, /accessible/i);
});
(0, node_test_1.default)("emergency exit scenario prioritizes an exit spine", () => {
    const venueState = (0, scenarios_1.getScenarioState)("emergency-exit");
    const request = {
        profile: {
            ...types_1.defaultProfile,
            goal: "exit-fast",
            persona: "superfan",
        },
        currentZone: "West Concourse",
        activeScenario: "emergency-exit",
        venueState,
    };
    const response = (0, recommendation_engine_1.buildDeterministicRecommendation)(request);
    strict_1.default.equal(response.rankedActions[0]?.destinationZoneId, "south-exit");
    strict_1.default.match(response.announcementCopy ?? "", /move calmly/i);
});
(0, node_test_1.default)("assistant falls back to deterministic mode when AI request fails", async () => {
    const venueState = (0, scenarios_1.getScenarioState)("halftime-surge");
    const request = {
        profile: types_1.defaultProfile,
        currentZone: "West Concourse",
        activeScenario: "halftime-surge",
        venueState,
    };
    const response = await (0, recommendation_engine_1.buildAssistantResponse)(request, {
        fetchImpl: async () => {
            throw new Error("network down");
        },
    });
    strict_1.default.equal(response.modelMode, "deterministic");
    strict_1.default.ok(response.rankedActions.length >= 1);
});
