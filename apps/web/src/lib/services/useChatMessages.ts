import { useEffect, useState, useRef, useCallback } from "react";
import { createSocket } from "@web/lib/services/socket.service";
import { Socket } from "socket.io-client";

export interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    email: string;
    username?: string;
    avatar?: string;
  };
  text: string;
  fileUrl?: string;
  replyTo?: unknown;
  mentions: string[];
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesResponse {
  data: Message[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  hasMore?: boolean;
  before?: string;
}

export interface WsResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export function useChatMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [before, setBefore] = useState<string | undefined>(undefined);
  const socketRef = useRef<Socket | null>(null);

  const loadMessages = useCallback(
    (beforeTimestamp?: string, limit: number = 20) => {
      if (!socketRef.current) return;

      setLoading(true);
      setError(null);

      socketRef.current.emit("get_messages", {
        roomId,
        before: beforeTimestamp,
        limit,
      });
    },
    [roomId]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!socketRef.current) return;

      socketRef.current.emit("create_message", {
        text,
        roomId,
      });
    },
    [roomId]
  );

  const markRoomAsRead = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit("mark_room_read", {
      roomId,
    });
  }, [roomId]);

  const getUnreadCount = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit("get_unread_count", {
      roomId,
    });
  }, [roomId]);

  const joinRoom = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit("join_room", {
      roomId,
    });
  }, [roomId]);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[ChatMessages] Connected:", socket.id);
      joinRoom();
      loadMessages();
    });

    socket.on("disconnect", (reason) => {
      console.log("[ChatMessages] Disconnected:", reason);
    });

    socket.on("messages", (response: WsResponse<MessagesResponse>) => {
      console.log("[ChatMessages] Received messages:", response);
      if (response.success && response.data) {
        const newMessages = response.data.data;
        setMessages((prevMessages) => {
          if (response.data!.before) {
            return [...newMessages, ...prevMessages];
          }
          return newMessages;
        });
        setHasMore(response.data.hasMore || false);
        setBefore(response.data.before);
      } else {
        setError(response.message || "Lỗi khi lấy tin nhắn");
      }
      setLoading(false);
    });

    socket.on("new_message", (response: WsResponse<Message>) => {
      console.log("[ChatMessages] New message:", response);
      if (response.success && response.data) {
        setMessages((prevMessages) => [...prevMessages, response.data!]);
      }
    });

    socket.on("message_created", (response: WsResponse<Message>) => {
      console.log("[ChatMessages] Message created:", response);
    });

    socket.on("room_marked_read", (response: WsResponse) => {
      console.log("[ChatMessages] Room marked read:", response);
    });

    socket.on("error", (response: WsResponse) => {
      console.log("[ChatMessages] Error:", response);
      setError(response.message || "Lỗi không xác định");
      setLoading(false);
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [roomId, joinRoom, loadMessages]);

  return {
    messages,
    loading,
    error,
    hasMore,
    before,
    loadMessages,
    sendMessage,
    markRoomAsRead,
    getUnreadCount,
    joinRoom,
  };
}
