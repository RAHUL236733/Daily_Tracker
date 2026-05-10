import React, { createContext, useContext, useEffect, useState } from "react";
import { apiJson, buildApiUrl, postJson } from "@/lib/api";

type User = { _id: string; name: string; email: string; role?: "user" | "admin" } | null;

const AUTH_NOTICE_KEY = "dt_auth_notice";
const SESSION_EXPIRED_EVENT = "dt:session-expired";

type AuthContextType = {
  user: User;
  isLoading: boolean;
  authNotice: string;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const requestCurrentUser = async (signal?: AbortSignal) => {
  const response = await fetch(buildApiUrl("/api/auth/me"), {
    method: "GET",
    credentials: "include",
    signal,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      (data as { message?: string })?.message || "Failed to load profile"
    ) as Error & {
      status?: number;
    };

    error.status = response.status;
    throw error;
  }

  return (data as { user: NonNullable<User> }).user;
};

const loadCurrentUser = async (signal?: AbortSignal) => {
  try {
    return await requestCurrentUser(signal);
  } catch (error) {
    if ((error as { status?: number })?.status !== 401) {
      throw error;
    }

    try {
      await apiJson("/api/auth/refresh", { method: "POST" });
      return requestCurrentUser(signal);
    } catch {
      return null;
    }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [authNotice, setAuthNotice] = useState(() => {
    if (typeof window === "undefined") return "";

    return sessionStorage.getItem(AUTH_NOTICE_KEY) || "";
  });

  const clearAuthNotice = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(AUTH_NOTICE_KEY);
    }

    setAuthNotice("");
  };

  const setSessionExpiredNotice = (
    message = "Session expired. Please sign in again."
  ) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(AUTH_NOTICE_KEY, message);
    }

    setAuthNotice(message);
  };

  useEffect(() => {
    localStorage.removeItem("dt_user");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    loadCurrentUser(controller.signal)
      .then((profile) => {
        if (profile) {
          setUser(profile);
          clearAuthNotice();
        } else {
          setUser(null);
        }

        setIsLoading(false);
      })
      .catch(() => {
        setUser(null);
        setIsLoading(false);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;

      setUser(null);
      setIsLoading(false);

      setSessionExpiredNotice(
        customEvent.detail?.message ||
          "Session expired. Please sign in again."
      );
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.clearTimeout(timeoutId);

      window.removeEventListener(
        SESSION_EXPIRED_EVENT,
        handleSessionExpired
      );
    };
  }, []);

  const refreshProfile = async () => {
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    try {
      const profile = await loadCurrentUser(controller.signal);

      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await postJson<{
      success: boolean;
      user: NonNullable<User>;
    }>("/api/auth/login", {
      email,
      password,
    });

    setUser(data.user);
    setIsLoading(false);
    clearAuthNotice();
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    const data = await postJson<{
      success: boolean;
      user: NonNullable<User>;
    }>("/api/auth/register", {
      name,
      email,
      password,
    });

    setUser(data.user);
    setIsLoading(false);
    clearAuthNotice();
  };

  const logout = () => {
    apiJson("/api/auth/logout", { method: "POST" }).catch(() => undefined);

    localStorage.removeItem("dt_reset_email");

    clearAuthNotice();

    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        authNotice,
        login,
        register,
        refreshProfile,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}