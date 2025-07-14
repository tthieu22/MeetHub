import { Socket } from "socket.io-client";
import { useChatStore } from "@web/store/chat.store";
import { useUserStore } from "@web/store/user.store";
import { WsResponse } from "@web/types/websocket";
import { Message, ChatRoom, UsersOnline } from "@web/types/chat";
import { WS_RESPONSE_EVENTS } from "@web/constants/websocket.events";
import { useWebSocketStore } from "@web/store/websocket.store";

// Định nghĩa kiểu dữ liệu cho các event Chat with admin
export interface SupportRoomEvent {
  roomId: string;
  admin?: {
    name?: string;
    _id?: string;
  };
}

// WebSocket event handlers - xử lý các events từ backend
export class WebSocketEventHandlers {
  // Xử lý kết nối thành công
  static handleConnectionSuccess(
    socket: Socket,
    data: WsResponse<{ userId: string; rooms: string[] }>
  ) {
    if (data.success && data.data) {
      socket.emit("get_rooms");
      // Lấy danh sách tất cả người online
      socket.emit("get_all_online_users");
    }
  }

  // Xử lý nhận danh sách rooms
  static handleRooms(data: WsResponse<ChatRoom[]>, socket?: Socket) {
    if (data.success && data.data) {
      const { setRooms } = useChatStore.getState();
      setRooms(data.data);
      // Gửi get_room_online_members và get_unread_count cho tất cả phòng
      if (socket) {
        data.data.forEach((room) => {
          socket.emit("get_room_online_members", { roomId: room.roomId });
          socket.emit("get_unread_count", { roomId: room.roomId });
        });
      }
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
    }
  }

  // Xử lý tin nhắn mới
  static handleNewMessage(socket: Socket, data: WsResponse<Message>) {
    if (data.success && data.data) {
      const {
        addMessage,
        currentRoomId,
        updateUnreadCount,
        unreadCounts,
        updateRoom,
      } = useChatStore.getState();
      const { currentUser } = useUserStore.getState();
      const roomId = data.data.conversationId;

      // Thêm tin nhắn mới vào store
      addMessage(roomId, data.data);

      // Cập nhật lastMessage cho room
      const lastMessage = {
        messageId: data.data._id,
        conversationId: data.data.conversationId,
        senderId:
          typeof data.data.senderId === "object" && data.data.senderId !== null
            ? data.data.senderId._id
            : data.data.senderId,
        senderEmail:
          typeof data.data.senderId === "object" && data.data.senderId !== null
            ? data.data.senderId.email
            : undefined,
        senderName:
          typeof data.data.senderId === "object" && data.data.senderId !== null
            ? data.data.senderId.name || data.data.senderId.username
            : undefined,
        text: data.data.text,
        createdAt: data.data.createdAt,
        fileUrl: data.data.fileUrl || undefined,
        fileName: data.data.fileName || undefined,
        fileType: data.data.fileType || undefined,
      };
      updateRoom(roomId, { lastMessage });

      // Nếu đang ở room này, mark as read
      if (currentRoomId === roomId) {
        socket.emit("mark_room_read", { roomId });
      }

      // Nếu không phải phòng đang mở, tăng số chưa đọc (chỉ cho user khác)
      if (
        currentRoomId !== roomId &&
        currentUser &&
        ((typeof data.data.senderId === "string" &&
          data.data.senderId !== currentUser._id) ||
          (typeof data.data.senderId === "object" &&
            data.data.senderId._id !== currentUser._id))
      ) {
        const currentUnread = unreadCounts[roomId] || 0;
        updateUnreadCount(roomId, currentUnread + 1);
        this.showMessageNotification(data.data);
      }
    }
  }

  // Xử lý cập nhật unread count
  static handleUnreadCountUpdated(
    data: WsResponse<{ roomId: string; unreadCount: number }>
  ) {
    if (data.success && data.data) {
      const { updateUnreadCount } = useChatStore.getState();
      const { roomId, unreadCount } = data.data;

      // Cập nhật unread count
      updateUnreadCount(roomId, unreadCount);
    }
  }

  // Xử lý nhận danh sách tất cả người online
  static handleAllOnlineUsers(data: WsResponse<UsersOnline[]>) {
    if (data.success && data.data) {
      const { setAllOnline, setOnlineUsers } = useChatStore.getState();

      // Cập nhật danh sách allOnline
      setAllOnline(
        data.data.map((user) => ({
          userId: user.userId,
          name: user.name,
          email: user.email,
          avatarURL: user.avatarURL,
          isOnline: user.isOnline,
        }))
      );

      // Cập nhật onlineUsers object để tương thích với OnlineUsersList component
      const onlineUsersMap: Record<string, boolean> = {};
      data.data.forEach((user) => {
        onlineUsersMap[user.userId] = user.isOnline;
      });
      setOnlineUsers(onlineUsersMap);
    }
  }

  // Xử lý user online
  static handleUserOnline(
    data: WsResponse<{ userId: string; roomId: string }>
  ) {
    if (data.success && data.data) {
      const { setUserOnline, updateRoomOnlineStatus } = useChatStore.getState();
      setUserOnline(data.data.userId, true);
      updateRoomOnlineStatus(data.data.roomId, data.data.userId, true);
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
    let senderName = "Unknown";
    if (typeof message.senderId === "object") {
      senderName =
        message.senderId.username || message.senderId.email || "Unknown";
    } else if (typeof message.senderId === "string") {
      // Thử tìm trong danh sách phòng
      const { rooms } = useChatStore.getState();
      for (const room of rooms) {
        if (Array.isArray(room.members)) {
          const found = room.members.find((m) => m.userId === message.senderId);
          if (found) {
            senderName = found.name || found.email || "Unknown";
            break;
          }
        }
      }
    }

    // Có thể sử dụng toast notification hoặc browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Tin nhắn mới từ ${senderName}`, {
        body: message.text,
        icon: "/favicon.ico",
      });
    }
  }

  // Thêm handler nhận danh sách online của phòng khi join room
  static handleRoomOnlineMembers(
    data: WsResponse<{ roomId: string; onlineMemberIds: string[] }>
  ) {
    if (data.success && data.data) {
      const { setRoomOnlineMembers } = useChatStore.getState();
      setRoomOnlineMembers(data.data.roomId, data.data.onlineMemberIds);
    }
  }

  // Xử lý đánh dấu đã đọc thành công
  static handleRoomMarkedRead(data: WsResponse<{ roomId: string }>) {
    if (data.success && data.data) {
      const { updateUnreadCount } = useChatStore.getState();
      updateUnreadCount(data.data.roomId, 0);
    }
  }

  // Thông báo khi phòng đang pending (chưa có admin)
  static handleSupportRoomPending(onSupportRoomPending?: () => void) {
    console.debug("[FE] handleSupportRoomPending");
    if (onSupportRoomPending) onSupportRoomPending();
  }

  // Khi đã được gán admin
  static handleSupportRoomAssigned(
    data: SupportRoomEvent,
    onSupportRoomAssigned?: (data: SupportRoomEvent) => void
  ) {
    console.debug("[FE] handleSupportRoomAssigned", data);
    if (onSupportRoomAssigned) onSupportRoomAssigned(data);
  }

  // Khi admin join vào phòng pending
  static handleSupportAdminJoined(
    data: SupportRoomEvent,
    onSupportAdminJoined?: (data: SupportRoomEvent) => void
  ) {
    console.debug("[FE] handleSupportAdminJoined", data);
    if (onSupportAdminJoined) onSupportAdminJoined(data);
    // Sau khi admin join, reload lại danh sách phòng và load messages cho phòng support
    try {
      const { socket } = useWebSocketStore.getState();
      if (socket && socket.connected) {
        socket.emit("get_rooms");
        if (data && data.roomId) {
          socket.emit("get_messages", { roomId: data.roomId });
        }
      }
    } catch (err) {
      console.error(
        "[FE] handleSupportAdminJoined: reload rooms/messages error",
        err
      );
    }
  }

  // Khi admin nhận được ticket hỗ trợ
  static handleSupportTicketAssigned(
    data: { roomId: string; userId: string },
    onSupportTicketAssigned?: (data: { roomId: string; userId: string }) => void
  ) {
    console.debug("[FE] handleSupportTicketAssigned", data);
    if (onSupportTicketAssigned) onSupportTicketAssigned(data);
  }

  // Hàm emit yêu cầu chat với admin từ FE
  static emitUserRequestSupport(socket: Socket) {
    if (socket && socket.connected) {
      console.debug("[WebSocketEventHandlers] Emit user_request_support");
      socket.emit("user_request_support");
    } else {
      console.error("[WebSocketEventHandlers] Socket not connected");
    }
  }

  // Setup tất cả event handlers cho socket
  static setupEventHandlers(
    socket: Socket,
    handlers?: {
      onSupportRoomPending?: () => void;
      onSupportRoomAssigned?: (data: SupportRoomEvent) => void;
      onSupportAdminJoined?: (data: SupportRoomEvent) => void;
      onSupportTicketAssigned?: (data: {
        roomId: string;
        userId: string;
      }) => void;
    }
  ) {
    // Response events - match với backend WebSocketEventName
    socket.on(
      WS_RESPONSE_EVENTS.CONNECTION_SUCCESS,
      (data: WsResponse<{ userId: string; rooms: string[] }>) => {
        this.handleConnectionSuccess(socket, data);
      }
    );

    socket.on(WS_RESPONSE_EVENTS.ROOMS, (data: WsResponse<ChatRoom[]>) => {
      this.handleRooms(data, socket);
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

    socket.on(
      WS_RESPONSE_EVENTS.UNREAD_COUNT,
      (data: WsResponse<{ roomId: string; unreadCount: number }>) => {
        this.handleUnreadCountUpdated(data);
      }
    );

    socket.on(
      WS_RESPONSE_EVENTS.USER_ONLINE,
      (data: WsResponse<{ userId: string; roomId: string }>) => {
        this.handleUserOnline(data);
      }
    );

    socket.on(
      WS_RESPONSE_EVENTS.USER_OFFLINE,
      (data: WsResponse<{ userId: string; roomId: string }>) => {
        this.handleUserOffline(data);
      }
    );

    socket.on("all_online_users", (data: WsResponse<UsersOnline[]>) => {
      this.handleAllOnlineUsers(data);
    });

    socket.on(
      "room_online_members",
      (data: WsResponse<{ roomId: string; onlineMemberIds: string[] }>) => {
        WebSocketEventHandlers.handleRoomOnlineMembers(data);
      }
    );

    socket.on("room_marked_read", (data: WsResponse<{ roomId: string }>) => {
      this.handleRoomMarkedRead(data);
    });
    socket.on(
      "mark_room_read_success",
      (data: WsResponse<{ roomId: string }>) => {
        this.handleRoomMarkedRead(data);
      }
    );

    socket.on("support_room_pending", () => {
      WebSocketEventHandlers.handleSupportRoomPending(
        handlers?.onSupportRoomPending
      );
    });
    socket.on("support_room_assigned", (data: SupportRoomEvent) => {
      WebSocketEventHandlers.handleSupportRoomAssigned(
        data,
        handlers?.onSupportRoomAssigned
      );
    });
    socket.on("support_admin_joined", (data: SupportRoomEvent) => {
      WebSocketEventHandlers.handleSupportAdminJoined(
        data,
        handlers?.onSupportAdminJoined
      );
    });
    socket.on(
      "support_ticket_assigned",
      (data: { roomId: string; userId: string }) => {
        WebSocketEventHandlers.handleSupportTicketAssigned(
          data,
          handlers?.onSupportTicketAssigned
        );
      }
    );

    socket.on(WS_RESPONSE_EVENTS.ERROR, (data: WsResponse) => {
      this.handleError(data);
    });

    socket.on(WS_RESPONSE_EVENTS.AUTH_ERROR, (data: WsResponse) => {
      this.handleAuthError(data);
    });
  }

  // Remove tất cả event handlers
  static removeEventHandlers() {
    // This will be handled by the socket instance when it's disconnected
  }
}
