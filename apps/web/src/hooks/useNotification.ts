import { useEffect, useState } from "react";
import { getMyNotifications } from "@web/services/api/notification.api";
import { useWebSocketStore } from "@web/store";
import { NotificationItem } from "@web/components/notification/NotificationItemComponent";

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const socket = useWebSocketStore((state) => state.socket);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (data: NotificationItem) => {
      setNotifications((prev) => [data, ...prev]);
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