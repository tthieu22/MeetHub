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
    if (data.success && data.data) {
      socket.emit("get_rooms");
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
      updateRoom(roomId, {
        lastMessage: {
          messageId: data.data._id,
          conversationId: data.data.conversationId,
          senderId:
            typeof data.data.senderId === "string"
              ? data.data.senderId
              : data.data.senderId._id,
          text: data.data.text,
          createdAt: data.data.createdAt,
        },
      });

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
        console.log(
          `[WebSocket] New message in room ${roomId}, incrementing unread count to ${currentUnread + 1}`
        );
      } else if (currentRoomId === roomId) {
        console.log(
          `[WebSocket] New message in current room ${roomId}, auto marking as read`
        );
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

      // Log để debug (chỉ log khi có thay đổi)
      if (unreadCount > 0) {
        console.log(
          `[WebSocket] Unread count updated for room ${roomId}: ${unreadCount}`
        );
      }
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
    // if (data.code === "TOKEN_INVALID" || data.code === "USER_INVALID") {
    //   // const { logout } = useUserStore.getState();
    //   // logout();
    //   // Redirect to login
    //   // window.location.href = "/login";
    // }
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
    console.log(`Tin nhắn mới từ ${senderName}: ${message.text}`);

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
      const { setRoomOnlineMembers, updateRoom } = useChatStore.getState();
      setRoomOnlineMembers(data.data.roomId, data.data.onlineMemberIds);
      updateRoom(data.data.roomId, {
        onlineMemberIds: data.data.onlineMemberIds,
      });
    }
  }

  // Xử lý đánh dấu đã đọc thành công
  static handleRoomMarkedRead(data: WsResponse<{ roomId: string }>) {
    if (data.success && data.data) {
      const { updateUnreadCount } = useChatStore.getState();
      updateUnreadCount(data.data.roomId, 0);
      console.log(
        `[WebSocket] Room ${data.data.roomId} marked as read, unread count reset to 0`
      );
    }
  }

  // Setup tất cả event handlers cho socket
  static setupEventHandlers(socket: Socket) {
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

    socket.on(
      "room_online_members",
      (data: WsResponse<{ roomId: string; onlineMemberIds: string[] }>) => {
        WebSocketEventHandlers.handleRoomOnlineMembers(data);
      }
    );

    socket.on("room_marked_read", (data: WsResponse<{ roomId: string }>) => {
      console.log("[WebSocket] Received room_marked_read event:", data);
      this.handleRoomMarkedRead(data);
    });
    socket.on(
      "mark_room_read_success",
      (data: WsResponse<{ roomId: string }>) => {
        console.log("[WebSocket] Received mark_room_read_success event:", data);
        this.handleRoomMarkedRead(data);
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
