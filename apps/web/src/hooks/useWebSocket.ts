"use client";
import { useEffect, useCallback, useRef } from "react";
import { useWebSocketStore } from "@web/store/websocket.store";
import { useUserStore } from "@web/store/user.store";
import { WebSocketEventHandlers } from "@web/services/websocket/websocket.events";
import { WS_EVENTS } from "@web/constants/websocket.events";

export const useWebSocket = () => {
  const { isConnected, isConnecting, error, socket, connect, disconnect } =
    useWebSocketStore();

  const { currentUser, isAuthenticated } = useUserStore();
  const hasConnectedRef = useRef(false);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    // Chỉ connect khi user đã đăng nhập và chưa connect
    if (
      !isAuthenticated ||
      !currentUser ||
      hasConnectedRef.current ||
      isConnecting
    ) {
      return;
    }

    try {
      hasConnectedRef.current = true;
      const newSocket = connect();
      if (newSocket) {
        // Setup event handlers
        WebSocketEventHandlers.setupEventHandlers(newSocket);
      }
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      hasConnectedRef.current = false;
    }
  }, [connect, isAuthenticated, currentUser, isConnecting]);

  // Disconnect from WebSocket
  const disconnectWebSocket = useCallback(() => {
    hasConnectedRef.current = false;

    // Emit user_offline ngay lập tức khi logout
    if (socket && socket.connected) {
      socket.emit(WS_EVENTS.USER_OFFLINE);
    }

    disconnect();
    WebSocketEventHandlers.removeEventHandlers();
  }, [disconnect, socket]);

  // Send message
  const sendMessage = useCallback(
    (roomId: string, text: string) => {
      if (isConnected && socket) {
        socket.emit(WS_EVENTS.CREATE_MESSAGE, { roomId, text });
      } else {
        console.warn("WebSocket not connected");
      }
    },
    [isConnected, socket]
  );

  // Get rooms
  const getRooms = useCallback(() => {
    if (isConnected && socket) {
      socket.emit(WS_EVENTS.GET_ROOMS);
    } else {
      console.warn("WebSocket not connected");
    }
  }, [isConnected, socket]);

  // Get messages
  const getMessages = useCallback(
    (roomId: string, before?: string) => {
      if (isConnected && socket) {
        socket.emit(WS_EVENTS.GET_MESSAGES, { roomId, before });
      } else {
        console.warn("WebSocket not connected");
      }
    },
    [isConnected, socket]
  );

  // Mark room as read
  const markRoomRead = useCallback(
    (roomId: string) => {
      if (isConnected && socket) {
        socket.emit(WS_EVENTS.MARK_ROOM_READ, { roomId });
      } else {
        console.warn("WebSocket not connected");
      }
    },
    [isConnected, socket]
  );

  // Get unread count
  const getUnreadCount = useCallback(
    (roomId: string) => {
      if (isConnected && socket) {
        socket.emit(WS_EVENTS.GET_UNREAD_COUNT, { roomId });
      } else {
        console.warn("WebSocket not connected");
      }
    },
    [isConnected, socket]
  );

  // Get all online users
  const getAllOnlineUsers = useCallback(() => {
    if (isConnected && socket) {
      socket.emit("get_all_online_users");
    } else {
      console.warn("WebSocket not connected");
    }
  }, [isConnected, socket]);

  // Join room
  const joinRoom = useCallback(
    (roomId: string) => {
      if (isConnected && socket) {
        socket.emit(WS_EVENTS.JOIN_ROOM, { roomId });
        socket.emit("get_room_online_members", { roomId });
        socket.emit(WS_EVENTS.GET_UNREAD_COUNT, { roomId });
      } else {
        console.warn("WebSocket not connected");
      }
    },
    [isConnected, socket]
  );

  // Auto connect when user is authenticated hoặc có access_token trong localStorage
  useEffect(() => {
    const hasToken =
      typeof window !== "undefined" && !!localStorage.getItem("access_token");
    if (
      ((isAuthenticated && currentUser) || hasToken) &&
      !isConnected &&
      !isConnecting &&
      !hasConnectedRef.current
    ) {
      connectWebSocket();
    } else if (!isAuthenticated && isConnected && !hasToken) {
      // Disconnect khi user logout và không còn token
      disconnectWebSocket();
    }
  }, [
    isAuthenticated,
    currentUser,
    isConnected,
    isConnecting,
    connectWebSocket,
    disconnectWebSocket,
  ]);

  // Handle page hide - only disconnect when actually closing the tab
  useEffect(() => {
    const handlePageHide = (event: PageTransitionEvent) => {
      // Chỉ emit user_offline khi thực sự đóng tab (không phải chuyển tab)
      if (!event.persisted && isConnected && socket) {
        socket.emit(WS_EVENTS.USER_OFFLINE);
      }
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isConnected, socket]);

  return {
    // State
    isConnected,
    isConnecting,
    error,
    socket,

    // Actions
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    sendMessage,
    getRooms,
    getMessages,
    markRoomRead,
    getUnreadCount,
    getAllOnlineUsers,
    joinRoom,
  };
};
