import type { Dispatch, SetStateAction } from "react";
import type {
  OpsAnalyticsSnapshot,
  ScenarioCard,
  ScenarioId,
  VenueState,
} from "@/lib/types";

type Props = {
  activeScenario: ScenarioId;
  feedbackNote: string;
  isReportPending: boolean;
  isScenarioPending: boolean;
  opsAnalytics: OpsAnalyticsSnapshot;
  opsAnnouncement: string;
  reportMessage: string;
  scenarioCards: ScenarioCard[];
  setReportMessage: Dispatch<SetStateAction<string>>;
  submitCrowdReport: () => void;
  switchScenario: (scenarioId: ScenarioId) => void;
  venueState: VenueState;
};

export function DashboardOpsSidebar({
  activeScenario,
  feedbackNote,
  isReportPending,
  isScenarioPending,
  opsAnalytics,
  opsAnnouncement,
  reportMessage,
  scenarioCards,
  setReportMessage,
  submitCrowdReport,
  switchScenario,
  venueState,
}: Props) {
  return (
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
            <div>
              Top pressure zone: <span className="font-semibold text-white">{opsAnalytics.topPressureZone}</span>
            </div>
            <div>
              Average queue: <span className="font-semibold text-white">{opsAnalytics.averageQueueMins} min</span>
            </div>
            <div>
              Updated: <span className="font-semibold text-white">{new Date(opsAnalytics.updatedAt).toLocaleTimeString()}</span>
            </div>
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
            <div
              key={item}
              className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-sm text-[var(--snow-200)]"
            >
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
  );
}
