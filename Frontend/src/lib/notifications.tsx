import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type Tone = "success" | "streak" | "info";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  tone: Tone;
  unread: boolean;
};

type PushInput = Omit<AppNotification, "id" | "time" | "unread"> & {
  // If provided, a notification with the same key is emitted only once per app session.
  dedupeKey?: string;
};

type NotificationsContextType = {
  notifications: AppNotification[];
  push: (n: PushInput, ttl?: number) => string | null;
  remove: (id: string) => void;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const seenKeysRef = useRef<Set<string>>(new Set());

  const push = useCallback((n: PushInput, ttl = 8000) => {
    if (n.dedupeKey) {
      if (seenKeysRef.current.has(n.dedupeKey)) {
        return null;
      }
      seenKeysRef.current.add(n.dedupeKey);
    }

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const item: AppNotification = {
      id,
      title: n.title,
      body: n.body,
      tone: n.tone,
      time: nowLabel(),
      unread: true,
    };
    setNotifications((xs) => [item, ...xs]);

    if (ttl > 0) {
      window.setTimeout(() => {
        setNotifications((xs) => xs.filter((x) => x.id !== id));
      }, ttl);
    }

    return id;
  }, []);

  const remove = useCallback((id: string) => {
    setNotifications((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((xs) => xs.map((n) => ({ ...n, unread: false })));
  }, []);

  const value = useMemo(
    () => ({ notifications, push, remove, markAllRead }),
    [notifications, push, remove, markAllRead],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}

export default NotificationsProvider;
