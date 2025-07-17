// src/store/selectors/chatSelectors.ts
import { useChatStore } from "../chat.store";
import type { ChatState } from "../chat.store";
import type { ChatRoom, Message } from "@web/types/chat";

const emptyArray: Message[] = []; // Stable empty array reference

export const useRoomMessages = (roomId: string) =>
  useChatStore((state) => state.messages[roomId] || emptyArray);

export const useUnreadCount = (roomId: string) =>
  useChatStore((state) => state.unreadCounts[roomId] || 0);

export const useRoomOnlineMembers = (roomId: string) =>
  useChatStore((state) => state.roomOnlineMembers[roomId] || emptyArray);

export const useTypingUsers = (roomId: string) =>
  useChatStore((state) => state.typingUsers[roomId] || emptyArray);

export const makeMessagesSelector = (roomId: string) => (state: ChatState) =>
  state.messages[roomId] || emptyArray;

export const makeUnreadCountSelector = (roomId: string) => (state: ChatState) =>
  state.unreadCounts[roomId] || 0;

export const makeRoomSelector = (roomId: string) => (state: ChatState) =>
  state.rooms.find((r: ChatRoom) => r.roomId === roomId);
