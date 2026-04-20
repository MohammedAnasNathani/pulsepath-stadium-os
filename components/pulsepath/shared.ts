import type { Goal, OpsAnalyticsSnapshot, VenueState } from "@/lib/types";

export type GoogleStatus = {
  mode: "firestore" | "demo";
  projectId: string;
  databaseId: string;
  appHosting: boolean;
  vertexMode: "api-key" | "service-account" | "offline";
};

export type RealtimeMode = "demo" | "listening" | "offline";

export const goalLabels: Record<Goal, string> = {
  "fastest-entry": "Fastest entry",
  "food-run": "Food run",
  "merch-stop": "Merch stop",
  "restroom-break": "Restroom break",
  "accessible-seat-arrival": "Accessible seat arrival",
  "exit-fast": "Exit fast",
};

export const defaultOpsAnalytics: OpsAnalyticsSnapshot = {
  mode: "derived",
  datasetId: "pulsepath_analytics",
  tableId: "ops_signals",
  updatedAt: new Date().toISOString(),
  totalSignals: 0,
  crowdReports: 0,
  scenarioSwitches: 0,
  assistantRuns: 0,
  hybridAiRuns: 0,
  averageQueueMins: 0,
  topPressureZone: "Awaiting sync",
  scenarioBreakdown: [],
};

export function labelForTone(tone: "positive" | "warning" | "critical") {
  return {
    positive: "text-[var(--turf-300)]",
    warning: "text-[var(--amber-300)]",
    critical: "text-[var(--alert-300)]",
  }[tone];
}

export function statusTone(status: VenueState["zones"][number]["status"]) {
  return {
    open: "text-[var(--turf-300)]",
    busy: "text-[var(--amber-300)]",
    limited: "text-[var(--alert-300)]",
    closed: "text-[var(--alert-300)]",
  }[status];
}

export function densityWidth(density: number) {
  return `${Math.max(8, density)}%`;
}
