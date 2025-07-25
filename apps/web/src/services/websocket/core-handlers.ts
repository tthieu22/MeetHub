import { Socket } from "socket.io-client";
import { WsResponse } from "@web/types/websocket";
import { Message, ChatRoom, UsersOnline } from "@web/types/chat";
import { useChatStore } from "@web/store/chat.store";
import { useUserStore } from "@web/store/user.store";
import { WS_EVENTS } from "@web/constants/websocket.events";

// Kết nối thành công
export function handleConnectionSuccess(
  socket: Socket,
  data: WsResponse<{ userId: string; rooms: string[] }>
) {
  console.log("[core-handlers] handleConnectionSuccess", { data });
  if (data.success && data.data) {
    socket.emit(WS_EVENTS.GET_ALL_ONLINE_USERS);
  }
}

// Nhận danh sách phòng (chỉ cập nhật store, không emit gì thêm)
export function handleRooms(data: WsResponse<ChatRoom[]>, socket?: Socket) {
  console.log("[core-handlers] handleRooms", { data, socket });
  if (data.success && data.data) {
    const { setRooms } = useChatStore.getState();
    setRooms(data.data);
  }
}

// Nhận messages
export function handleMessages(
  data: WsResponse<{
    roomId: string;
    data: Message[];
    hasMore: boolean;
    before?: string;
  }>
) {
  console.log("[core-handlers] handleMessages", { data });
  if (data.success && data.data) {
    const { roomId, data: messages } = data.data;
    const { setMessages } = useChatStore.getState();
    setMessages(roomId, messages);
  }
}

// Tin nhắn mới
export function handleNewMessage(socket: Socket, data: WsResponse<Message>) {
  console.log("[core-handlers] handleNewMessage", { data });
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
    addMessage(roomId, data.data);
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
    // Không emit mark_room_read ở đây nữa
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
      // Có thể show notification ở đây
    }
  }
}

// Cập nhật unread count
export function handleUnreadCountUpdated(
  data: WsResponse<{ roomId: string; unreadCount: number }>
) {
  console.log("[core-handlers] handleUnreadCountUpdated", { data });
  if (data.success && data.data) {
    const { updateUnreadCount } = useChatStore.getState();
    const { roomId, unreadCount } = data.data;
    updateUnreadCount(roomId, unreadCount);
  }
}

// Nhận danh sách tất cả người online
export function handleAllOnlineUsers(data: WsResponse<UsersOnline[]>) {
  console.log("[core-handlers] handleAllOnlineUsers", { data });
  if (data.success && data.data) {
    const { setAllOnline, setOnlineUsers } = useChatStore.getState();
    setAllOnline(
      data.data.map((user) => ({
        userId: user.userId,
        name: user.name,
        email: user.email,
        avatarURL: user.avatarURL,
        isOnline: user.isOnline,
      }))
    );
    const onlineUsersMap: Record<string, boolean> = {};
    data.data.forEach((user) => {
      onlineUsersMap[user.userId] = user.isOnline;
    });
    setOnlineUsers(onlineUsersMap);
  }
}

// User online
export function handleUserOnline(
  data: WsResponse<{ userId: string; roomId: string }>
) {
  console.log("[core-handlers] handleUserOnline", { data });
  if (data.success && data.data) {
    const { setUserOnline, updateRoomOnlineStatus } = useChatStore.getState();
    setUserOnline(data.data.userId, true);
    updateRoomOnlineStatus(data.data.roomId, data.data.userId, true);
  }
}

// User offline
export function handleUserOffline(
  data: WsResponse<{ userId: string; roomId: string }>
) {
  console.log("[core-handlers] handleUserOffline", { data });
  if (data.success && data.data) {
    const { setUserOnline, updateRoomOnlineStatus } = useChatStore.getState();
    setUserOnline(data.data.userId, false);
    updateRoomOnlineStatus(data.data.roomId, data.data.userId, false);
  }
}

// Lỗi
export function handleError(data: WsResponse) {
  console.log("[core-handlers] handleError", { data });
  if (data.message) {
    console.error("Error message:", data.message);
  }
}

// Lỗi xác thực
export function handleAuthError(data: WsResponse) {
  console.log("[core-handlers] handleAuthError", { data });
  if (data.code === "TOKEN_INVALID" || data.code === "USER_INVALID") {
    const { logout } = useUserStore.getState();
    logout();
    window.location.href = "/login";
  }
}

// Nhận danh sách online của phòng khi join room
export function handleRoomOnlineMembers(
  data: WsResponse<{ roomId: string; onlineMemberIds: string[] }>
) {
  console.log("[core-handlers] handleRoomOnlineMembers", { data });
  if (data.success && data.data) {
    const { setRoomOnlineMembers } = useChatStore.getState();
    setRoomOnlineMembers(data.data.roomId, data.data.onlineMemberIds);
  }
}

// Đánh dấu đã đọc thành công
export function handleRoomMarkedRead(data: WsResponse<{ roomId: string }>) {
  console.log("[core-handlers] handleRoomMarkedRead", { data });
  if (data.success && data.data) {
    const { updateUnreadCount } = useChatStore.getState();
    updateUnreadCount(data.data.roomId, 0);
  }
}
