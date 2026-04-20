"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  buildDeterministicRecommendation,
  createOpsAnnouncement,
} from "@/lib/recommendation-engine";
import { getScenarioCards } from "@/lib/scenarios";
import {
  defaultProfile,
  goals,
  mobilityNeeds,
  type OpsAnalyticsSnapshot,
  personas,
  groupTypes,
  budgetModes,
  type CrowdReport,
  type Goal,
  type RecommendationResponse,
  type ScenarioId,
  type UserProfile,
  type VenueState,
} from "@/lib/types";

const scenarioCards = getScenarioCards();

const goalLabels: Record<Goal, string> = {
  "fastest-entry": "Fastest entry",
  "food-run": "Food run",
  "merch-stop": "Merch stop",
  "restroom-break": "Restroom break",
  "accessible-seat-arrival": "Accessible seat arrival",
  "exit-fast": "Exit fast",
};

type Props = {
  initialScenario: VenueState;
};

type GoogleStatus = {
  mode: "firestore" | "demo";
  projectId: string;
  databaseId: string;
  appHosting: boolean;
  vertexMode: "api-key" | "service-account" | "offline";
};

const defaultOpsAnalytics: OpsAnalyticsSnapshot = {
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

function labelForTone(tone: "positive" | "warning" | "critical") {
  return {
    positive: "text-[var(--turf-300)]",
    warning: "text-[var(--amber-300)]",
    critical: "text-[var(--alert-300)]",
  }[tone];
}

function statusTone(status: VenueState["zones"][number]["status"]) {
  return {
    open: "text-[var(--turf-300)]",
    busy: "text-[var(--amber-300)]",
    limited: "text-[var(--alert-300)]",
    closed: "text-[var(--alert-300)]",
  }[status];
}

function densityWidth(density: number) {
  return `${Math.max(8, density)}%`;
}

export function PulsePathDashboard({ initialScenario }: Props) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [activeScenario, setActiveScenario] = useState<ScenarioId>(initialScenario.scenarioId);
  const [venueState, setVenueState] = useState<VenueState>(initialScenario);
  const [currentZone, setCurrentZone] = useState("West Concourse");
  const [assistantOverride, setAssistantOverride] = useState<{
    key: string;
    value: RecommendationResponse;
  } | null>(null);
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>({
    mode: "demo",
    projectId: "kydo-project",
    databaseId: "firestoredatabaseil",
    appHosting: false,
    vertexMode: "offline",
  });
  const [opsAnalytics, setOpsAnalytics] = useState<OpsAnalyticsSnapshot>(defaultOpsAnalytics);
  const [realtimeMode, setRealtimeMode] = useState<"demo" | "listening" | "offline">("demo");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [reportMessage, setReportMessage] = useState("Crowd felt smoother than expected once rerouted.");
  const [isScenarioPending, startScenarioTransition] = useTransition();
  const [isAssistantPending, startAssistantTransition] = useTransition();
  const [isReportPending, startReportTransition] = useTransition();

  const requestKey = JSON.stringify({
    activeScenario,
    currentZone,
    profile,
    lastUpdated: venueState.lastUpdated,
  });

  const fallbackRecommendation = useMemo(
    () =>
      buildDeterministicRecommendation({
        profile,
        currentZone,
        activeScenario,
        venueState,
      }),
    [activeScenario, currentZone, profile, venueState],
  );

  const assistantResponse =
    assistantOverride?.key === requestKey ? assistantOverride.value : fallbackRecommendation;
  const opsAnnouncement = createOpsAnnouncement(venueState, assistantResponse.rankedActions[0]);

  const refreshOpsAnalytics = async (scenarioId: ScenarioId) => {
    const response = await fetch(`/api/ops-analytics?scenarioId=${scenarioId}`, {
      cache: "no-store",
    }).catch(() => null);

    if (!response?.ok) {
      return;
    }

    const payload = (await response.json()) as OpsAnalyticsSnapshot;
    setOpsAnalytics(payload);
  };

  useEffect(() => {
    let cancelled = false;

    const refreshLiveState = async () => {
      const response = await fetch(`/api/live-state?scenarioId=${initialScenario.scenarioId}`, {
        cache: "no-store",
      }).catch(() => null);

      if (!response?.ok) {
        if (!cancelled) {
          setRealtimeMode("offline");
        }
        return;
      }

      const payload = (await response.json()) as {
        state: VenueState;
        sync: GoogleStatus;
      };

      if (cancelled) {
        return;
      }

      setGoogleStatus(payload.sync);
      setRealtimeMode(payload.sync.mode === "firestore" ? "listening" : "demo");
      setVenueState(payload.state);
      setActiveScenario(payload.state.scenarioId);
    };

    void refreshLiveState();

    return () => {
      cancelled = true;
    };
  }, [initialScenario.scenarioId]);

  useEffect(() => {
    if (googleStatus.mode !== "firestore") {
      return;
    }

    const intervalId = window.setInterval(async () => {
      const response = await fetch(`/api/live-state?scenarioId=${activeScenario}`, {
        cache: "no-store",
      }).catch(() => null);

      if (!response?.ok) {
        setRealtimeMode("offline");
        return;
      }

      const payload = (await response.json()) as {
        state: VenueState;
        sync: GoogleStatus;
      };

      setGoogleStatus(payload.sync);
      setRealtimeMode(payload.sync.mode === "firestore" ? "listening" : "demo");
      setVenueState(payload.state);
      setActiveScenario(payload.state.scenarioId);
    }, 7000);

    return () => window.clearInterval(intervalId);
  }, [activeScenario, googleStatus.mode]);

  useEffect(() => {
    let cancelled = false;

    const loadOpsAnalytics = async () => {
      const response = await fetch(`/api/ops-analytics?scenarioId=${activeScenario}`, {
        cache: "no-store",
      }).catch(() => null);

      if (!response?.ok || cancelled) {
        return;
      }

      const payload = (await response.json()) as OpsAnalyticsSnapshot;

      if (!cancelled) {
        setOpsAnalytics(payload);
      }
    };

    void loadOpsAnalytics();
    const intervalId = window.setInterval(() => {
      void loadOpsAnalytics();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeScenario]);

  const askAssistant = () => {
    startAssistantTransition(async () => {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
          currentZone,
          activeScenario,
          venueState,
        }),
      });

      if (!response.ok) {
        setFeedbackNote("PulsePath AI hit a fallback path, so deterministic guidance remains active.");
        return;
      }

      const payload = (await response.json()) as RecommendationResponse;
      setAssistantOverride({ key: requestKey, value: payload });
      setGoogleStatus((current) => ({
        ...current,
        vertexMode: payload.modelMode === "hybrid-ai" ? current.vertexMode : current.vertexMode,
      }));
      setFeedbackNote(
        payload.modelMode === "hybrid-ai"
          ? "Gemini or Vertex AI layered a live explanation on top of the deterministic routing engine."
          : "No live model path responded, so PulsePath stayed in deterministic safety mode.",
      );
      void refreshOpsAnalytics(activeScenario);
    });
  };

  const switchScenario = (scenarioId: ScenarioId) => {
    startScenarioTransition(async () => {
      const response = await fetch("/api/scenario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scenarioId }),
      });

      if (!response.ok) {
        setFeedbackNote("Scenario switch failed, keeping the current state live.");
        return;
      }

      const payload = (await response.json()) as { state: VenueState; sync: GoogleStatus };
      setActiveScenario(scenarioId);
      setVenueState(payload.state);
      setAssistantOverride(null);
      setGoogleStatus(payload.sync);
      setRealtimeMode(payload.sync.mode === "firestore" ? "listening" : "demo");
      setFeedbackNote(
        payload.sync.mode === "firestore"
          ? `Scenario synced to Firestore database ${payload.sync.databaseId} for cross-screen playback.`
          : "Scenario changed locally. Google sync could not be reached, so the app stayed in deterministic demo mode.",
      );
      void refreshOpsAnalytics(scenarioId);
    });
  };

  const submitCrowdReport = () => {
    startReportTransition(async () => {
      const report: CrowdReport = {
        zoneId: assistantResponse.rankedActions[0]?.destinationZoneId ?? "fan-plaza",
        sentiment: "better",
        message: reportMessage,
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        setFeedbackNote("The crowd report could not be stored, but the UI remains functional.");
        return;
      }

      const payload = (await response.json()) as { sync: GoogleStatus };
      setGoogleStatus(payload.sync);
      setFeedbackNote("Crowd report captured. Ops can use this to train future routing policies.");
      void refreshOpsAnalytics(activeScenario);
    });
  };

  const currentScenarioCard = scenarioCards.find((card) => card.id === activeScenario) ?? scenarioCards[0];

  return (
    <main className="ambient-screen relative overflow-hidden">
      <a className="sr-only-focusable" href="#dashboard">
        Skip to PulsePath dashboard
      </a>

      <div className="pointer-events-none absolute inset-x-[-14%] top-[-12%] h-80 rounded-full bg-[radial-gradient(circle,_rgba(80,212,136,0.22),_transparent_62%)] blur-3xl" />
      <div className="floating-orb pointer-events-none absolute right-[-8%] top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(255,191,87,0.18),_transparent_62%)] blur-3xl" />

      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="panel-shell rounded-[2rem] px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="status-pill">
                  <span className="status-dot text-[var(--turf-300)]" />
                  Live venue twin
                </span>
                <span className="status-pill">
                  <span
                    className={`status-dot ${
                      realtimeMode === "listening"
                        ? "text-[var(--turf-300)]"
                        : realtimeMode === "offline"
                          ? "text-[var(--alert-300)]"
                          : "text-[var(--amber-300)]"
                    }`}
                  />
                  {realtimeMode === "listening"
                    ? `Firestore live • ${googleStatus.databaseId}`
                    : realtimeMode === "offline"
                      ? "Realtime unavailable"
                      : "Demo state active"}
                </span>
                <span className="status-pill">
                  <span
                    className={`status-dot ${
                      googleStatus.appHosting ? "text-[var(--turf-300)]" : "text-[var(--amber-300)]"
                    }`}
                  />
                  {googleStatus.appHosting
                    ? `Firebase App Hosting • ${googleStatus.projectId}`
                    : "Hosted demo mode"}
                </span>
              </div>
              <p className="display-kicker text-sm text-[var(--turf-300)]">
                PromptWars Virtual • Physical Event Experience
              </p>
              <h1 className="font-[var(--font-display)] text-5xl leading-none tracking-[0.02em] text-white sm:text-6xl lg:text-7xl">
                PulsePath Stadium OS
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--snow-200)] sm:text-lg">
                A match-day control room and fan copilot in one screen. Judges can test crowd
                movement, wait-time management, accessibility-aware rerouting, and ops
                announcements inside a single cinematic demo.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[26rem]">
              {venueState.metrics.map((metric) => (
                <article key={metric.key} className="metric-card rounded-3xl px-4 py-4">
                  <p className="display-kicker text-xs text-[var(--snow-300)]">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
                  <p className={`mt-1 text-sm ${labelForTone(metric.tone)}`}>{metric.delta}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-7 grid gap-4 rounded-[1.5rem] border border-white/8 bg-black/20 p-4 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="display-kicker text-xs text-[var(--amber-300)]">Demo story</p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{currentScenarioCard.label}</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--snow-200)]">
                    {currentScenarioCard.kicker} {currentScenarioCard.focus}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--line-strong)] bg-[rgba(80,212,136,0.08)] px-4 py-3 text-sm text-[var(--snow-100)]">
                  <div className="display-kicker text-[10px] text-[var(--turf-300)]">Matchday</div>
                  <div className="mt-1">{venueState.matchLabel}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
              <p className="display-kicker text-xs text-[var(--snow-300)]">Why this can win</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--snow-200)]">
                <li>Deterministic routing stays safe even without a live model response.</li>
                <li>App Hosting + Firestore keep the venue twin Google-native and deployable.</li>
                <li>Gemini/Vertex can upgrade explanations on top of the same routing engine.</li>
                <li>BigQuery turns venue decisions into judge-visible ops analytics.</li>
              </ul>
            </div>
          </div>
        </header>

        <section id="dashboard" className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <article className="panel-shell rounded-[2rem] p-5 sm:p-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="display-kicker text-xs text-[var(--turf-300)]">Attendee Copilot</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Personalized match-day routing</h2>
                  </div>
                  <button
                    type="button"
                    onClick={askAssistant}
                    disabled={isAssistantPending}
                    className="glow-accent rounded-full border border-[var(--line-strong)] bg-[rgba(80,212,136,0.12)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(80,212,136,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isAssistantPending ? "Refreshing AI guidance..." : "Ask PulsePath AI"}
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-[var(--snow-300)]">Persona</span>
                    <select
                      value={profile.persona}
                      onChange={(event) =>
                        setProfile((current) => ({ ...current, persona: event.target.value as UserProfile["persona"] }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[var(--line-strong)]"
                    >
                      {personas.map((persona) => (
                        <option key={persona} value={persona}>
                          {persona.replace("-", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[var(--snow-300)]">Current zone</span>
                    <select
                      value={currentZone}
                      onChange={(event) => setCurrentZone(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[var(--line-strong)]"
                    >
                      {venueState.zones.map((zone) => (
                        <option key={zone.zoneId} value={zone.label}>
                          {zone.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[var(--snow-300)]">Goal</span>
                    <select
                      value={profile.goal}
                      onChange={(event) =>
                        setProfile((current) => ({ ...current, goal: event.target.value as Goal }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[var(--line-strong)]"
                    >
                      {goals.map((goal) => (
                        <option key={goal} value={goal}>
                          {goalLabels[goal]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[var(--snow-300)]">Seat zone</span>
                    <input
                      value={profile.seatZone}
                      onChange={(event) =>
                        setProfile((current) => ({ ...current, seatZone: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[var(--line-strong)]"
                      placeholder="West Concourse"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[var(--snow-300)]">Mobility needs</span>
                    <select
                      value={profile.mobilityNeeds}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          mobilityNeeds: event.target.value as UserProfile["mobilityNeeds"],
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[var(--line-strong)]"
                    >
                      {mobilityNeeds.map((mobilityNeed) => (
                        <option key={mobilityNeed} value={mobilityNeed}>
                          {mobilityNeed.replace("-", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="text-[var(--snow-300)]">Budget mode</span>
                      <select
                        value={profile.budgetMode}
                        onChange={(event) =>
                          setProfile((current) => ({
                            ...current,
                            budgetMode: event.target.value as UserProfile["budgetMode"],
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[var(--line-strong)]"
                      >
                        {budgetModes.map((budgetMode) => (
                          <option key={budgetMode} value={budgetMode}>
                            {budgetMode}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-[var(--snow-300)]">Group type</span>
                      <select
                        value={profile.groupType}
                        onChange={(event) =>
                          setProfile((current) => ({
                            ...current,
                            groupType: event.target.value as UserProfile["groupType"],
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[var(--line-strong)]"
                      >
                        {groupTypes.map((groupType) => (
                          <option key={groupType} value={groupType}>
                            {groupType}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="display-kicker text-xs text-[var(--amber-300)]">Assistant verdict</p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">{assistantResponse.headline}</h3>
                      <p
                        aria-live="polite"
                        className="mt-3 max-w-3xl text-sm leading-7 text-[var(--snow-200)]"
                      >
                        {assistantResponse.reasoning}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                      <div className="display-kicker text-[10px] text-[var(--snow-300)]">Model mode</div>
                      <div className="mt-1 text-white">{assistantResponse.modelMode}</div>
                      <div className="mt-2 text-[var(--turf-300)]">
                        Confidence {assistantResponse.confidence}%
                      </div>
                      <div className="mt-2 text-[var(--snow-300)]">
                        Google AI: {googleStatus.vertexMode}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-3">
                    {assistantResponse.rankedActions.map((action, index) => (
                      <article
                        key={action.id}
                        className={`rounded-[1.5rem] border p-4 ${
                          index === 0
                            ? "glow-accent border-[var(--line-strong)] bg-[rgba(80,212,136,0.08)]"
                            : "border-white/8 bg-black/15"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="display-kicker text-xs text-[var(--snow-300)]">
                              Route {index + 1}
                            </div>
                            <h4 className="mt-2 text-lg font-semibold text-white">{action.title}</h4>
                          </div>
                          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--snow-200)]">
                            Score {Math.round(action.score)}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[var(--snow-200)]">{action.summary}</p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--snow-200)]">
                          <span className="status-pill">{action.etaMins} min walk</span>
                          <span className="status-pill">{action.queueMins} min queue</span>
                          <span className="status-pill">{action.confidence}% confidence</span>
                        </div>
                        <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--snow-200)]">
                          {action.routeSteps.slice(0, 3).map((step) => (
                            <li key={`${action.id}-${step.zoneId}-${step.label}`} className="rounded-2xl border border-white/8 bg-black/15 px-3 py-2">
                              <span className="font-semibold text-white">{step.label}:</span> {step.detail}
                            </li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="panel-shell rounded-[2rem] p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="display-kicker text-xs text-[var(--turf-300)]">Live zone telemetry</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Venue pulse map</h2>
                </div>
                <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--snow-200)]">
                  Updated {new Date(venueState.lastUpdated).toLocaleTimeString()}
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <article className="rounded-[1.5rem] border border-[var(--line-strong)] bg-[rgba(80,212,136,0.08)] p-4 lg:col-span-2">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="display-kicker text-xs text-[var(--turf-300)]">Google services proof</div>
                      <h3 className="mt-2 text-xl font-semibold text-white">
                        Live venue twin status
                      </h3>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--snow-200)]">
                        This demo is deployed on Firebase App Hosting and targets Firestore database{" "}
                        <span className="font-semibold text-white">{googleStatus.databaseId}</span>.
                        The attendee assistant remains deterministic by default and upgrades into
                        Google-powered guidance when a live model path is available.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm">
                        <div className="display-kicker text-[10px] text-[var(--snow-300)]">Hosting</div>
                        <div className="mt-1 text-white">{googleStatus.appHosting ? "App Hosting" : "Local/demo"}</div>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm">
                        <div className="display-kicker text-[10px] text-[var(--snow-300)]">Sync</div>
                        <div className="mt-1 text-white">{googleStatus.mode}</div>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm">
                        <div className="display-kicker text-[10px] text-[var(--snow-300)]">AI Path</div>
                        <div className="mt-1 text-white">{googleStatus.vertexMode}</div>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm">
                        <div className="display-kicker text-[10px] text-[var(--snow-300)]">Analytics</div>
                        <div className="mt-1 text-white">{opsAnalytics.mode}</div>
                      </div>
                    </div>
                  </div>
                </article>
                {venueState.zones.map((zone) => (
                  <article key={zone.zoneId} className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{zone.label}</h3>
                        <p className="mt-1 text-sm capitalize text-[var(--snow-300)]">
                          {zone.zoneType} • {zone.trend}
                        </p>
                      </div>
                      <span className={`status-pill ${statusTone(zone.status)}`}>
                        <span className="status-dot" />
                        {zone.status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-[var(--snow-300)]">
                          Density
                        </div>
                        <div className="mt-2 zone-bar h-3">
                          <span style={{ width: densityWidth(zone.density) }} />
                        </div>
                        <div className="mt-2 text-sm text-white">{zone.density}%</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-[var(--snow-300)]">
                          Queue
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-white">{zone.waitMins}m</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-[var(--snow-300)]">
                          Access
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-white">
                          {zone.accessibilityScore}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--snow-200)]">
                      {zone.amenities.slice(0, 3).map((amenity) => (
                        <span key={amenity} className="rounded-full border border-white/8 px-3 py-1 capitalize">
                          {amenity.replace("-", " ")}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <div className="space-y-6">
            <article className="panel-shell rounded-[2rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="display-kicker text-xs text-[var(--amber-300)]">Ops Command</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Scenario control room</h2>
                </div>
                <div className="rounded-2xl border border-white/8 px-4 py-2 text-sm text-[var(--snow-200)]">
                  {isScenarioPending ? "Syncing scenario..." : "Ready"}
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {scenarioCards.map((scenarioCard) => (
                  <button
                    key={scenarioCard.id}
                    type="button"
                    onClick={() => switchScenario(scenarioCard.id)}
                    className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                      scenarioCard.id === activeScenario
                        ? "glow-accent border-[var(--line-strong)] bg-[rgba(80,212,136,0.08)]"
                        : "border-white/8 bg-black/15 hover:bg-black/25"
                    }`}
                  >
                    <div className="display-kicker text-[10px] text-[var(--snow-300)]">Scenario</div>
                    <div className="mt-1 text-lg font-semibold text-white">{scenarioCard.label}</div>
                    <p className="mt-2 text-sm leading-6 text-[var(--snow-200)]">
                      {scenarioCard.focus}
                    </p>
                  </button>
                ))}
              </div>
            </article>

            <article className="panel-shell rounded-[2rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="display-kicker text-xs text-[var(--turf-300)]">BigQuery analytics</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Venue signal warehouse</h2>
                </div>
                <span className="status-pill">
                  <span
                    className={`status-dot ${
                      opsAnalytics.mode === "bigquery" ? "text-[var(--turf-300)]" : "text-[var(--amber-300)]"
                    }`}
                  />
                  {opsAnalytics.mode === "bigquery"
                    ? `${opsAnalytics.datasetId}.${opsAnalytics.tableId}`
                    : "Derived fallback"}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Signals", value: opsAnalytics.totalSignals },
                  { label: "Scenario switches", value: opsAnalytics.scenarioSwitches },
                  { label: "Crowd reports", value: opsAnalytics.crowdReports },
                  { label: "Hybrid AI runs", value: opsAnalytics.hybridAiRuns },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
                    <div className="display-kicker text-[10px] text-[var(--snow-300)]">{metric.label}</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{metric.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
                <div className="flex flex-col gap-2 text-sm text-[var(--snow-200)]">
                  <div>Top pressure zone: <span className="font-semibold text-white">{opsAnalytics.topPressureZone}</span></div>
                  <div>Average queue: <span className="font-semibold text-white">{opsAnalytics.averageQueueMins} min</span></div>
                  <div>Updated: <span className="font-semibold text-white">{new Date(opsAnalytics.updatedAt).toLocaleTimeString()}</span></div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {opsAnalytics.scenarioBreakdown.slice(0, 4).map((scenario) => (
                  <div
                    key={scenario.scenarioId}
                    className="rounded-[1.5rem] border border-white/8 bg-black/15 px-4 py-3 text-sm text-[var(--snow-200)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">{scenario.label}</div>
                      <div>{scenario.totalSignals} signals</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="status-pill">{scenario.crowdReports} crowd reports</span>
                      <span className="status-pill">{scenario.scenarioSwitches} scenario switches</span>
                      <span className="status-pill">{scenario.hybridAiRuns} hybrid AI runs</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel-shell rounded-[2rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="display-kicker text-xs text-[var(--turf-300)]">Ops AI</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Broadcast-ready announcement</h2>
                </div>
                <span className="status-pill">
                  <span className="status-dot text-[var(--amber-300)]" />
                  Dual submission friendly
                </span>
              </div>
              <div className="mt-4 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                <p className="text-sm leading-7 text-[var(--snow-100)]">{opsAnnouncement}</p>
              </div>

              <div className="mt-5">
                <p className="display-kicker text-xs text-[var(--snow-300)]">Active alerts</p>
                <ul className="mt-3 space-y-3">
                  {venueState.incidents.map((incident) => (
                    <li
                      key={`${incident.type}-${incident.timestamp}`}
                      className={`rounded-[1.5rem] border p-4 ${
                        incident.severity === "critical"
                          ? "danger-accent border-[rgba(255,108,97,0.3)] bg-[rgba(255,108,97,0.08)]"
                          : "border-white/8 bg-black/15"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-lg font-semibold text-white">{incident.type.replace("-", " ")}</div>
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--snow-300)]">
                          {incident.timestamp}
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--snow-200)]">{incident.message}</p>
                      <p className="mt-3 text-sm text-[var(--amber-300)]">{incident.rerouteBias}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="panel-shell rounded-[2rem] p-5 sm:p-6">
              <p className="display-kicker text-xs text-[var(--turf-300)]">Build-in-public proof</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Judge-ready evidence pack</h2>
              <div className="mt-5 grid gap-3">
                {[
                  "README tells the product story, architecture, setup, and demo script.",
                  "Technical blog draft is ready for a same-night publish pass.",
                  "LinkedIn draft is tuned for #BuildwithAI #PromptWarsVirtual.",
                  "Antigravity log explains how intent-driven development shaped the app.",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-sm text-[var(--snow-200)]">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                <label className="block text-sm text-[var(--snow-300)]" htmlFor="report-message">
                  Simulated attendee feedback
                </label>
                <textarea
                  id="report-message"
                  value={reportMessage}
                  onChange={(event) => setReportMessage(event.target.value)}
                  className="mt-3 min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[var(--line-strong)]"
                />
                <button
                  type="button"
                  onClick={submitCrowdReport}
                  disabled={isReportPending}
                  className="mt-4 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isReportPending ? "Sending report..." : "Send crowd report"}
                </button>
                {feedbackNote ? (
                  <p className="mt-3 text-sm leading-6 text-[var(--snow-200)]">{feedbackNote}</p>
                ) : null}
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
