import { useEffect, useState, useRef } from "react";
import { createSocket } from "./socket.service";
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

    socket.on("rooms", (data: ChatRoom[]) => {
      console.log("[Socket] Received rooms:", data);
      setRooms(data);
      setLoading(false);
    });
    socket.on("error", (err: { message?: string }) => {
      console.log("[Socket] Error:", err);
      setError(err?.message || "Lỗi không xác định");
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { rooms, loading, error };
}
