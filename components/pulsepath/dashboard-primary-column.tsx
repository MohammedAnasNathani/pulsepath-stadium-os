import type { Dispatch, SetStateAction } from "react";
import {
  budgetModes,
  goals,
  groupTypes,
  mobilityNeeds,
  personas,
  type OpsAnalyticsSnapshot,
  type RecommendationResponse,
  type UserProfile,
  type VenueState,
} from "@/lib/types";
import {
  densityWidth,
  goalLabels,
  statusTone,
  type GoogleStatus,
} from "./shared";

type Props = {
  askAssistant: () => void;
  assistantResponse: RecommendationResponse;
  currentZone: string;
  googleStatus: GoogleStatus;
  isAssistantPending: boolean;
  opsAnalytics: OpsAnalyticsSnapshot;
  profile: UserProfile;
  setCurrentZone: Dispatch<SetStateAction<string>>;
  setProfile: Dispatch<SetStateAction<UserProfile>>;
  venueState: VenueState;
};

export function DashboardPrimaryColumn({
  askAssistant,
  assistantResponse,
  currentZone,
  googleStatus,
  isAssistantPending,
  opsAnalytics,
  profile,
  setCurrentZone,
  setProfile,
  venueState,
}: Props) {
  return (
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
                  setProfile((current) => ({
                    ...current,
                    persona: event.target.value as UserProfile["persona"],
                  }))
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
                  setProfile((current) => ({ ...current, goal: event.target.value as UserProfile["goal"] }))
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
                      <li
                        key={`${action.id}-${step.zoneId}-${step.label}`}
                        className="rounded-2xl border border-white/8 bg-black/15 px-3 py-2"
                      >
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
                <h3 className="mt-2 text-xl font-semibold text-white">Live venue twin status</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--snow-200)]">
                  This demo is deployed on Firebase App Hosting and targets Firestore database{" "}
                  <span className="font-semibold text-white">{googleStatus.databaseId}</span>.
                  The attendee assistant remains deterministic by default and upgrades into
                  Google-powered guidance when a live model path is available.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-4">
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
  );
}
