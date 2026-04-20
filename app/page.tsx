import { PulsePathDashboard } from "@/components/pulsepath-dashboard";
import { getScenarioState } from "@/lib/scenarios";

export default function Home() {
  const initialScenario = getScenarioState("pre-entry-rush");

  return <PulsePathDashboard initialScenario={initialScenario} />;
}
