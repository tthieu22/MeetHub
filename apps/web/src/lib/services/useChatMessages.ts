import { useEffect, useState, useRef, useCallback, useReducer } from "react";
import { getSocket } from "@web/lib/services/socket.service";
import { Socket } from "socket.io-client";
import { WsResponse, Message, MessagesResponse } from "@web/types/chat";

type MessagesAction =
  | { type: "SET"; payload: Message[] }
  | { type: "PREPEND"; payload: Message[] }
  | { type: "ADD"; payload: Message }
  | { type: "UPDATE"; payload: Message }
  | { type: "DELETE"; payload: string };

function messagesReducer(state: Message[], action: MessagesAction): Message[] {
  switch (action.type) {
    case "SET":
      return action.payload;
    case "PREPEND":
      return [...action.payload, ...state];
    case "ADD":
      return [...state, action.payload];
    case "UPDATE":
      return state.map((msg) =>
        msg._id === action.payload._id ? action.payload : msg
      );
    case "DELETE":
      return state.filter((msg) => msg._id !== action.payload);
    default:
      return state;
  }
}

export function useChatMessages(roomId: string) {
  const [messages, dispatchMessages] = useReducer(messagesReducer, []);
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
    const socket = getSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[ChatMessages] Connected:", socket.id);
      joinRoom();
      loadMessages();
    });

    socket.on("reconnect", (attemptNumber: number) => {
      console.log("[ChatMessages] Reconnected, attempt:", attemptNumber);
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
        if (response.data!.before) {
          dispatchMessages({ type: "PREPEND", payload: newMessages });
        } else {
          dispatchMessages({ type: "SET", payload: newMessages });
        }
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
        // Chỉ xử lý tin nhắn thuộc về room hiện tại
        if (response.data.conversationId === roomId) {
          dispatchMessages({ type: "ADD", payload: response.data });
        }
      }
    });

    socket.on("message_created", (response: WsResponse<Message>) => {
      console.log("[ChatMessages] Message created:", response);
      if (response.success && response.data) {
        dispatchMessages({ type: "UPDATE", payload: response.data });
      }
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
      socket.off("connect");
      socket.off("reconnect");
      socket.off("disconnect");
      socket.off("messages");
      socket.off("new_message");
      socket.off("message_created");
      socket.off("room_marked_read");
      socket.off("error");
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
