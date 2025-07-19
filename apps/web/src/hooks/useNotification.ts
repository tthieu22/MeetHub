import { useEffect, useState } from "react";
import { getMyNotifications } from "@web/services/api/notification.api";
import { useUserStore, useWebSocketStore } from "@web/store";
import { NotificationItem } from "@web/components/notification/NotificationItemComponent";

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const socket = useWebSocketStore((state) => state.socket);
  const userId = useUserStore((state) => state.currentUser?._id);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!socket || !userId) return;
    socket.emit("register", userId);
  }, [socket, userId]);

  const fetchNotifications = async () => {
    // Chỉ fetch notifications khi user đã đăng nhập
    if (!isAuthenticated || !userId) {
      console.log("useNotification: User not authenticated, skipping fetch");
      return;
    }

    setLoading(true);
    try {
      console.log("useNotification: Fetching notifications for user:", userId);
      const res = await getMyNotifications();
      if (res.success) {
        setNotifications(
          (res.data || []).map((item: any) => ({
            id: item._id,
            message: item.content,
            type: item.type,
            isRead: item.isRead,
            createdAt: item.createdAt,
          }))
        );
      }
    } catch (error) {
      console.error("useNotification: Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ fetch notifications khi user đã đăng nhập
    if (isAuthenticated && userId) {
      fetchNotifications();
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!socket) return;
    socket.on("connect", () => {
      console.log("Socket connected", socket.id);
    });
    const handler = (data: NotificationItem) => {
      console.log("New notification from socket:", data);
      setNotifications((prev) => [{ ...data, isRead: false }, ...prev]);
    };
    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
    };
  }, [socket]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
  };
};