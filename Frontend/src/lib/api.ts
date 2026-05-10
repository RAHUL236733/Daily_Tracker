const isLocalHost = (value: string) =>
  /^(localhost|127\.0\.0\.1)$/i.test(value);

const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;

    if (isLocalHost(hostname)) {
      return "http://localhost:5000";
    }

    return `${protocol}//${window.location.host}`;
  }

  return "http://localhost:5000";
};

const API_BASE_URL = resolveApiBaseUrl();

const AUTH_REFRESH_ENDPOINT = "/api/auth/refresh";

const PUBLIC_AUTH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/verify-otp",
  "/api/auth/reset-password",
  "/api/auth/logout",
  AUTH_REFRESH_ENDPOINT,
]);

const SESSION_EXPIRED_EVENT = "dt:session-expired";

const isSessionExpiredMessage = (message: string) =>
  /session expired|refresh token is not valid|token is not valid|refresh token missing/i.test(
    message
  );

const getPathname = (url: string) => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

const emitSessionExpired = (
  message = "Session expired. Please sign in again."
) => {
  if (typeof window === "undefined") return;

  sessionStorage.setItem("dt_auth_notice", message);

  window.dispatchEvent(
    new CustomEvent(SESSION_EXPIRED_EVENT, {
      detail: { message },
    })
  );
};

function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${API_BASE_URL}${normalizedPath}`;
}

const refreshSession = async () => {
  const response = await fetch(buildApiUrl(AUTH_REFRESH_ENDPOINT), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data as { message?: string })?.message || 'Session expired. Please sign in again.';
    throw new Error(message);
  }

  return data;
};

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export async function apiJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(path);

  const pathname = getPathname(url);

  const shouldRefreshOn401 =
    pathname.startsWith("/api/") &&
    !PUBLIC_AUTH_PATHS.has(pathname);

  const request = async () => {
    const response = await fetch(url, {
      credentials: 'include',
      mode: 'cors',
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    return { response, data };
  };

  try {
    let { response, data } = await request();

    if (
      response.status === 401 &&
      shouldRefreshOn401
    ) {
      try {
        await refreshSession();

        ({ response, data } = await request());
      } catch (refreshError) {
        const refreshMessage =
          refreshError instanceof Error
            ? refreshError.message
            : "Session expired. Please sign in again.";

        if (isSessionExpiredMessage(refreshMessage)) {
          emitSessionExpired();
        }

        throw refreshError;
      }
    }

    if (!response.ok) {
      const error = new Error(
        (data as { message?: string })?.message ||
          "Request failed"
      ) as Error & {
        status?: number;
      };

      error.status = response.status;

      throw error;
    }

    return data as T;
  } catch (error) {
    console.error("API ERROR:", error);
    throw error;
  }
}

export async function postJson<T>(
  path: string,
  payload: Record<string, JsonValue>
): Promise<T> {
  return apiJson<T>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function patchJson<T>(
  path: string,
  payload: Record<string, JsonValue>
): Promise<T> {
  return apiJson<T>(path, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getJson<T>(path: string): Promise<T> {
  return apiJson<T>(path, {
    method: "GET",
  });
}

export { buildApiUrl };