import { create } from "zustand";
import { StoreMessage, ChatRoom, NotificationData } from "@web/types/chat";

interface ChatState {
  messages: StoreMessage[];
  rooms: ChatRoom[];
  notifications: NotificationData[];
  addMessage: (msg: StoreMessage) => void;
  updateMessage: (messageId: string, updates: Partial<StoreMessage>) => void;
  deleteMessage: (messageId: string) => void;
  updateReaction: (messageId: string, reaction: string) => void;
  updateRoom: (room: ChatRoom) => void;
  addNotification: (notification: NotificationData) => void;
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
      rooms: state.rooms.map((r) => (r._id === room._id ? room : r)),
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
