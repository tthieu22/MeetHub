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
  const offlineTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Auto connect when user is authenticated
  useEffect(() => {
    if (
      isAuthenticated &&
      currentUser &&
      !isConnected &&
      !isConnecting &&
      !hasConnectedRef.current
    ) {
      connectWebSocket();
    } else if (!isAuthenticated && isConnected) {
      // Disconnect khi user logout
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

  // Handle page visibility change - delay offline notification
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isConnected && socket) {
        // Clear any existing timeout
        if (offlineTimeoutRef.current) {
          console.log("[useWebSocket] Clearing existing offline timeout");
          clearTimeout(offlineTimeoutRef.current);
        }
        // Schedule offline notification after 30 seconds
        offlineTimeoutRef.current = setTimeout(() => {
          socket.emit(WS_EVENTS.USER_OFFLINE);
        }, 30000); // 30 seconds delay
      } else if (document.visibilityState === "visible") {
        // Clear offline timeout when page becomes visible
        if (offlineTimeoutRef.current) {
          clearTimeout(offlineTimeoutRef.current);
          offlineTimeoutRef.current = null;
        }

        // Reconnect if needed
        if (
          isAuthenticated &&
          currentUser &&
          !isConnected &&
          !isConnecting &&
          !hasConnectedRef.current
        ) {
          connectWebSocket();
        }
      }
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      // Chỉ emit user_offline khi thực sự đóng tab (không phải chuyển tab)
      if (!event.persisted && isConnected && socket) {
        socket.emit(WS_EVENTS.USER_OFFLINE);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      // Clear timeout on cleanup
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
      }
    };
  }, [
    isConnected,
    socket,
    isAuthenticated,
    currentUser,
    isConnecting,
    connectWebSocket,
  ]);

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
    joinRoom,
  };
};
