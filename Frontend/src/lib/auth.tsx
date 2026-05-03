import React, { createContext, useContext, useEffect, useState } from "react";
import { buildApiUrl, postJson } from "@/lib/api";

type UserSession = { token: string; userId: string };
type User = { name: string; email: string; userId: string; token: string } | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readSession = (): UserSession | null => {
  try {
    const raw = localStorage.getItem("dt_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserSession>;
    if (!parsed.token || !parsed.userId) return null;
    return { token: parsed.token, userId: parsed.userId };
  } catch {
    return null;
  }
};

const writeSession = (session: UserSession | null) => {
  if (!session) {
    localStorage.removeItem("dt_user");
    return;
  }

  localStorage.setItem("dt_user", JSON.stringify(session));
};

const fetchProfileByToken = async (token: string, signal?: AbortSignal) => {
  const response = await fetch(buildApiUrl("/api/user/profile"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as { message?: string })?.message || "Failed to load profile");
  }

  return (data as { user: { name: string; email: string } }).user;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = readSession();
    if (!session) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    fetchProfileByToken(session.token, controller.signal)
      .then((profile) => {
        setUser({
          token: session.token,
          userId: session.userId,
          name: profile.name,
          email: profile.email,
        });
        setIsLoading(false);
      })
      .catch(() => {
        writeSession(null);
        setUser(null);
        setIsLoading(false);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });
  }, []);

  const refreshProfile = async () => {
    const session = readSession();
    if (!session) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    try {
      const profile = await fetchProfileByToken(session.token, controller.signal);
      setUser({
        token: session.token,
        userId: session.userId,
        name: profile.name,
        email: profile.email,
      });
    } catch {
      writeSession(null);
      setUser(null);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const data = await postJson<{ success: boolean; token: string; userId: string }>(
      "/api/auth/login",
      {
        email,
        password,
      },
    );

    writeSession({ token: data.token, userId: data.userId });
    const profile = await fetchProfileByToken(data.token);
    setUser({ token: data.token, userId: data.userId, name: profile.name, email: profile.email });
    setIsLoading(false);
    window.location.href = "/";
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    const data = await postJson<{ success: boolean; token: string; userId: string }>(
      "/api/auth/register",
      {
        name,
        email,
        password,
      },
    );

    writeSession({ token: data.token, userId: data.userId });
    const profile = await fetchProfileByToken(data.token);
    setUser({ token: data.token, userId: data.userId, name: profile.name, email: profile.email });
    setIsLoading(false);
    window.location.href = "/";
  };

  const logout = () => {
    setIsLoading(false);
    writeSession(null);
    localStorage.removeItem("dt_reset_email");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
