import { create } from "zustand";
import { ChatRoom, Message } from "@web/types/chat";

interface ChatState {
  rooms: ChatRoom[];
  messages: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  currentRoomId: string | null;
  onlineUsers: Record<string, boolean>;
  roomOnlineMembers: Record<string, string[]>;

  // Actions
  setRooms: (rooms: ChatRoom[]) => void;
  addRoom: (room: ChatRoom) => void;
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void;

  setMessages: (roomId: string, messages: Message[]) => void;
  addMessage: (roomId: string, message: Message) => void;
  prependMessages: (roomId: string, messages: Message[]) => void;

  setUnreadCount: (roomId: string, count: number) => void;
  updateUnreadCount: (roomId: string, count: number) => void;

  setCurrentRoom: (roomId: string | null) => void;

  setOnlineUsers: (users: Record<string, boolean>) => void;
  setUserOnline: (userId: string, online: boolean) => void;
  updateRoomOnlineStatus: (
    roomId: string,
    userId: string,
    isOnline: boolean
  ) => void;

  setRoomOnlineMembers: (roomId: string, onlineMemberIds: string[]) => void;

  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  messages: {},
  unreadCounts: {},
  currentRoomId: null,
  onlineUsers: {},
  roomOnlineMembers: {},

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
    // Lọc trùng _id
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

  setCurrentRoom: (roomId: string | null) => {
    const { currentRoomId } = get();
    // Only update if the room actually changed
    if (currentRoomId !== roomId) {
      set({ currentRoomId: roomId });
    }
  },

  setOnlineUsers: (users: Record<string, boolean>) => {
    set({ onlineUsers: users });
  },

  setUserOnline: (userId: string, online: boolean) => {
    const { onlineUsers } = get();
    // Only update if the status actually changed
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
    });
  },
}));
