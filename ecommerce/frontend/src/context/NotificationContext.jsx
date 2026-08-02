import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  fetchUserNotifications,
  markNotificationRead as apiMarkRead,
  deleteNotification as apiDelete,
} from "../api/notifications.js";
import { useAuth } from "./AuthContext.jsx";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchUserNotifications(user.id);
      setNotifications(data);
    } catch {
      // notification-service may be down — treat as empty, don't block the app
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function markRead(id) {
    const updated = await apiMarkRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? updated : n)));
  }

  async function remove(id) {
    await apiDelete(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  }

  const unreadCount = notifications.filter((n) => n.status !== "READ").length;

  const value = {
    notifications,
    loading,
    unreadCount,
    refresh,
    markRead,
    remove,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
