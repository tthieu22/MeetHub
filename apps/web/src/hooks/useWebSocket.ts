"use client";
import { useEffect, useCallback } from "react";
import { useWebSocketStore } from "@web/store/websocket.store";
import { useUserStore } from "@web/store/user.store";
import { WebSocketEventHandlers } from "@web/services/websocket/websocket.events";
import { WS_EVENTS } from "@web/constants/websocket.events";

export const useWebSocket = () => {
  const { isConnected, isConnecting, error, socket, connect, disconnect } =
    useWebSocketStore();

  const { currentUser } = useUserStore();

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const newSocket = connect();
      if (newSocket) {
        // Setup event handlers
        WebSocketEventHandlers.setupEventHandlers(newSocket);
      }
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  }, [connect]);

  // Disconnect from WebSocket
  const disconnectWebSocket = useCallback(() => {
    disconnect();
    WebSocketEventHandlers.removeEventHandlers();
  }, [disconnect]);

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
        console.log(
          `[useWebSocket] Emitting mark_room_read for room ${roomId}`
        );
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

  // Auto connect when user is authenticated (chỉ connect lần đầu)
  useEffect(() => {
    if (currentUser && !isConnected && !isConnecting) {
      connectWebSocket();
    } else if (!currentUser && isConnected) {
      // Disconnect khi user logout
      disconnectWebSocket();
    }
  }, [
    currentUser,
    isConnected,
    isConnecting,
    connectWebSocket,
    disconnectWebSocket,
  ]);

  // Tắt tự động reconnect khi quay lại tab
  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (
  //       document.visibilityState === "visible" &&
  //       currentUser &&
  //       !isConnected &&
  //       !isConnecting
  //     ) {
  //       connectWebSocket();
  //     }
  //   };

  //   const handleFocus = () => {
  //     if (currentUser && !isConnected && !isConnecting) {
  //       connectWebSocket();
  //     }
  //   };

  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   window.addEventListener("focus", handleFocus);

  //   return () => {
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //     window.removeEventListener("focus", handleFocus);
  //   };
  // }, [currentUser, isConnected, isConnecting, connectWebSocket]);

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
