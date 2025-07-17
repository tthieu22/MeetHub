"use client";
import { useEffect, useCallback, useRef } from "react";
import { useWebSocketStore } from "@web/store/websocket.store";
import { useUserStore } from "@web/store/user.store";
import { WebSocketEventHandlers } from "@web/services/websocket/websocket.events";
import { WS_EVENTS } from "@web/constants/websocket.events";
import { Message } from "@web/types/chat";

export const useWebSocket = () => {
  const { isConnected, isConnecting, error, socket, connect, disconnect } =
    useWebSocketStore();

  const { currentUser, isAuthenticated } = useUserStore();
  const hasConnectedRef = useRef(false);

  /**
   * Kết nối tới WebSocket server (chỉ gọi khi user đã đăng nhập)
   * Không cần truyền tham số
   */
  const connectWebSocket = useCallback(() => {
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
        newSocket.on("connect", () => {
          console.log("[WebSocket] Socket connected:", newSocket.id);
        });
        newSocket.on("disconnect", () => {
          console.log("[WebSocket] Socket disconnected");
        });
        // Setup event handlers
        console.log("[WebSocket] Setup event handlers");
        WebSocketEventHandlers.setupEventHandlers(newSocket, {
          onRooms: (data) =>
            WebSocketEventHandlers.handleRooms(data, newSocket),
          onMessages: (data) => {
            if (data.success && data.data) {
              let roomId: string | undefined = undefined;
              let messages: Message[] = [];
              let hasMore: boolean | undefined = undefined;
              let before: string | undefined = undefined;

              if (
                "roomId" in data.data &&
                typeof data.data.roomId === "string"
              ) {
                roomId = data.data.roomId;
                messages = data.data.data;
                hasMore = data.data.hasMore;
                before = data.data.before;
              } else if (
                Array.isArray(data.data.data) &&
                data.data.data.length > 0
              ) {
                messages = data.data.data;
                roomId = messages[0].conversationId;
                hasMore = data.data.hasMore;
                before = data.data.before;
              }

              if (typeof roomId === "string") {
                WebSocketEventHandlers.handleMessages({
                  ...data,
                  data: {
                    roomId,
                    data: messages,
                    hasMore: typeof hasMore === "boolean" ? hasMore : false,
                    before,
                  },
                });
              }
            }
          },
          onUnreadCountUpdated: (data) =>
            WebSocketEventHandlers.handleUnreadCountUpdated(data),
          onRoomOnlineMembers: (data) =>
            WebSocketEventHandlers.handleRoomOnlineMembers(data),
        });
      } else {
        console.error("[WebSocket] Không khởi tạo được socket");
      }
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      hasConnectedRef.current = false;
    }
  }, [connect, isAuthenticated, currentUser, isConnecting]);

  /**
   * Ngắt kết nối WebSocket và cleanup event handler
   * Không cần truyền tham số
   */
  const disconnectWebSocket = useCallback(() => {
    hasConnectedRef.current = false;

    // Emit user_offline ngay lập tức khi logout
    if (socket && socket.connected) {
      socket.emit(WS_EVENTS.USER_OFFLINE);
    }

    disconnect();
    WebSocketEventHandlers.removeEventHandlers();
  }, [disconnect, socket]);

  /**
   * Gửi tin nhắn mới vào phòng chat
   * @param roomId - ID của phòng chat
   * @param text - Nội dung tin nhắn
   */
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

  /**
   * Lấy danh sách phòng chat của user
   * Không cần truyền tham số
   */
  const getRooms = useCallback(() => {
    if (isConnected && socket) {
      socket.emit(WS_EVENTS.GET_ROOMS);
    } else {
      console.warn("WebSocket not connected");
    }
  }, [isConnected, socket]);

  /**
   * Lấy tin nhắn của một phòng chat
   * @param roomId - ID của phòng chat
   * @param before - (tuỳ chọn) Lấy các tin nhắn trước thời điểm này (phân trang)
   */
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

  /**
   * Đánh dấu đã đọc phòng chat
   * @param roomId - ID của phòng chat
   */
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

  /**
   * Lấy số lượng tin nhắn chưa đọc của phòng
   * @param roomId - ID của phòng chat
   */
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

  /**
   * Lấy danh sách tất cả user đang online
   * Không cần truyền tham số
   */
  const getAllOnlineUsers = useCallback(() => {
    if (isConnected && socket) {
      socket.emit("get_all_online_users");
    } else {
      console.warn("WebSocket not connected");
    }
  }, [isConnected, socket]);

  /**
   * Tham gia vào một phòng chat
   * @param roomId - ID của phòng chat muốn join
   */
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

  /**
   * Tạo phòng chat mới
   * @param payload - Thông tin phòng cần tạo, ví dụ: { name: string, members?: string[] }
   */
  const createRoom = useCallback(
    (payload: Record<string, unknown>) => {
      if (isConnected && socket) {
        socket.emit("create_room", payload);
      } else {
        console.warn("WebSocket not connected");
      }
    },
    [isConnected, socket]
  );

  /**
   * Đóng phòng chat hỗ trợ (chỉ dành cho admin/support)
   * @param roomId - ID của phòng support cần đóng
   */
  const closeSupportRoom = useCallback(
    (roomId: string) => {
      if (isConnected && socket) {
        socket.emit(WS_EVENTS.CLOSE_SUPPORT_ROOM, { roomId });
      } else {
        console.warn("WebSocket not connected");
      }
    },
    [isConnected, socket]
  );

  /**
   * Admin tham gia phòng chat hỗ trợ
   * @param roomId - ID của phòng support mà admin muốn join
   */
  const adminJoinSupportRoom = useCallback(
    (roomId: string) => {
      if (isConnected && socket) {
        socket.emit(WS_EVENTS.ADMIN_JOIN_SUPPORT_ROOM, { roomId });
      } else {
        console.warn("WebSocket not connected");
      }
    },
    [isConnected, socket]
  );

  /**
   * User gửi yêu cầu hỗ trợ tới admin
   * Không cần truyền tham số
   */
  const requestSupport = useCallback(() => {
    if (isConnected && socket) {
      socket.emit(WS_EVENTS.USER_REQUEST_SUPPORT);
    } else {
      console.warn("WebSocket not connected");
    }
  }, [isConnected, socket]);

  /**
   * Lấy danh sách thành viên online của một phòng
   * @param roomId - ID của phòng cần lấy danh sách online
   */
  const getRoomOnlineMembers = useCallback(
    (roomId: string) => {
      if (isConnected && socket) {
        socket.emit(WS_EVENTS.GET_ROOM_ONLINE_MEMBERS, { roomId });
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

  // Auto reconnect on disconnect nếu còn access_token
  useEffect(() => {
    if (!socket) return;
    const handleDisconnect = () => {
      const hasToken =
        typeof window !== "undefined" && !!localStorage.getItem("access_token");
      if (hasToken) {
        setTimeout(() => {
          connectWebSocket();
        }, 5000); // reconnect sau 1s
      }
    };
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, connectWebSocket]);

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
    createRoom,
    closeSupportRoom,
    adminJoinSupportRoom,
    requestSupport,
    getRoomOnlineMembers,
  };
};
