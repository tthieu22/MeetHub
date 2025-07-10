import { useEffect, useState, useRef, useCallback } from "react";
import { createSocket } from "@web/lib/services/socket.service";
import { Socket } from "socket.io-client";

export interface WsResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export function useUnreadCount(roomId: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const getUnreadCount = useCallback(() => {
    if (!socketRef.current) return;

    setLoading(true);
    setError(null);

    socketRef.current.emit("get_unread_count", {
      roomId,
    });
  }, [roomId]);

  const markRoomAsRead = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit("mark_room_read", {
      roomId,
    });
  }, [roomId]);

  useEffect(() => {
    const socket = createSocket();
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
          setUnreadCount(response.data.unreadCount);
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
          setUnreadCount(response.data.unreadCount);
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
          setUnreadCount(0);
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
