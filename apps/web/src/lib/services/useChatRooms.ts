import { useEffect, useState, useRef, useReducer, useCallback } from "react";
import { getSocket } from "@web/lib/services/socket.service";
import { Socket } from "socket.io-client";
import {
  WsResponse,
  Message,
  LastMessageInfo,
  ChatRoom,
} from "@web/types/chat";

type RoomsAction =
  | { type: "SET"; payload: ChatRoom[] }
  | { type: "UPDATE_UNREAD"; payload: { roomId: string; unreadCount: number } }
  | { type: "MARK_READ"; payload: { roomId: string } }
  | { type: "UPDATE_ONLINE"; payload: { roomId: string; userId: string } }
  | {
      type: "UPDATE_LAST_MESSAGE";
      payload: { roomId: string; lastMessage: LastMessageInfo };
    };

function roomsReducer(state: ChatRoom[], action: RoomsAction): ChatRoom[] {
  switch (action.type) {
    case "SET":
      return action.payload;
    case "UPDATE_UNREAD":
      return state.map((room) =>
        room.roomId === action.payload.roomId
          ? { ...room, unreadCount: action.payload.unreadCount }
          : room
      );
    case "MARK_READ":
      return state.map((room) =>
        room.roomId === action.payload.roomId
          ? { ...room, unreadCount: 0 }
          : room
      );
    case "UPDATE_ONLINE":
      return state.map((room) =>
        room.roomId === action.payload.roomId
          ? {
              ...room,
              onlineMemberIds: room.onlineMemberIds.includes(
                action.payload.userId
              )
                ? room.onlineMemberIds
                : [...room.onlineMemberIds, action.payload.userId],
            }
          : room
      );
    case "UPDATE_LAST_MESSAGE":
      return state.map((room) =>
        room.roomId === action.payload.roomId
          ? { ...room, lastMessage: action.payload.lastMessage }
          : room
      );
    default:
      return state;
  }
}

export function useChatRooms() {
  const [rooms, dispatchRooms] = useReducer(roomsReducer, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Tách callback ra ngoài useEffect để off/on đúng function
  const handleRooms = useCallback((response: WsResponse<ChatRoom[]>) => {
    console.log("[Socket] Received rooms:", response);
    if (response.success && response.data) {
      dispatchRooms({ type: "SET", payload: response.data });
    } else {
      setError(response.message || "Lỗi khi lấy danh sách rooms");
    }
    setLoading(false);
  }, []);

  const handleError = useCallback((response: WsResponse) => {
    console.log("[Socket] Error:", response);
    setError(response.message || "Lỗi không xác định");
    setLoading(false);
  }, []);

  const handleNewMessage = useCallback((response: WsResponse<Message>) => {
    console.log("[Socket] New message:", response);
    if (response.success && response.data) {
      const message = response.data;
      const roomId = message.conversationId;

      // Tạo lastMessage object từ message data
      const lastMessage: LastMessageInfo = {
        messageId: message._id,
        conversationId: message.conversationId,
        senderId:
          typeof message.senderId === "string"
            ? message.senderId
            : message.senderId._id,
        text: message.text,
        createdAt: message.createdAt,
      };

      dispatchRooms({
        type: "UPDATE_LAST_MESSAGE",
        payload: {
          roomId,
          lastMessage,
        },
      });
    }
  }, []);

  const handleUnreadCountUpdated = useCallback(
    (response: WsResponse<{ roomId: string; unreadCount: number }>) => {
      console.log("[Socket] Unread count updated:", response);
      if (response.success && response.data) {
        dispatchRooms({
          type: "UPDATE_UNREAD",
          payload: {
            roomId: response.data.roomId,
            unreadCount: response.data.unreadCount,
          },
        });
      }
    },
    []
  );

  const handleRoomMarkedRead = useCallback(
    (
      response: WsResponse<{ roomId: string; userId: string; markedAt: string }>
    ) => {
      console.log("[Socket] Room marked read:", response);
      if (response.success && response.data) {
        dispatchRooms({
          type: "MARK_READ",
          payload: { roomId: response.data.roomId },
        });
      }
    },
    []
  );

  const handleUserOnline = useCallback(
    (response: WsResponse<{ userId: string; roomId: string }>) => {
      console.log("[Socket] User online:", response);
      if (response.success && response.data) {
        dispatchRooms({
          type: "UPDATE_ONLINE",
          payload: {
            roomId: response.data.roomId,
            userId: response.data.userId,
          },
        });
      }
    },
    []
  );

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    setLoading(true);
    setError(null);

    // Cleanup trước khi đăng ký mới
    socket.off("rooms", handleRooms);
    socket.on("rooms", handleRooms);

    socket.off("error", handleError);
    socket.on("error", handleError);

    socket.off("new_message", handleNewMessage);
    socket.on("new_message", handleNewMessage);

    socket.off("unread_count_updated", handleUnreadCountUpdated);
    socket.on("unread_count_updated", handleUnreadCountUpdated);

    socket.off("room_marked_read", handleRoomMarkedRead);
    socket.on("room_marked_read", handleRoomMarkedRead);

    socket.off("user_online", handleUserOnline);
    socket.on("user_online", handleUserOnline);

    socket.connect();
    socket.emit("get_rooms");

    return () => {
      socket.off("rooms", handleRooms);
      socket.off("error", handleError);
      socket.off("new_message", handleNewMessage);
      socket.off("unread_count_updated", handleUnreadCountUpdated);
      socket.off("room_marked_read", handleRoomMarkedRead);
      socket.off("user_online", handleUserOnline);
      socket.disconnect();
    };
  }, [
    handleRooms,
    handleError,
    handleNewMessage,
    handleUnreadCountUpdated,
    handleRoomMarkedRead,
    handleUserOnline,
  ]);

  return { rooms, loading, error };
}
