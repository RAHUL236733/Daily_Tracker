const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function buildApiUrl(path: string) {
  // If caller passed a full URL, use it as-is
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

  return `${baseUrl}${normalizedPath}`;
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function getAuthToken() {
  if (typeof window === "undefined") return undefined;

  try {
    const raw = localStorage.getItem("dt_user");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed?.token;
  } catch {
    return undefined;
  }
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = buildApiUrl(path);
  const token = getAuthToken();

  try {
    const response = await fetch(url, {
      mode: "cors",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error((data as { message?: string })?.message || "Request failed");
    }

    return data as T;
  } catch (err) {
    // Log detailed network/fetch errors to aid debugging (e.g. CORS, connection refused)
    // eslint-disable-next-line no-console
    console.error("apiJson error", { url, init, error: err });
    throw err;
  }
}

export async function postJson<T>(path: string, payload: Record<string, JsonValue>): Promise<T> {
  return apiJson<T>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function patchJson<T>(path: string, payload: Record<string, JsonValue>): Promise<T> {
  return apiJson<T>(path, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getJson<T>(path: string): Promise<T> {
  return apiJson<T>(path, { method: "GET" });
}

export { buildApiUrl };