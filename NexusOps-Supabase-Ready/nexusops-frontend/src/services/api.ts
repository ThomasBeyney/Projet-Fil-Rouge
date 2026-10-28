export type Equipment = {
  id: number;
  name: string;
  type: string;
  site: string;
  status: "online" | "offline" | "unknown";
  monitor_host: string | null;
  monitoring_enabled: boolean;
  last_checked_at: string | null;
  response_ms: number | null;
};
export type Incident = {
  id: number;
  title: string;
  severity: "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved";
  equipmentId: number;
};
export type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
};
export type Collection = "equipment" | "incidents" | "users";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("API inaccessible. Vérifiez que FastAPI et PostgreSQL sont démarrés.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    throw new Error(typeof detail === "string" ? detail : `Erreur HTTP ${response.status}`);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const api = {
  list: <T>(collection: Collection) => request<T[]>(`/${collection}`),
  save: <T extends { id: number }>(collection: Collection, item: T) =>
    request<T>(`/${collection}${item.id ? `/${item.id}` : ""}`, {
      method: item.id ? "PUT" : "POST",
      body: JSON.stringify(Object.fromEntries(Object.entries(item).filter(([key]) => key !== "id" && (collection !== "equipment" || !["status", "last_checked_at", "response_ms"].includes(key))))),
    }),
  remove: (collection: Collection, id: number) => request<void>(`/${collection}/${id}`, { method: "DELETE" }),
  check: (id: number) => request<Equipment>(`/equipment/${id}/check`, { method: "POST" }),
};
