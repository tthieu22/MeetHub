import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getSocket } from "@web/lib/services/socket.service";
import { Socket } from "socket.io-client";
import { WsResponse } from "@web/types/chat";

function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function useUnreadCount(roomId: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const getUnreadCountRaw = useCallback(() => {
    if (!socketRef.current) return;
    setLoading(true);
    setError(null);
    socketRef.current.emit("get_unread_count", { roomId });
  }, [roomId]);

  const getUnreadCount = useMemo(
    () => debounce(getUnreadCountRaw, 300),
    [getUnreadCountRaw]
  );

  const markRoomAsReadRaw = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("mark_room_read", { roomId });
  }, [roomId]);

  const markRoomAsRead = useMemo(
    () => debounce(markRoomAsReadRaw, 300),
    [markRoomAsReadRaw]
  );

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[UnreadCount] Connected:", socket.id);
      getUnreadCount();
    });

    socket.on("disconnect", (reason) => {
      console.log("[UnreadCount] Disconnected:", reason);
    });

    socket.on(
      "unread_count",
      (response: WsResponse<{ roomId: string; unreadCount: number }>) => {
        console.log("[UnreadCount] Received unread count:", response);
        if (response.success && response.data) {
          const unread = response.data?.unreadCount ?? 0;
          setUnreadCount((prev) => (prev !== unread ? unread : prev));
        } else {
          setError(response.message || "Lỗi khi lấy unread count");
        }
        setLoading(false);
      }
    );

    socket.on(
      "unread_count_updated",
      (response: WsResponse<{ roomId: string; unreadCount: number }>) => {
        console.log("[UnreadCount] Unread count updated:", response);
        if (
          response.success &&
          response.data &&
          response.data.roomId === roomId
        ) {
          const unread = response.data?.unreadCount ?? 0;
          setUnreadCount((prev) => (prev !== unread ? unread : prev));
        }
      }
    );

    socket.on(
      "room_marked_read",
      (
        response: WsResponse<{
          roomId: string;
          userId: string;
          markedAt: string;
        }>
      ) => {
        console.log("[UnreadCount] Room marked read:", response);
        if (
          response.success &&
          response.data &&
          response.data.roomId === roomId
        ) {
          setUnreadCount((prev) => (prev !== 0 ? 0 : prev));
        }
      }
    );

    socket.on("error", (response: WsResponse) => {
      console.log("[UnreadCount] Error:", response);
      setError(response.message || "Lỗi không xác định");
      setLoading(false);
    });

    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("unread_count");
      socket.off("unread_count_updated");
      socket.off("room_marked_read");
      socket.off("error");
      socket.disconnect();
    };
  }, [roomId, getUnreadCount]);

  return {
    unreadCount,
    loading,
    error,
    getUnreadCount,
    markRoomAsRead,
  };
}
