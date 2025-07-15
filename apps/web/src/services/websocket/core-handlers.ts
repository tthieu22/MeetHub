import { Socket } from "socket.io-client";
import { WsResponse } from "@web/types/websocket";
import { Message, ChatRoom, UsersOnline } from "@web/types/chat";
import { useChatStore } from "@web/store/chat.store";
import { useUserStore } from "@web/store/user.store";

// Kết nối thành công
export function handleConnectionSuccess(
  socket: Socket,
  data: WsResponse<{ userId: string; rooms: string[] }>
) {
  if (data.success && data.data) {
    socket.emit("get_rooms");
    socket.emit("get_all_online_users");
  }
}

// Nhận danh sách phòng
export function handleRooms(data: WsResponse<ChatRoom[]>, socket?: Socket) {
  if (data.success && data.data) {
    const { setRooms } = useChatStore.getState();
    setRooms(data.data);
    if (socket) {
      data.data.forEach((room) => {
        socket.emit("get_room_online_members", { roomId: room.roomId });
        socket.emit("get_unread_count", { roomId: room.roomId });
      });
    }
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
  if (data.success && data.data) {
    const { roomId, data: messages } = data.data;
    const { setMessages } = useChatStore.getState();
    setMessages(roomId, messages);
  }
}

// Tin nhắn mới
export function handleNewMessage(socket: Socket, data: WsResponse<Message>) {
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
    if (currentRoomId === roomId) {
      socket.emit("mark_room_read", { roomId });
    }
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
  if (data.success && data.data) {
    const { updateUnreadCount } = useChatStore.getState();
    const { roomId, unreadCount } = data.data;
    updateUnreadCount(roomId, unreadCount);
  }
}

// Nhận danh sách tất cả người online
export function handleAllOnlineUsers(data: WsResponse<UsersOnline[]>) {
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
  if (data.success && data.data) {
    const { setUserOnline, updateRoomOnlineStatus } = useChatStore.getState();
    setUserOnline(data.data.userId, false);
    updateRoomOnlineStatus(data.data.roomId, data.data.userId, false);
  }
}

// Lỗi
export function handleError(data: WsResponse) {
  if (data.message) {
    console.error("Error message:", data.message);
  }
}

// Lỗi xác thực
export function handleAuthError(data: WsResponse) {
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
  if (data.success && data.data) {
    const { setRoomOnlineMembers } = useChatStore.getState();
    setRoomOnlineMembers(data.data.roomId, data.data.onlineMemberIds);
  }
}

// Đánh dấu đã đọc thành công
export function handleRoomMarkedRead(data: WsResponse<{ roomId: string }>) {
  if (data.success && data.data) {
    const { updateUnreadCount } = useChatStore.getState();
    updateUnreadCount(data.data.roomId, 0);
  }
}
