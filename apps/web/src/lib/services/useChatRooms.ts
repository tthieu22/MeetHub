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
    }
  | { type: "INCREMENT_UNREAD"; payload: { roomId: string } };

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
    case "INCREMENT_UNREAD":
      return state.map((room) =>
        room.roomId === action.payload.roomId
          ? { ...room, unreadCount: room.unreadCount + 1 }
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
  const currentRoomIdRef = useRef<string | null>(null);

  // Tách callback ra ngoài useEffect để off/on đúng function
  const handleRooms = useCallback((response: WsResponse<ChatRoom[]>) => {
    if (response.success && response.data) {
      dispatchRooms({ type: "SET", payload: response.data });
      // Không cần log join room ở đây
      const socket = socketRef.current;
      if (socket) {
        response.data.forEach((room) => {
          socket.emit("join_room", { roomId: room.roomId });
        });
        const userId = localStorage.getItem("user_id");
        if (userId) {
          socket.emit("join_room", { roomId: userId });
        }
      }
    } else {
      setError(response.message || "Lỗi khi lấy danh sách rooms");
    }
    setLoading(false);
  }, []);

  const handleError = useCallback((response: WsResponse) => {
    setError(response.message || "Lỗi không xác định");
    setLoading(false);
  }, []);

  const handleNewMessage = useCallback((response: WsResponse<Message>) => {
    // Log khi nhận new_message
    if (response.success && response.data) {
      const message = response.data;
      const roomId = message.conversationId;
      // Cập nhật lastMessage cho room
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
      // Log khi nhận unread_count_updated
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
      // Log khi nhận room_marked_read
      if (response.success && response.data) {
        const currentUserId = localStorage.getItem("user_id");
        if (response.data.userId !== currentUserId) return; // Chỉ xử lý nếu là user hiện tại
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

  // Function để set current room ID
  const setCurrentRoomId = useCallback((roomId: string | null) => {
    currentRoomIdRef.current = roomId;
  }, []);

  // Function để mark room as read optimistically
  const markRoomAsReadOptimistically = useCallback((roomId: string) => {
    dispatchRooms({
      type: "MARK_READ",
      payload: { roomId },
    });
  }, []);

  useEffect(() => {}, [rooms]);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();
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

  return {
    rooms,
    loading,
    error,
    setCurrentRoomId,
    markRoomAsReadOptimistically,
  };
}
