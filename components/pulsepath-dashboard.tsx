"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { DashboardHeader } from "@/components/pulsepath/dashboard-header";
import { DashboardOpsSidebar } from "@/components/pulsepath/dashboard-ops-sidebar";
import { DashboardPrimaryColumn } from "@/components/pulsepath/dashboard-primary-column";
import {
  defaultOpsAnalytics,
  type GoogleStatus,
  type RealtimeMode,
} from "@/components/pulsepath/shared";
import {
  buildDeterministicRecommendation,
  createOpsAnnouncement,
} from "@/lib/recommendation-engine";
import { getScenarioCards } from "@/lib/scenarios";
import {
  defaultProfile,
  type OpsAnalyticsSnapshot,
  type CrowdReport,
  type RecommendationResponse,
  type ScenarioId,
  type UserProfile,
  type VenueState,
} from "@/lib/types";

const scenarioCards = getScenarioCards();

type Props = {
  initialScenario: VenueState;
};

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
  const [realtimeMode, setRealtimeMode] = useState<RealtimeMode>("demo");
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
        <DashboardHeader
          currentScenarioCard={currentScenarioCard}
          googleStatus={googleStatus}
          opsAnalytics={opsAnalytics}
          realtimeMode={realtimeMode}
          venueState={venueState}
        />

        <section id="dashboard" className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <DashboardPrimaryColumn
            askAssistant={askAssistant}
            assistantResponse={assistantResponse}
            currentZone={currentZone}
            googleStatus={googleStatus}
            isAssistantPending={isAssistantPending}
            opsAnalytics={opsAnalytics}
            profile={profile}
            setCurrentZone={setCurrentZone}
            setProfile={setProfile}
            venueState={venueState}
          />
          <DashboardOpsSidebar
            activeScenario={activeScenario}
            feedbackNote={feedbackNote}
            isReportPending={isReportPending}
            isScenarioPending={isScenarioPending}
            opsAnalytics={opsAnalytics}
            opsAnnouncement={opsAnnouncement}
            reportMessage={reportMessage}
            scenarioCards={scenarioCards}
            setReportMessage={setReportMessage}
            submitCrowdReport={submitCrowdReport}
            switchScenario={switchScenario}
            venueState={venueState}
          />
        </section>
      </section>
    </main>
  );
}
