import { useEffect, useState, useRef } from "react";
import { createSocket } from "@web/lib/services/socket.service";
import { Socket } from "socket.io-client";

export interface RoomMemberInfo {
  userId: string;
  name: string;
  avatarURL?: string;
}

export interface LastMessageInfo {
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface ChatRoom {
  roomId: string;
  name: string;
  isGroup: boolean;
  members: RoomMemberInfo[];
  lastMessage: LastMessageInfo | null;
  unreadCount: number;
  onlineMemberIds: string[];
}

// WebSocket Response interface
export interface WsResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export function useChatRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;
    setLoading(true);
    setError(null);

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
    });
    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.connect();
    socket.emit("get_rooms");

    // Cập nhật để xử lý response format mới
    socket.on("rooms", (response: WsResponse<ChatRoom[]>) => {
      console.log("[Socket] Received rooms:", response);
      if (response.success && response.data) {
        setRooms(response.data);
      } else {
        setError(response.message || "Lỗi khi lấy danh sách rooms");
      }
      setLoading(false);
    });

    socket.on("error", (response: WsResponse) => {
      console.log("[Socket] Error:", response);
      setError(response.message || "Lỗi không xác định");
      setLoading(false);
    });

    socket.on("new_message", (response: WsResponse) => {
      console.log("[Socket] New message:", response);
    });

    socket.on(
      "unread_count_updated",
      (response: WsResponse<{ roomId: string; unreadCount: number }>) => {
        console.log("[Socket] Unread count updated:", response);
        if (response.success && response.data) {
          setRooms((prevRooms) =>
            prevRooms.map((room) =>
              room.roomId === response.data!.roomId
                ? { ...room, unreadCount: response.data!.unreadCount }
                : room
            )
          );
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
        console.log("[Socket] Room marked read:", response);
        if (response.success && response.data) {
          setRooms((prevRooms) =>
            prevRooms.map((room) =>
              room.roomId === response.data!.roomId
                ? { ...room, unreadCount: 0 }
                : room
            )
          );
        }
      }
    );

    socket.on(
      "user_online",
      (response: WsResponse<{ userId: string; roomId: string }>) => {
        console.log("[Socket] User online:", response);
        if (response.success && response.data) {
          setRooms((prevRooms) =>
            prevRooms.map((room) =>
              room.roomId === response.data!.roomId
                ? {
                    ...room,
                    onlineMemberIds: [
                      ...room.onlineMemberIds,
                      response.data!.userId,
                    ],
                  }
                : room
            )
          );
        }
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  return { rooms, loading, error };
}
