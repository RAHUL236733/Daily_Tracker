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

/**
 * REQUEST CURRENT USER - CRITICAL FIX
 * 
 * THIS MUST USE THE apiJson WRAPPER!
 * 
 * Why: When user reloads page, access token might be expired but refresh token is valid.
 * Raw fetch does NOT have the 401 refresh logic.
 * apiJson wrapper catches 401, refreshes tokens, and retries automatically.
 */
const requestCurrentUser = async (signal?: AbortSignal) => {
  try {
    // Use apiJson wrapper to ensure 401 refresh is handled
    return await apiJson<{ user: NonNullable<User> }>("/api/auth/me", {
      signal,
    }).then(data => data.user);
  } catch (error) {
    // Re-throw with proper status
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw error;
  }
};

/**
 * LOAD CURRENT USER WITH FALLBACK
 * 
 * Flow:
 * 1. Try to get current user via /api/auth/me
 * 2. If that fails, try to refresh tokens via /api/auth/refresh
 * 3. Then retry getting current user
 * 4. If refresh also fails, return null (not authenticated)
 */
const loadCurrentUser = async (signal?: AbortSignal) => {
  try {
    console.log("[Auth] Loading current user...");
    const user = await requestCurrentUser(signal);
    console.log("[Auth] User loaded successfully:", user._id);
    return user;
  } catch (error) {
    const status = (error as { status?: number })?.status;
    const message = (error as { message?: string })?.message || "";
    
    console.log("[Auth] Failed to load user:", { status, message });

    // If it's a 401, try to refresh tokens
    if (status === 401) {
      try {
        console.log("[Auth] Attempting to refresh tokens...");
        await apiJson('/api/auth/refresh', { method: 'POST' });
        console.log("[Auth] Tokens refreshed, retrying user load...");
        
        // Retry getting the user after refresh
        const user = await requestCurrentUser(signal);
        console.log("[Auth] User loaded after refresh:", user._id);
        return user;
      } catch (refreshError) {
        // Refresh failed - user is truly not authenticated
        const refreshMsg = (refreshError instanceof Error) 
          ? refreshError.message 
          : 'Session expired. Please sign in again.';
        
        console.log("[Auth] Refresh failed, session expired:", refreshMsg);
        
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(AUTH_NOTICE_KEY, refreshMsg);
          }
        } catch {}

        return null;
      }
    }

    // Other errors: re-throw or return null depending on error type
    return null;
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

  /**
   * CRITICAL: Load user on mount
   * 
   * This uses loadCurrentUser which:
   * 1. Checks if cookies have valid tokens
   * 2. If access token expired, refresh it automatically
   * 3. Then returns the current user
   * 
   * This ensures user stays logged in after page reload!
   */
  useEffect(() => {
    // Don't store user in localStorage (security risk)
    localStorage.removeItem("dt_user");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    console.log("[Auth] useEffect: Starting auth initialization");

    loadCurrentUser(controller.signal)
      .then((profile) => {
        console.log("[Auth] Auth init complete:", { authenticated: !!profile });
        
        if (profile) {
          setUser(profile);
          clearAuthNotice();
        } else {
          setUser(null);
        }

        setIsLoading(false);
      })
      .catch((error) => {
        console.error("[Auth] Auth init error:", error);
        setUser(null);
        setIsLoading(false);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    // Listen for session expired events
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;

      console.log("[Auth] Session expired event received");

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
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const refreshProfile = async () => {
    console.log("[Auth] Refreshing profile...");
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    try {
      const profile = await loadCurrentUser(controller.signal);

      if (profile) {
        setUser(profile);
        console.log("[Auth] Profile refreshed successfully");
      } else {
        setUser(null);
        console.log("[Auth] Profile refresh returned no user");
      }
    } catch (error) {
      console.error("[Auth] Profile refresh failed:", error);
      setUser(null);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log("[Auth] Logging in...");
    
    const data = await postJson<{
      success: boolean;
      user: NonNullable<User>;
    }>("/api/auth/login", {
      email,
      password,
    });

    console.log("[Auth] Login successful");
    setUser(data.user);
    setIsLoading(false);
    clearAuthNotice();
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    console.log("[Auth] Registering...");
    
    const data = await postJson<{
      success: boolean;
      user: NonNullable<User>;
    }>("/api/auth/register", {
      name,
      email,
      password,
    });

    console.log("[Auth] Registration successful");
    setUser(data.user);
    setIsLoading(false);
    clearAuthNotice();
  };

  const logout = () => {
    console.log("[Auth] Logging out...");
    
    apiJson("/api/auth/logout", { method: "POST" }).catch(() => {
      console.log("[Auth] Logout API call failed, but clearing local state anyway");
    });

    localStorage.removeItem("dt_reset_email");
    clearAuthNotice();
    setUser(null);
    setIsLoading(false);
    
    console.log("[Auth] Logged out successfully");
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
