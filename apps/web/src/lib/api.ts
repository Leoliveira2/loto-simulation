import { getToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = new Error(data?.error || "request_failed");
    (err as any).details = data?.details;
    (err as any).status = res.status;
    throw err;
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  listScenarios: () =>
    request<{ scenarios: Array<{ id: string; scenarioId: string; version: string; title: string; updatedAt: string }> }>(
      "/scenarios",
      { method: "GET" }
    ),

  getScenario: (scenarioId: string, version?: string) => {
    const qs = version ? `?version=${encodeURIComponent(version)}` : "";
    return request<{ scenario: { id: string; scenarioId: string; version: string; title: string; json: any } }>(
      `/scenarios/${encodeURIComponent(scenarioId)}${qs}`,
      { method: "GET" }
    );
  },

  startSession: (scenarioId: string, scenarioVersion: string, scenarioDbId?: string) =>
    request<{ session: { id: string; status: string; startedAt: string; scenarioId: string; scenarioVersion: string } }>(
      "/sessions",
      { method: "POST", body: JSON.stringify({ scenarioId, scenarioVersion, scenarioDbId }) }
    ),

  appendEvents: (sessionId: string, events: any[]) =>
    request<{ ok: boolean; inserted: number; ignored: number }>(`/sessions/${sessionId}/events`, {
      method: "POST",
      body: JSON.stringify({ events })
    }),

  completeSession: (sessionId: string, payload: any) =>
    request<{ session: any }>(`/sessions/${sessionId}/complete`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  myHistory: (take = 20, cursor?: string) => {
    const qs = new URLSearchParams();
    qs.set("take", String(take));
    if (cursor) qs.set("cursor", cursor);
    return request<{ sessions: any[]; nextCursor: string | null }>(`/sessions/me/history?${qs.toString()}`, {
      method: "GET"
    });
  },

  getSession: (sessionId: string) => request<{ session: any; events: any[] }>(`/sessions/${sessionId}`, { method: "GET" })
};
