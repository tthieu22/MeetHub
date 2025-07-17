import { create } from "zustand";
import {
  ChatRoom,
  Message,
  UsersOnline,
  RoomMemberInfo,
} from "@web/types/chat";

export interface Notification {
  id: string;
  type: string;
  content: string;
  createdAt: number;
}

export type { ChatState };

interface ChatState {
  // All rooms
  rooms: ChatRoom[];
  // All message for room
  messages: Record<string, Message[]>;
  // Tin nhắn chưa đọc
  unreadCounts: Record<string, number>;
  // Phòng hiện tại
  currentRoomId: string | null;
  // Trạng thái online của người dùng
  onlineUsers: Record<string, boolean>;
  // Thành viê online trong từng phòng
  roomOnlineMembers: Record<string, string[]>;
  // Tất cả người dùng đang online
  allOnline: UsersOnline[];

  // Danh sách các popup chat đang mở
  openedPopups: string[];

  // Gán lại toàn bộ danh sách phòng chat
  setRooms: (rooms: ChatRoom[]) => void;

  // Thêm một phòng chat mới
  addRoom: (room: ChatRoom) => void;

  // Cập nhật thông tin một phòng chat
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void;

  // Gán lại toàn bộ tin nhắn cho một phòng
  setMessages: (roomId: string, messages: Message[]) => void;

  // Thêm một tin nhắn mới vào phòng
  addMessage: (roomId: string, message: Message) => void;

  // Thêm nhiều tin nhắn vào đầu danh sách (load lịch sử)
  prependMessages: (roomId: string, messages: Message[]) => void;

  // Gán số lượng tin chưa đọc cho một phòng
  setUnreadCount: (roomId: string, count: number) => void;

  // Cập nhật số lượng tin chưa đọc cho một phòng
  updateUnreadCount: (roomId: string, count: number) => void;

  // Cập nhật room id current hiện tại của người dùng hiện tại
  setCurrentRoomId: (roomId: string) => void;

  // Gán lại trạng thái online/offline của tất cả user
  setOnlineUsers: (users: Record<string, boolean>) => void;

  // Gán lại danh sách tất cả user online
  setAllOnline: (users: UsersOnline[]) => void;

  // Cập nhật trạng thái online cho một user
  setUserOnline: (userId: string, online: boolean) => void;

  // Cập nhật trạng thái online của user trong một phòng
  updateRoomOnlineStatus: (
    roomId: string,
    userId: string,
    isOnline: boolean
  ) => void;

  setRoomOnlineMembers: (roomId: string, onlineMemberIds: string[]) => void;

  clearChat: () => void;

  // Sửa nội dung tin nhắn
  editMessage: (roomId: string, messageId: string, newContent: string) => void;
  // Xóa tin nhắn khỏi phòng
  deleteMessage: (roomId: string, messageId: string) => void;
  // Thêm mới hoặc cập nhật tin nhắn
  addOrUpdateMessage: (roomId: string, message: Message) => void;
  // Xóa phòng khỏi danh sách
  removeRoom: (roomId: string) => void;
  // Rời khỏi phòng chat
  leaveRoom: (roomId: string) => void;
  // Thêm thành viên vào phòng
  addMemberToRoom: (roomId: string, user: RoomMemberInfo) => void;
  // Xóa thành viên khỏi phòng
  removeMemberFromRoom: (roomId: string, userId: string) => void;
  // Thêm tin nhắn dạng file/media
  addMediaMessage: (roomId: string, mediaMessage: Message) => void;
  // Xóa file/media khỏi phòng
  removeMediaMessage: (roomId: string, messageId: string) => void;
  // Tìm kiếm tin nhắn trong phòng
  searchMessages: (roomId: string, keyword: string) => Message[];
  // Đánh dấu user đang gõ trong phòng
  typingUsers: Record<string, string[]>; // roomId -> [userId]
  setTyping: (roomId: string, userId: string, isTyping: boolean) => void;
  hasMoreMessages: Record<string, boolean>;
  setHasMoreMessages: (roomId: string, hasMore: boolean) => void;
  reactToMessage: (
    roomId: string,
    messageId: string,
    reaction: { userId: string; emoji: string }
  ) => void;
  // Lưu thông báo liên quan đến phòng/chat
  // setNotification: (roomId: string, notification: Notification) => void;
  // Xóa thông báo của phòng khi đã đọc
  // clearNotifications: (roomId: string) => void;
  // Lưu trạng thái kết nối socket
  // setConnectionStatus: (status: string) => void;
  // Ghim tin nhắn quan trọng
  // pinMessage: (roomId: string, messageId: string) => void;
  // Thả cảm xúc cho tin nhắn
  // reactToMessage: (roomId: string, messageId: string, reaction: string) => void;
  // Tải thêm lịch sử tin nhắn (phân trang)
  // loadMoreMessages: (roomId: string, beforeMessageId: string) => void;
  // Thêm popup chat đang mở
  addPopup: (roomId: string) => void;
  // Xóa popup chat đang mở
  removePopup: (roomId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  messages: {},
  unreadCounts: {},
  currentRoomId: null,
  onlineUsers: {},
  roomOnlineMembers: {},
  allOnline: [],
  openedPopups: [],
  typingUsers: {},
  hasMoreMessages: {},

  setRooms: (rooms: ChatRoom[]) => {
    set({ rooms });
  },

  addRoom: (room: ChatRoom) => {
    const { rooms } = get();
    set({ rooms: [...rooms, room] });
  },

  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => {
    const { rooms } = get();
    set({
      rooms: rooms.map((room) =>
        room.roomId === roomId ? { ...room, ...updates } : room
      ),
    });
  },

  setMessages: (roomId: string, messages: Message[]) => {
    const { messages: currentMessages } = get();
    const uniqueMessages = Array.from(
      new Map(messages.map((m) => [m._id, m])).values()
    );
    set({
      messages: { ...currentMessages, [roomId]: uniqueMessages },
    });
  },

  addMessage: (roomId: string, message: Message) => {
    const { messages: currentMessages } = get();
    const roomMessages = currentMessages[roomId] || [];
    // Lọc trùng _id
    const uniqueMessages = Array.from(
      new Map([...roomMessages, message].map((m) => [m._id, m])).values()
    );
    set({
      messages: {
        ...currentMessages,
        [roomId]: uniqueMessages,
      },
    });
  },

  prependMessages: (roomId: string, messages: Message[]) => {
    const { messages: currentMessages } = get();
    const roomMessages = currentMessages[roomId] || [];
    // Lọc trùng _id
    const uniqueMessages = Array.from(
      new Map([...messages, ...roomMessages].map((m) => [m._id, m])).values()
    );
    set({
      messages: {
        ...currentMessages,
        [roomId]: uniqueMessages,
      },
    });
  },

  setUnreadCount: (roomId: string, count: number) => {
    const { unreadCounts } = get();
    // Only update if the count actually changed
    if (unreadCounts[roomId] !== count) {
      set({
        unreadCounts: { ...unreadCounts, [roomId]: count },
      });
    }
  },

  updateUnreadCount: (roomId: string, count: number) => {
    const { unreadCounts } = get();
    // Only update if the count actually changed
    if (unreadCounts[roomId] !== count) {
      set({
        unreadCounts: { ...unreadCounts, [roomId]: count },
      });
    }
  },

  setCurrentRoomId: (roomId: string) => set({ currentRoomId: roomId }),

  setOnlineUsers: (users: Record<string, boolean>) => {
    set({ onlineUsers: users });
  },

  setAllOnline: (users: UsersOnline[]) => {
    set({ allOnline: users });
  },

  setUserOnline: (userId: string, online: boolean) => {
    const { onlineUsers } = get();
    if (onlineUsers[userId] !== online) {
      set({
        onlineUsers: { ...onlineUsers, [userId]: online },
      });
    }
  },

  updateRoomOnlineStatus: (
    roomId: string,
    userId: string,
    isOnline: boolean
  ) => {
    const { rooms, roomOnlineMembers } = get();
    const roomIndex = rooms.findIndex((room) => room.roomId === roomId);

    if (roomIndex === -1) {
      return;
    }

    const room = rooms[roomIndex];
    const currentOnlineIds = room.onlineMemberIds || [];
    let newOnlineIds: string[];

    if (isOnline) {
      newOnlineIds = currentOnlineIds.includes(userId)
        ? currentOnlineIds
        : [...currentOnlineIds, userId];
    } else {
      newOnlineIds = currentOnlineIds.filter((id) => id !== userId);
    }

    // Only update if the online members actually changed
    if (JSON.stringify(currentOnlineIds) !== JSON.stringify(newOnlineIds)) {
      const updatedRooms = rooms.map((room, index) => {
        if (index === roomIndex) {
          return {
            ...room,
            onlineMemberIds: newOnlineIds,
          };
        }
        return room;
      });

      set({
        rooms: updatedRooms,
        roomOnlineMembers: {
          ...roomOnlineMembers,
          [roomId]: newOnlineIds,
        },
      });
    }
  },

  setRoomOnlineMembers: (roomId: string, onlineMemberIds: string[]) => {
    const { roomOnlineMembers, rooms } = get();
    const currentMembers = roomOnlineMembers[roomId] || [];

    // Only update if the members actually changed
    if (JSON.stringify(currentMembers) !== JSON.stringify(onlineMemberIds)) {
      // Update roomOnlineMembers
      set((state) => ({
        roomOnlineMembers: {
          ...state.roomOnlineMembers,
          [roomId]: onlineMemberIds,
        },
      }));

      // Also update the room's onlineMemberIds
      const updatedRooms = rooms.map((room) => {
        if (room.roomId === roomId) {
          return {
            ...room,
            onlineMemberIds: onlineMemberIds,
          };
        }
        return room;
      });

      set({ rooms: updatedRooms });
    }
  },

  clearChat: () => {
    set({
      rooms: [],
      messages: {},
      unreadCounts: {},
      currentRoomId: null,
      onlineUsers: {},
      roomOnlineMembers: {},
      allOnline: [],
      openedPopups: [],
      typingUsers: {},
      hasMoreMessages: {},
    });
  },

  editMessage: (roomId, messageId, newContent) => {
    const { messages: currentMessages } = get();
    const roomMessages = currentMessages[roomId] || [];
    const updatedMessages = roomMessages.map((msg) =>
      msg._id === messageId ? { ...msg, text: newContent } : msg
    );
    set({
      messages: { ...currentMessages, [roomId]: updatedMessages },
    });
  },
  deleteMessage: (roomId, messageId) => {
    const { messages: currentMessages } = get();
    const roomMessages = currentMessages[roomId] || [];
    const updatedMessages = roomMessages.filter((msg) => msg._id !== messageId);
    set({
      messages: { ...currentMessages, [roomId]: updatedMessages },
    });
  },
  addOrUpdateMessage: (roomId, message) => {
    const { messages: currentMessages } = get();
    const roomMessages = currentMessages[roomId] || [];
    const exists = roomMessages.find((msg) => msg._id === message._id);
    let updatedMessages;
    if (exists) {
      updatedMessages = roomMessages.map((msg) =>
        msg._id === message._id ? { ...msg, ...message } : msg
      );
    } else {
      updatedMessages = [...roomMessages, message];
    }
    set({
      messages: { ...currentMessages, [roomId]: updatedMessages },
    });
  },
  removeRoom: (roomId) => {
    const { rooms, messages, unreadCounts, roomOnlineMembers } = get();
    set({
      rooms: rooms.filter((room) => room.roomId !== roomId),
      messages: Object.fromEntries(
        Object.entries(messages).filter(([rid]) => rid !== roomId)
      ),
      unreadCounts: Object.fromEntries(
        Object.entries(unreadCounts).filter(([rid]) => rid !== roomId)
      ),
      roomOnlineMembers: Object.fromEntries(
        Object.entries(roomOnlineMembers).filter(([rid]) => rid !== roomId)
      ),
    });
  },

  leaveRoom: (roomId) => {
    get().removeRoom(roomId);
    if (get().currentRoomId === roomId) {
      set({ currentRoomId: null });
    }
  },

  addMemberToRoom: (roomId, user) => {
    const { rooms } = get();
    set({
      rooms: rooms.map((room) =>
        room.roomId === roomId &&
        !room.members.some((m) => m.userId === user.userId)
          ? { ...room, members: [...room.members, user] }
          : room
      ),
    });
  },
  removeMemberFromRoom: (roomId, userId) => {
    const { rooms } = get();
    set({
      rooms: rooms.map((room) =>
        room.roomId === roomId
          ? {
              ...room,
              members: room.members.filter((m) => m.userId !== userId),
            }
          : room
      ),
    });
  },

  searchMessages: (roomId, keyword) => {
    const { messages: currentMessages } = get();
    const roomMessages = currentMessages[roomId] || [];
    return roomMessages.filter(
      (msg) =>
        msg.text && msg.text.toLowerCase().includes(keyword.toLowerCase())
    );
  },

  addMediaMessage: (roomId, mediaMessage) => {
    get().addMessage(roomId, mediaMessage);
  },
  removeMediaMessage: (roomId, messageId) => {
    get().deleteMessage(roomId, messageId);
  },

  addPopup: (roomId: string) => {
    set((state) => {
      let newPopups = state.openedPopups.filter((id) => id !== roomId);
      if (newPopups.length >= 2) {
        newPopups = newPopups.slice(1); // chỉ giữ lại popup cuối cùng
      }
      return { openedPopups: [...newPopups, roomId] };
    });
  },

  removePopup: (roomId: string) =>
    set((state) => ({
      openedPopups: state.openedPopups.filter((id) => id !== roomId),
    })),

  setTyping: (roomId, userId, isTyping) => {
    set((state) => {
      const current = state.typingUsers[roomId] || [];
      let updated: string[];
      if (isTyping) {
        updated = current.includes(userId) ? current : [...current, userId];
      } else {
        updated = current.filter((id) => id !== userId);
      }
      return {
        typingUsers: { ...state.typingUsers, [roomId]: updated },
      };
    });
  },
  setHasMoreMessages: (roomId, hasMore) => {
    set((state) => ({
      hasMoreMessages: { ...state.hasMoreMessages, [roomId]: hasMore },
    }));
  },
  reactToMessage: (roomId, messageId, reaction) => {
    set((state) => {
      const roomMessages = state.messages[roomId] || [];
      const updatedMessages = roomMessages.map((msg) => {
        if (msg._id !== messageId) return msg;
        // Xử lý reactions: nếu user đã có reaction thì update, chưa có thì thêm mới
        let reactions = msg.reactions || [];
        const idx = reactions.findIndex((r) => r.userId === reaction.userId);
        if (idx !== -1) {
          reactions = reactions.map((r, i) =>
            i === idx ? { ...r, emoji: reaction.emoji } : r
          );
        } else {
          reactions = [...reactions, reaction];
        }
        return { ...msg, reactions };
      });
      return {
        messages: { ...state.messages, [roomId]: updatedMessages },
      };
    });
  },

  // setLastSeen: (roomId, userId, timestamp) => {
  //   // Đơn giản: lưu lastSeen vào room (có thể mở rộng thêm state lastSeen)
  //   // Chưa cài đặt chi tiết vì chưa có state lastSeen
  // },
  // setNotification: (roomId, notification) => {
  //   // Đơn giản: lưu notification vào room (có thể mở rộng thêm state notifications)
  //   // Chưa cài đặt chi tiết vì chưa có state notifications
  // },
  // clearNotifications: (roomId) => {
  //   // Đơn giản: xóa notification của room (có thể mở rộng thêm state notifications)
  //   // Chưa cài đặt chi tiết vì chưa có state notifications
  // },
  // setConnectionStatus: (status) => {
  //   // Đơn giản: có thể lưu vào state connectionStatus nếu muốn
  //   // Chưa cài đặt chi tiết vì chưa có state connectionStatus
  // },
  // pinMessage: (roomId, messageId) => {
  //   // Đơn giản: lưu messageId vào room (có thể mở rộng thêm state pinnedMessageId)
  //   // Chưa cài đặt chi tiết vì chưa có state pinnedMessageId
  // },
  // reactToMessage: (roomId, messageId, reaction) => {
  //   // Chưa cài đặt vì Message không có reactions, cần mở rộng type nếu muốn
  // },
  // loadMoreMessages: (roomId, beforeMessageId) => {
  //   // Chưa cài đặt chi tiết, thường sẽ gọi API để lấy thêm tin nhắn
  // },
}));
