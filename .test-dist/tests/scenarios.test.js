"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const scenarios_1 = require("../lib/scenarios");
(0, node_test_1.default)("scenario catalog exposes four distinct demo flows", () => {
    const cards = (0, scenarios_1.getScenarioCards)();
    strict_1.default.equal(cards.length, 4);
    strict_1.default.deepEqual(cards.map((card) => card.id), [
        "pre-entry-rush",
        "halftime-surge",
        "accessible-reroute",
        "emergency-exit",
    ]);
});
(0, node_test_1.default)("emergency exit scenario includes a critical incident and closed concession", () => {
    const state = (0, scenarios_1.getScenarioState)("emergency-exit");
    strict_1.default.equal(state.incidents[0]?.severity, "critical");
    strict_1.default.equal(state.zones.find((zone) => zone.zoneId === "turf-food-hall")?.status, "closed");
});
(0, node_test_1.default)("normalizeVenueState rejects malformed data", () => {
    strict_1.default.equal((0, scenarios_1.normalizeVenueState)({ nope: true }), null);
    strict_1.default.equal((0, scenarios_1.normalizeVenueState)((0, scenarios_1.getScenarioState)("pre-entry-rush"))?.scenarioId, "pre-entry-rush");
});
