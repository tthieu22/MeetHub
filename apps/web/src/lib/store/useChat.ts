import { create } from "zustand";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  roomId: string;
  createdAt: string;
  reactions?: Record<string, string[]>;
  isRead?: boolean;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  type: "message" | "mention" | "reaction";
  message: string;
  roomId: string;
  createdAt: string;
}

interface ChatState {
  messages: Message[];
  rooms: Room[];
  notifications: Notification[];
  addMessage: (msg: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  updateReaction: (messageId: string, reaction: string) => void;
  updateRoom: (room: Room) => void;
  addNotification: (notification: Notification) => void;
  markMessageAsRead: (messageId: string) => void;
  clearMessages: () => void;
  clearNotifications: () => void;
}

export const useChat = create<ChatState>((set) => ({
  messages: [],
  rooms: [],
  notifications: [],

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),

  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    })),

  updateReaction: (messageId, reaction) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || {};
          const userReactions = reactions[reaction] || [];
          return {
            ...msg,
            reactions: {
              ...reactions,
              [reaction]: userReactions,
            },
          };
        }
        return msg;
      }),
    })),

  updateRoom: (room) =>
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === room.id ? room : r)),
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),

  markMessageAsRead: (messageId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ),
    })),

  clearMessages: () => set({ messages: [] }),
  clearNotifications: () => set({ notifications: [] }),
}));
