import { create } from "zustand";
import { ChatRoom, Message } from "@web/types/chat";

interface ChatState {
  rooms: ChatRoom[];
  messages: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  currentRoomId: string | null;
  onlineUsers: Record<string, boolean>;

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

  setRooms: (rooms: ChatRoom[]) => {
    const { rooms: oldRooms } = get();
    if (
      oldRooms.length === rooms.length &&
      oldRooms.every((r, i) => r.roomId === rooms[i].roomId)
    ) {
      return;
    }
    const mergedRooms = rooms.map((room) => {
      const oldRoom = oldRooms.find((r) => r.roomId === room.roomId);
      return {
        ...room,
        onlineMemberIds:
          oldRoom?.onlineMemberIds && oldRoom.onlineMemberIds.length > 0
            ? oldRoom.onlineMemberIds
            : room.onlineMemberIds,
      };
    });
    set({ rooms: mergedRooms });
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
    set({
      messages: { ...currentMessages, [roomId]: messages },
    });
  },

  addMessage: (roomId: string, message: Message) => {
    const { messages: currentMessages } = get();
    const roomMessages = currentMessages[roomId] || [];
    set({
      messages: {
        ...currentMessages,
        [roomId]: [...roomMessages, message],
      },
    });
  },

  prependMessages: (roomId: string, messages: Message[]) => {
    const { messages: currentMessages } = get();
    const roomMessages = currentMessages[roomId] || [];
    set({
      messages: {
        ...currentMessages,
        [roomId]: [...messages, ...roomMessages],
      },
    });
  },

  setUnreadCount: (roomId: string, count: number) => {
    const { unreadCounts } = get();
    set({
      unreadCounts: { ...unreadCounts, [roomId]: count },
    });
  },

  updateUnreadCount: (roomId: string, count: number) => {
    const { unreadCounts } = get();
    set({
      unreadCounts: { ...unreadCounts, [roomId]: count },
    });
  },

  setCurrentRoom: (roomId: string | null) => {
    set({ currentRoomId: roomId });
  },

  setOnlineUsers: (users: Record<string, boolean>) => {
    set({ onlineUsers: users });
  },

  setUserOnline: (userId: string, online: boolean) => {
    const { onlineUsers } = get();
    set({
      onlineUsers: { ...onlineUsers, [userId]: online },
    });
  },

  updateRoomOnlineStatus: (
    roomId: string,
    userId: string,
    isOnline: boolean
  ) => {
    console.log(`🔄 [Store] Updating room online status:`, {
      roomId,
      userId,
      isOnline,
    });

    const { rooms } = get();
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

    const updatedRooms = rooms.map((room, index) => {
      if (index === roomIndex) {
        return {
          ...room,
          onlineMemberIds: newOnlineIds,
        };
      }
      return room;
    });

    set({ rooms: updatedRooms });
    console.log(`✅ [Store] Room online status updated:`, {
      roomId,
      onlineMemberIds: newOnlineIds,
      updatedRooms: updatedRooms.map((r) => ({
        roomId: r.roomId,
        onlineMemberIds: r.onlineMemberIds,
      })),
    });
  },

  setRoomOnlineMembers: (roomId: string, onlineMemberIds: string[]) => {
    const { rooms } = get();
    set({
      rooms: rooms.map((room) =>
        room.roomId === roomId ? { ...room, onlineMemberIds } : room
      ),
    });
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
