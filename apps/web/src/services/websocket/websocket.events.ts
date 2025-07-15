import { Socket } from "socket.io-client";
import { useChatStore } from "@web/store/chat.store";
import { useUserStore } from "@web/store/user.store";
import { Message, ChatRoom, UsersOnline } from "@web/types/chat";
import { WebSocketEventHandlers as HandlerMap } from "./websocket.types";
import {
  bindMessageEventHandlers,
  bindRoomEventHandlers,
  bindUserEventHandlers,
  bindErrorEventHandlers,
  bindSupportAdminEventHandlers,
} from "./event-binders";

// WebSocket event handlers - xử lý các events từ backend
export class WebSocketEventHandlers {
  // Xử lý kết nối thành công
  static handleConnectionSuccess(
    socket: Socket,
    data: { success: boolean; data: { userId: string; rooms: string[] } }
  ) {
    console.log("[WebSocket] handleConnectionSuccess:", data); // Log dữ liệu connection
    if (data.success && data.data) {
      socket.emit("get_rooms");
      // Lấy danh sách tất cả người online
      socket.emit("get_all_online_users");
    }
  }

  // Xử lý nhận danh sách rooms
  static handleRooms(
    data: { success: boolean; data: ChatRoom[] },
    socket?: Socket
  ) {
    console.log("[WebSocket] handleRooms data:", data); // Log dữ liệu rooms
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
    } else {
      console.error("[WebSocket] handleRooms failed:", data);
    }
  }

  // Xử lý nhận messages
  static handleMessages(data: {
    success: boolean;
    data: {
      roomId: string;
      data: Message[];
      hasMore: boolean;
      before?: string;
    };
  }) {
    console.log("[WebSocket] handleMessages:", data); // Log dữ liệu messages
    if (data.success && data.data) {
      const { roomId, data: messages } = data.data;
      const { setMessages } = useChatStore.getState();
      setMessages(roomId, messages);
    } else {
      console.error("[WebSocket] handleMessages failed:", data);
    }
  }

  // Xử lý tin nhắn mới
  static handleNewMessage(
    socket: Socket,
    data: { success: boolean; data: Message }
  ) {
    console.log("[WebSocket] handleNewMessage:", data); // Log dữ liệu new message
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
    } else {
      console.error("[WebSocket] handleNewMessage failed:", data);
    }
  }

  // Xử lý cập nhật unread count
  static handleUnreadCountUpdated(data: {
    success: boolean;
    data: { roomId: string; unreadCount: number };
  }) {
    console.log("[WebSocket] handleUnreadCountUpdated:", data); // Log dữ liệu unread count
    if (data.success && data.data) {
      const { updateUnreadCount } = useChatStore.getState();
      const { roomId, unreadCount } = data.data;

      // Cập nhật unread count
      updateUnreadCount(roomId, unreadCount);
    } else {
      console.error("[WebSocket] handleUnreadCountUpdated failed:", data);
    }
  }

  // Xử lý nhận danh sách tất cả người online
  static handleAllOnlineUsers(data: { success: boolean; data: UsersOnline[] }) {
    console.log("[WebSocket] handleAllOnlineUsers:", data); // Log dữ liệu all online users
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
    } else {
      console.error("[WebSocket] handleAllOnlineUsers failed:", data);
    }
  }

  // Xử lý user online
  static handleUserOnline(data: {
    success: boolean;
    data: { userId: string; roomId: string };
  }) {
    console.log("[WebSocket] handleUserOnline:", data); // Log dữ liệu user online
    if (data.success && data.data) {
      const { setUserOnline, updateRoomOnlineStatus } = useChatStore.getState();
      setUserOnline(data.data.userId, true);
      updateRoomOnlineStatus(data.data.roomId, data.data.userId, true);
    } else {
      console.error("[WebSocket] handleUserOnline failed:", data);
    }
  }

  // Xử lý user offline
  static handleUserOffline(data: {
    success: boolean;
    data: { userId: string; roomId: string };
  }) {
    console.log("[WebSocket] handleUserOffline:", data); // Log dữ liệu user offline
    if (data.success && data.data) {
      const { setUserOnline, updateRoomOnlineStatus } = useChatStore.getState();
      setUserOnline(data.data.userId, false);
      updateRoomOnlineStatus(data.data.roomId, data.data.userId, false);
    } else {
      console.error("[WebSocket] handleUserOffline failed:", data);
    }
  }

  // Xử lý lỗi
  static handleError(data: { message?: string }) {
    console.error("[WebSocket] handleError:", data); // Log lỗi
    // TODO: Hiển thị thông báo lỗi cho user
    if (data.message) {
      console.error("Error message:", data.message);
    }
  }

  // Xử lý lỗi authentication
  static handleAuthError(data: { code?: string }) {
    console.error("[WebSocket] handleAuthError:", data); // Log lỗi auth
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
  static handleRoomOnlineMembers(data: {
    success: boolean;
    data: { roomId: string; onlineMemberIds: string[] };
  }) {
    console.log("[WebSocket] handleRoomOnlineMembers:", data); // Log dữ liệu room online members
    if (data.success && data.data) {
      const { setRoomOnlineMembers } = useChatStore.getState();
      setRoomOnlineMembers(data.data.roomId, data.data.onlineMemberIds);
    } else {
      console.error("[WebSocket] handleRoomOnlineMembers failed:", data);
    }
  }

  // Xử lý đánh dấu đã đọc thành công
  static handleRoomMarkedRead(data: {
    success: boolean;
    data: { roomId: string };
  }) {
    console.log("[WebSocket] handleRoomMarkedRead:", data); // Log dữ liệu room marked read
    if (data.success && data.data) {
      const { updateUnreadCount } = useChatStore.getState();
      updateUnreadCount(data.data.roomId, 0);
    } else {
      console.error("[WebSocket] handleRoomMarkedRead failed:", data);
    }
  }

  // Hàm emit yêu cầu chat với admin từ FE
  static emitUserRequestSupport(socket: Socket) {
    if (socket && socket.connected) {
      socket.emit("user_request_support");
    } else {
      console.error("[WebSocketEventHandlers] Socket not connected");
    }
  }

  // Setup tất cả event handlers cho socket
  static setupEventHandlers(socket: Socket, handlers?: HandlerMap) {
    bindMessageEventHandlers(socket, handlers || {});
    bindRoomEventHandlers(socket, handlers || {});
    bindUserEventHandlers(socket, handlers || {});
    bindErrorEventHandlers(socket, handlers || {});
    bindSupportAdminEventHandlers(socket, handlers || {});
  }

  // Remove tất cả event handlers
  static removeEventHandlers() {
    // This will be handled by the socket instance when it's disconnected
  }
}
