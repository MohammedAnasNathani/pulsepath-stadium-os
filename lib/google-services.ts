import type { CrowdReport, VenueState } from "./types";

function getProjectId() {
  return (
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    null
  );
}

async function getAccessToken() {
  const staticToken = process.env.GOOGLE_ACCESS_TOKEN;

  if (staticToken) {
    return staticToken;
  }

  if (!process.env.K_SERVICE) {
    return null;
  }

  const response = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    {
      headers: {
        "Metadata-Flavor": "Google",
      },
    },
  ).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const payload = (await response.json()) as { access_token?: string };
  return payload.access_token ?? null;
}

type FirestoreValue =
  | { nullValue: null }
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { arrayValue: { values: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (typeof value === "string") {
    const looksLikeIsoDate =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
    return looksLikeIsoDate ? { timestampValue: value } : { stringValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((entry) => toFirestoreValue(entry)),
      },
    };
  }

  const fields = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, toFirestoreValue(entry)]),
  );

  return {
    mapValue: {
      fields,
    },
  };
}

async function patchDocument(documentPath: string, payload: unknown) {
  const projectId = getProjectId();
  const accessToken = await getAccessToken();

  if (!projectId || !accessToken) {
    return { persisted: false as const, mode: "demo" as const };
  }

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${documentPath}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: (toFirestoreValue(payload) as { mapValue: { fields: Record<string, FirestoreValue> } }).mapValue.fields,
      }),
    },
  ).catch(() => null);

  return response?.ok
    ? { persisted: true as const, mode: "firestore" as const }
    : { persisted: false as const, mode: "demo" as const };
}

export async function persistScenarioState(state: VenueState) {
  return patchDocument("pulsepath/live", state);
}

export async function persistCrowdReport(report: CrowdReport) {
  return patchDocument(`pulsepath-reports/${report.submittedAt.replaceAll(/[:.]/g, "-")}`, report);
}

export function getPublicFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  return Object.values(config).every(Boolean) ? config : null;
}
