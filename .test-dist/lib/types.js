"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultProfile = exports.incidentSeverities = exports.zoneStatuses = exports.trends = exports.zoneTypes = exports.scenarioIds = exports.budgetModes = exports.groupTypes = exports.mobilityNeeds = exports.goals = exports.personas = void 0;
exports.personas = ["solo-fan", "family", "superfan", "vip-guest"];
exports.goals = [
    "fastest-entry",
    "food-run",
    "merch-stop",
    "restroom-break",
    "accessible-seat-arrival",
    "exit-fast",
];
exports.mobilityNeeds = [
    "none",
    "wheelchair",
    "low-vision",
    "hearing-support",
];
exports.groupTypes = ["solo", "pair", "family", "squad"];
exports.budgetModes = ["value", "flex"];
exports.scenarioIds = [
    "pre-entry-rush",
    "halftime-surge",
    "accessible-reroute",
    "emergency-exit",
];
exports.zoneTypes = [
    "gate",
    "concourse",
    "concession",
    "restroom",
    "merch",
    "assist",
    "exit",
    "plaza",
];
exports.trends = ["rising", "steady", "falling"];
exports.zoneStatuses = ["open", "busy", "limited", "closed"];
exports.incidentSeverities = ["info", "warning", "critical"];
exports.defaultProfile = {
    persona: "family",
    seatZone: "West Concourse",
    goal: "food-run",
    mobilityNeeds: "none",
    budgetMode: "value",
    groupType: "family",
};
