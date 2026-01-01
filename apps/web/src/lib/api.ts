import { getToken } from "./auth";

// ============================================
// CONFIGURAÇÃO DA API
// ============================================
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const REQUEST_TIMEOUT = 30000; // 30 segundos
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

// Validar URL da API
if (typeof window !== "undefined" && !BASE) {
  console.error("❌ NEXT_PUBLIC_API_BASE_URL não está configurado");
}

// ============================================
// UTILITÁRIOS
// ============================================
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// ============================================
// REQUEST COM RETRY
// ============================================
async function request<T>(
  path: string,
  init: RequestInit = {},
  retries = MAX_RETRIES
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = `${BASE}${path}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { ...init, headers });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        const err = new Error(data?.error || "request_failed") as any;
        err.details = data?.details;
        err.status = res.status;

        // Não fazer retry em erros 4xx (client errors)
        if (res.status >= 400 && res.status < 500) {
          throw err;
        }

        // Fazer retry em erros 5xx (server errors)
        if (attempt < retries) {
          console.warn(`⚠️  Request failed (attempt ${attempt + 1}/${retries + 1}), retrying...`);
          await sleep(RETRY_DELAY * (attempt + 1)); // Exponential backoff
          continue;
        }

        throw err;
      }

      return data as T;
    } catch (error: any) {
      // Retry em caso de timeout ou erro de rede
      if (
        (error.name === "AbortError" || error.message.includes("fetch")) &&
        attempt < retries
      ) {
        console.warn(`⚠️  Network error (attempt ${attempt + 1}/${retries + 1}), retrying...`);
        await sleep(RETRY_DELAY * (attempt + 1));
        continue;
      }

      // Se chegou aqui e não há mais retries, lançar o erro
      if (attempt >= retries) {
        console.error("❌ Request failed after all retries:", error);
        throw error;
      }
    }
  }

  // Fallback (nunca deve chegar aqui)
  throw new Error("Request failed unexpectedly");
}

// ============================================
// API METHODS
// ============================================
export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  listScenarios: () =>
    request<{
      scenarios: Array<{
        id: string;
        scenarioId: string;
        version: string;
        title: string;
        updatedAt: string;
      }>;
    }>("/scenarios", { method: "GET" }),

  getScenario: (scenarioId: string, version?: string) => {
    const qs = version ? `?version=${encodeURIComponent(version)}` : "";
    return request<{
      scenario: {
        id: string;
        scenarioId: string;
        version: string;
        title: string;
        json: any;
      };
    }>(`/scenarios/${encodeURIComponent(scenarioId)}${qs}`, { method: "GET" });
  },

  startSession: (
    scenarioId: string,
    scenarioVersion: string,
    scenarioDbId?: string
  ) =>
    request<{
      session: {
        id: string;
        status: string;
        startedAt: string;
        scenarioId: string;
        scenarioVersion: string;
      };
    }>("/sessions", {
      method: "POST",
      body: JSON.stringify({ scenarioId, scenarioVersion, scenarioDbId }),
    }),

  appendEvents: (sessionId: string, events: any[]) =>
    request<{ ok: boolean; inserted: number; ignored: number }>(
      `/sessions/${sessionId}/events`,
      {
        method: "POST",
        body: JSON.stringify({ events }),
      }
    ),

  completeSession: (sessionId: string, payload: any) =>
    request<{ session: any }>(`/sessions/${sessionId}/complete`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  myHistory: (take = 20, cursor?: string) => {
    const qs = new URLSearchParams();
    qs.set("take", String(take));
    if (cursor) qs.set("cursor", cursor);
    return request<{ sessions: any[]; nextCursor: string | null }>(
      `/sessions/me/history?${qs.toString()}`,
      { method: "GET" }
    );
  },

  getSession: (sessionId: string) =>
    request<{ session: any; events: any[] }>(`/sessions/${sessionId}`, {
      method: "GET",
    }),
};

// ============================================
// HEALTH CHECK
// ============================================
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${BASE}/health`, {}, 5000);
    return response.ok;
  } catch {
    return false;
  }
}
