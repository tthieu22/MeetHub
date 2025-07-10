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
    case "UPDATE_UNREAD": {
      const before = state.find(
        (room) => room.roomId === action.payload.roomId
      )?.unreadCount;
      const after = action.payload.unreadCount;
      console.log("[DEBUG] roomsReducer UPDATE_UNREAD:", {
        roomId: action.payload.roomId,
        before,
        after,
        stateBefore: state.map((r) => ({
          roomId: r.roomId,
          unreadCount: r.unreadCount,
        })),
      });
      const newState = state.map((room) =>
        room.roomId === action.payload.roomId
          ? { ...room, unreadCount: action.payload.unreadCount }
          : room
      );
      console.log(
        "[DEBUG] roomsReducer UPDATE_UNREAD stateAfter:",
        newState.map((r) => ({ roomId: r.roomId, unreadCount: r.unreadCount }))
      );
      return newState;
    }
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
  // Log khi hook được mount
  console.log("[DEBUG] useChatRooms: hook mounted");

  const [rooms, dispatchRooms] = useReducer(roomsReducer, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);
  const roomsRef = useRef<ChatRoom[]>([]);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // Tách callback ra ngoài useEffect để off/on đúng function
  const handleRooms = useCallback((response: WsResponse<ChatRoom[]>) => {
    console.log("[DEBUG] FE nhận event rooms:", response);
    if (response.success && response.data) {
      dispatchRooms({ type: "SET", payload: response.data });
      const socket = socketRef.current;
      if (socket) {
        response.data.forEach((room) => {
          socket.emit("join_room", { roomId: room.roomId });
          console.log(
            `[DEBUG] FE emit join_room for roomId: ${room.roomId}, socketId: ${socket.id}`
          );
        });
        const userId = localStorage.getItem("user_id");
        console.log("[DEBUG] FE userId localStorage:", userId);
        if (userId) {
          socket.emit("join_room", { roomId: userId });
          console.log(
            `[DEBUG] FE emit join_room for userId: ${userId}, socketId: ${socket.id}`
          );
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
    if (response.success && response.data) {
      const message = response.data;
      const roomId = message.conversationId;
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
      // Luôn cập nhật lastMessage
      dispatchRooms({
        type: "UPDATE_LAST_MESSAGE",
        payload: {
          roomId,
          lastMessage,
        },
      });
      // Log chi tiết phòng event và phòng hiện tại
      console.log("[DEBUG] FE nhận new_message:", {
        eventRoomId: roomId,
        currentRoomId: currentRoomIdRef.current,
      });
      // Nếu KHÔNG ở phòng này thì tăng unreadCount
      if (currentRoomIdRef.current !== roomId) {
        const currentRoom = roomsRef.current.find((r) => r.roomId === roomId);
        const currentUnread = currentRoom?.unreadCount ?? 0;
        dispatchRooms({
          type: "UPDATE_UNREAD",
          payload: {
            roomId,
            unreadCount: currentUnread + 1,
          },
        });
        console.log(
          `[DEBUG] FE tăng unreadCount cho roomId: ${roomId} từ ${currentUnread} lên ${currentUnread + 1}`
        );
      }
    }
  }, []);

  const handleUnreadCountUpdated = useCallback(
    (response: WsResponse<{ roomId: string; unreadCount: number }>) => {
      console.log("[DEBUG] FE nhận unread_count_updated:", response);
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
      console.log("[DEBUG] FE nhận room_marked_read:", response);
      if (response.success && response.data) {
        const currentUserId = localStorage.getItem("user_id");
        if (response.data.userId !== currentUserId) return;
        dispatchRooms({
          type: "MARK_READ",
          payload: { roomId: response.data.roomId },
        });
        console.log(
          `[DEBUG] FE đánh dấu đã đọc roomId: ${response.data.roomId} cho userId: ${response.data.userId}`
        );
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
    console.log("[DEBUG] setCurrentRoomId:", roomId);
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
    // Log khi useEffect chạy
    console.log("[DEBUG] useChatRooms: useEffect chạy");
    const socket = getSocket();
    socketRef.current = socket;
    console.log("[DEBUG] useChatRooms: socket instance", socket);
    socket.connect();
    console.log("[DEBUG] useChatRooms: socket.connect() called");
    setLoading(true);
    setError(null);

    socket.off("rooms", handleRooms);
    socket.on("rooms", handleRooms);
    console.log("[DEBUG] useChatRooms: registered 'rooms' event");

    socket.off("error", handleError);
    socket.on("error", handleError);
    console.log("[DEBUG] useChatRooms: registered 'error' event");

    socket.off("new_message", handleNewMessage);
    socket.on("new_message", handleNewMessage);
    console.log("[DEBUG] useChatRooms: registered 'new_message' event");

    socket.off("unread_count_updated", handleUnreadCountUpdated);
    socket.on("unread_count_updated", handleUnreadCountUpdated);
    console.log(
      "[DEBUG] useChatRooms: registered 'unread_count_updated' event"
    );

    socket.off("room_marked_read", handleRoomMarkedRead);
    socket.on("room_marked_read", handleRoomMarkedRead);
    console.log("[DEBUG] useChatRooms: registered 'room_marked_read' event");

    socket.off("user_online", handleUserOnline);
    socket.on("user_online", handleUserOnline);
    console.log("[DEBUG] useChatRooms: registered 'user_online' event");

    socket.emit("get_rooms");
    console.log("[DEBUG] useChatRooms: emitted 'get_rooms'");

    socket.on("connect", () => {
      const userId = localStorage.getItem("user_id");
      console.log(
        "[DEBUG] useChatRooms: socket connected, id:",
        socket.id,
        "userId:",
        userId
      );
      if (userId) {
        socket.emit("join_room", { roomId: userId });
        console.log(
          `[DEBUG] FE emit join_room for userId (on connect): ${userId}, socketId: ${socket.id}`
        );
      }
    });

    return () => {
      // Log khi cleanup (unmount)
      console.log("[DEBUG] useChatRooms: cleanup (unmount)");
      socket.off("rooms", handleRooms);
      socket.off("error", handleError);
      socket.off("new_message", handleNewMessage);
      socket.off("unread_count_updated", handleUnreadCountUpdated);
      socket.off("room_marked_read", handleRoomMarkedRead);
      socket.off("user_online", handleUserOnline);
      socket.off("connect");
      socket.disconnect();
      console.log("[DEBUG] useChatRooms: socket disconnected");
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
