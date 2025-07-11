import { Socket } from "socket.io-client";
import { useChatStore } from "@web/store/chat.store";
import { useUserStore } from "@web/store/user.store";
import { WsResponse } from "@web/types/websocket";
import { Message, ChatRoom } from "@web/types/chat";
import { WS_RESPONSE_EVENTS } from "@web/constants/websocket.events";

// WebSocket event handlers - xử lý các events từ backend
export class WebSocketEventHandlers {
  // Xử lý kết nối thành công
  static handleConnectionSuccess(
    socket: Socket,
    data: WsResponse<{ userId: string; rooms: string[] }>
  ) {
    console.log("🔌 [WebSocket] Received CONNECTION_SUCCESS event:", data);

    if (data.success && data.data) {
      console.log(
        "✅ [WebSocket] Connection successful for user:",
        data.data.userId
      );
      console.log("🏠 [WebSocket] User joined rooms:", data.data.rooms);

      // Lấy danh sách rooms
      console.log("📤 [WebSocket] Requesting rooms data...");
      socket.emit("get_rooms");
    } else {
      console.error("❌ [WebSocket] Connection failed:", data);
    }
  }

  // Xử lý nhận danh sách rooms
  static handleRooms(data: WsResponse<ChatRoom[]>) {
    console.log("🏠 [WebSocket] Received ROOMS event:", data);

    if (data.success && data.data) {
      console.log(
        "✅ [WebSocket] Rooms data received:",
        data.data.length,
        "rooms"
      );

      data.data.forEach((room, index) => {
        console.log(`📋 [WebSocket] Room ${index + 1}:`, {
          name: room.name,
          roomId: room.roomId,
          onlineMemberIds: room.onlineMemberIds,
          memberCount: room.members?.length,
          members: room.members?.map((m) => ({
            userId: m.userId,
            name: m.name,
          })),
        });
      });

      const { setRooms } = useChatStore.getState();
      setRooms(data.data);
      console.log("✅ [WebSocket] Rooms stored in Zustand");
    } else {
      console.error("❌ [WebSocket] Invalid rooms data:", data);
    }
  }

  // Xử lý nhận messages
  static handleMessages(
    data: WsResponse<{
      roomId: string;
      data: Message[];
      hasMore: boolean;
      before?: string;
    }>
  ) {
    if (data.success && data.data) {
      const { roomId, data: messages } = data.data;
      const { setMessages } = useChatStore.getState();
      setMessages(roomId, messages);
      console.log("Received messages for room:", roomId, messages);
    }
  }

  // Xử lý tin nhắn mới
  static handleNewMessage(socket: Socket, data: WsResponse<Message>) {
    if (data.success && data.data) {
      console.log("New message received:", data.data);

      const { addMessage, currentRoomId } = useChatStore.getState();
      const roomId = data.data.conversationId;

      // Thêm tin nhắn mới vào store
      addMessage(roomId, data.data);

      // Nếu đang ở room này, mark as read
      if (currentRoomId === roomId) {
        socket.emit("mark_room_read", { roomId });
      }

      // Hiển thị thông báo nếu không đang ở room này
      if (currentRoomId !== roomId) {
        this.showMessageNotification(data.data);
      }
    }
  }

  // Xử lý cập nhật unread count
  static handleUnreadCountUpdated(
    data: WsResponse<{ roomId: string; unreadCount: number }>
  ) {
    if (data.success && data.data) {
      console.log("Unread count updated:", data.data);

      const { updateUnreadCount } = useChatStore.getState();
      updateUnreadCount(data.data.roomId, data.data.unreadCount);
    }
  }

  // Xử lý user online
  static handleUserOnline(
    data: WsResponse<{ userId: string; roomId: string }>
  ) {
    console.log("🔵 [WebSocket] Received USER_ONLINE event:", data);

    if (data.success && data.data) {
      console.log("✅ [WebSocket] User online data:", data.data);
      console.log(
        "📝 [WebSocket] Updating store for user:",
        data.data.userId,
        "in room:",
        data.data.roomId
      );

      const { setUserOnline, updateRoomOnlineStatus } = useChatStore.getState();
      setUserOnline(data.data.userId, true);
      updateRoomOnlineStatus(data.data.roomId, data.data.userId, true);

      console.log("✅ [WebSocket] Store updated for user online");
    } else {
      console.error("❌ [WebSocket] Invalid user online data:", data);
    }
  }

  // Xử lý user offline
  static handleUserOffline(
    data: WsResponse<{ userId: string; roomId: string }>
  ) {

    if (data.success && data.data) {
      const { setUserOnline, updateRoomOnlineStatus } = useChatStore.getState();
      setUserOnline(data.data.userId, false);
      updateRoomOnlineStatus(data.data.roomId, data.data.userId, false);
    }
  }

  // Xử lý lỗi
  static handleError(data: WsResponse) {
    console.error("WebSocket error:", data);

    // TODO: Hiển thị thông báo lỗi cho user
    if (data.message) {
      console.error("Error message:", data.message);
    }
  }

  // Xử lý lỗi authentication
  static handleAuthError(data: WsResponse) {
    console.error("WebSocket auth error:", data);

    // Logout user nếu token không hợp lệ
    if (data.code === "TOKEN_INVALID" || data.code === "USER_INVALID") {
      const { logout } = useUserStore.getState();
      logout();

      // Redirect to login
      window.location.href = "/login";
    }
  }

  // Hiển thị thông báo tin nhắn mới
  private static showMessageNotification(message: Message) {
    const senderName =
      typeof message.senderId === "object"
        ? message.senderId.username || message.senderId.email
        : "Unknown";

    // TODO: Implement notification system
    console.log(`Tin nhắn mới từ ${senderName}: ${message.text}`);

    // Có thể sử dụng toast notification hoặc browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Tin nhắn mới từ ${senderName}`, {
        body: message.text,
        icon: "/favicon.ico",
      });
    }
  }

  // Setup tất cả event handlers cho socket
  static setupEventHandlers(socket: Socket) {
    console.log(
      "🔧 [WebSocket] Setting up event handlers for socket:",
      socket.id
    );

    // Response events - match với backend WebSocketEventName
    socket.on(
      WS_RESPONSE_EVENTS.CONNECTION_SUCCESS,
      (data: WsResponse<{ userId: string; rooms: string[] }>) => {
        this.handleConnectionSuccess(socket, data);
      }
    );

    socket.on(WS_RESPONSE_EVENTS.ROOMS, (data: WsResponse<ChatRoom[]>) => {
      this.handleRooms(data);
    });

    socket.on(
      WS_RESPONSE_EVENTS.MESSAGES,
      (
        data: WsResponse<{
          roomId: string;
          data: Message[];
          hasMore: boolean;
          before?: string;
        }>
      ) => {
        this.handleMessages(data);
      }
    );

    socket.on(WS_RESPONSE_EVENTS.NEW_MESSAGE, (data: WsResponse<Message>) => {
      this.handleNewMessage(socket, data);
    });

    socket.on(
      WS_RESPONSE_EVENTS.UNREAD_COUNT_UPDATED,
      (data: WsResponse<{ roomId: string; unreadCount: number }>) => {
        this.handleUnreadCountUpdated(data);
      }
    );

    console.log(
      "🔧 [WebSocket] Setting up USER_ONLINE handler for event:",
      WS_RESPONSE_EVENTS.USER_ONLINE
    );
    socket.on(
      WS_RESPONSE_EVENTS.USER_ONLINE,
      (data: WsResponse<{ userId: string; roomId: string }>) => {
        console.log(
          "🎯 [WebSocket] USER_ONLINE event handler triggered:",
          data
        );
        this.handleUserOnline(data);
      }
    );

    console.log(
      "🔧 [WebSocket] Setting up USER_OFFLINE handler for event:",
      WS_RESPONSE_EVENTS.USER_OFFLINE
    );
    socket.on(
      WS_RESPONSE_EVENTS.USER_OFFLINE,
      (data: WsResponse<{ userId: string; roomId: string }>) => {
        console.log(
          "🎯 [WebSocket] USER_OFFLINE event handler triggered:",
          data
        );
        this.handleUserOffline(data);
      }
    );

    socket.on(WS_RESPONSE_EVENTS.ERROR, (data: WsResponse) => {
      this.handleError(data);
    });

    socket.on(WS_RESPONSE_EVENTS.AUTH_ERROR, (data: WsResponse) => {
      this.handleAuthError(data);
    });

    console.log("✅ [WebSocket] All event handlers setup completed");
  }

  // Remove tất cả event handlers
  static removeEventHandlers() {
    // This will be handled by the socket instance when it's disconnected
  }
}
