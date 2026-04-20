import type { OpsAnalyticsSnapshot, ScenarioCard, VenueState } from "@/lib/types";
import { labelForTone, type GoogleStatus, type RealtimeMode } from "./shared";

type Props = {
  currentScenarioCard: ScenarioCard;
  googleStatus: GoogleStatus;
  opsAnalytics: OpsAnalyticsSnapshot;
  realtimeMode: RealtimeMode;
  venueState: VenueState;
};

export function DashboardHeader({
  currentScenarioCard,
  googleStatus,
  opsAnalytics,
  realtimeMode,
  venueState,
}: Props) {
  return (
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
            <li>Architecture now separates the attendee surface from ops and telemetry modules.</li>
          </ul>
          <div className="mt-3 text-xs text-[var(--snow-300)]">
            Analytics mode: <span className="font-semibold text-white">{opsAnalytics.mode}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
