import type { CrowdReport, VenueState } from "./types";

const FALLBACK_PROJECT_ID = "kydo-project";
const FALLBACK_FIRESTORE_DATABASE_ID = "firestoredatabaseil";
const LIVE_STATE_DOCUMENT_PATH = "pulsepath/live";

function getProjectId() {
  return (
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    FALLBACK_PROJECT_ID
  );
}

function getDatabaseId() {
  return process.env.FIRESTORE_DATABASE_ID ?? FALLBACK_FIRESTORE_DATABASE_ID;
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

export type GoogleSyncMode = "firestore" | "demo";

export type GoogleRuntimeStatus = {
  mode: GoogleSyncMode;
  projectId: string;
  databaseId: string;
  appHosting: boolean;
  vertexMode: "api-key" | "service-account" | "offline";
};

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

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ("nullValue" in value) {
    return null;
  }

  if ("stringValue" in value) {
    return value.stringValue;
  }

  if ("integerValue" in value) {
    return Number(value.integerValue);
  }

  if ("doubleValue" in value) {
    return value.doubleValue;
  }

  if ("booleanValue" in value) {
    return value.booleanValue;
  }

  if ("timestampValue" in value) {
    return value.timestampValue;
  }

  if ("arrayValue" in value) {
    return (value.arrayValue.values ?? []).map((entry) => fromFirestoreValue(entry));
  }

  return Object.fromEntries(
    Object.entries(value.mapValue.fields).map(([key, entry]) => [key, fromFirestoreValue(entry)]),
  );
}

function buildDocumentUrl(documentPath: string) {
  return `https://firestore.googleapis.com/v1/projects/${getProjectId()}/databases/${getDatabaseId()}/documents/${documentPath}`;
}

export function getGoogleRuntimeStatus(mode: GoogleSyncMode): GoogleRuntimeStatus {
  return {
    mode,
    projectId: getProjectId(),
    databaseId: getDatabaseId(),
    appHosting: Boolean(process.env.K_SERVICE),
    vertexMode: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
      ? "api-key"
      : process.env.K_SERVICE || process.env.GOOGLE_ACCESS_TOKEN
        ? "service-account"
        : "offline",
  };
}

async function patchDocument(documentPath: string, payload: unknown) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return getGoogleRuntimeStatus("demo");
  }

  const response = await fetch(
    buildDocumentUrl(documentPath),
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

  return response?.ok ? getGoogleRuntimeStatus("firestore") : getGoogleRuntimeStatus("demo");
}

async function getDocument(documentPath: string) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return null;
  }

  const response = await fetch(buildDocumentUrl(documentPath), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).catch(() => null);

  if (!response || response.status === 404 || !response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    fields?: Record<string, FirestoreValue>;
  };

  if (!payload.fields) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(payload.fields).map(([key, entry]) => [key, fromFirestoreValue(entry)]),
  );
}

export async function persistScenarioState(state: VenueState) {
  return patchDocument(LIVE_STATE_DOCUMENT_PATH, state);
}

export async function readScenarioState() {
  const document = await getDocument(LIVE_STATE_DOCUMENT_PATH);

  return {
    state: document as VenueState | null,
    sync: getGoogleRuntimeStatus(document ? "firestore" : "demo"),
  };
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
