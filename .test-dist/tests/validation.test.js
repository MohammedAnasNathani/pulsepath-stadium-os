"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const scenarios_1 = require("../lib/scenarios");
const validation_1 = require("../lib/validation");
const types_1 = require("../lib/types");
(0, node_test_1.default)("parseAssistantRequest accepts a valid payload", () => {
    const venueState = (0, scenarios_1.getScenarioState)("pre-entry-rush");
    const parsed = (0, validation_1.parseAssistantRequest)({
        profile: types_1.defaultProfile,
        currentZone: "Fan Plaza",
        activeScenario: "pre-entry-rush",
        venueState,
    });
    strict_1.default.equal(parsed.profile.persona, types_1.defaultProfile.persona);
    strict_1.default.equal(parsed.activeScenario, "pre-entry-rush");
});
(0, node_test_1.default)("parseAssistantRequest rejects invalid enum values", () => {
    strict_1.default.throws(() => (0, validation_1.parseAssistantRequest)({
        profile: {
            ...types_1.defaultProfile,
            persona: "mystery",
        },
        currentZone: "Fan Plaza",
        activeScenario: "pre-entry-rush",
        venueState: (0, scenarios_1.getScenarioState)("pre-entry-rush"),
    }), validation_1.ValidationError);
});
(0, node_test_1.default)("parseScenarioId and parseCrowdReport validate user input", () => {
    strict_1.default.equal((0, validation_1.parseScenarioId)({ scenarioId: "halftime-surge" }), "halftime-surge");
    strict_1.default.equal((0, validation_1.parseCrowdReport)({
        zoneId: "fan-plaza",
        sentiment: "better",
        message: "Queues moved quickly after reroute.",
    }).sentiment, "better");
});
